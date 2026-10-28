import { randomUUID } from 'node:crypto';
import type { ClientSession, Db } from 'mongodb';

export async function closePendingApplications(database: Db, session: ClientSession, project: { id: string; title: string }, roleId?: string) {
  const filter = { projectId: project.id, status: 'pending', ...(roleId ? { roleId } : {}) };
  const applications = await database.collection('projectApplications').find(filter, { session, projection: { _id: 1, applicantId: 1 } }).toArray();
  if (!applications.length) return;
  const now = new Date();
  await database.collection('projectApplications').updateMany({ _id: { $in: applications.map((application) => application._id) } }, { $set: { status: 'closed', updatedAt: now } }, { session });
  await database.collection('notifications').insertMany(applications.map((application) => ({
    id: `notification-${randomUUID()}`, userId: application.applicantId, type: 'application_closed',
    title: 'Position no longer available', message: `Recruitment for ${project.title} has closed for this position.`,
    projectId: project.id, read: false, createdAt: now
  })), { session });
}
