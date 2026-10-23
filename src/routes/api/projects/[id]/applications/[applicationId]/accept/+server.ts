import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function POST({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const project = await database.collection('projects').findOne({ id: params.id });
  if (!project) return json({ ok: false, message: 'Project not found.' }, { status: 404 });
  if (project.creatorId !== user.id) return json({ ok: false, message: 'Only the project creator can accept applications.' }, { status: 403 });
  const application = await database.collection('projectApplications').findOne({ id: params.applicationId, projectId: params.id, status: 'pending' });
  if (!application) return json({ ok: false, message: 'Application not found or already reviewed.' }, { status: 404 });
  const members = await database.collection('projectMembers').countDocuments({ projectId: params.id });
  if (members >= (project.teamSize ?? (project.openRoles ?? 0) + 1)) return json({ ok: false, message: 'This team is already full.' }, { status: 400 });
  await database.collection('projectMembers').insertOne({ id: `membership-${randomUUID()}`, projectId: params.id, userId: application.applicantId, role: 'Member', joinedAt: new Date() });
  await database.collection('projectApplications').updateOne({ id: params.applicationId }, { $set: { status: 'accepted', updatedAt: new Date() } });
  await database.collection('notifications').insertOne({
    id: `notification-${randomUUID()}`,
    userId: application.applicantId,
    type: 'application_accepted',
    title: 'You joined a project',
    message: `Your application for ${project.title} was accepted.`,
    projectId: params.id,
    read: false,
    createdAt: new Date()
  });
  return json({ ok: true, message: 'Applicant accepted.' });
}
