import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function POST({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const project = await database.collection('projects').findOne({ id: params.id, creatorId: user.id });
  if (!project) return json({ ok: false, message: 'Only the project creator can review applications.' }, { status: 403 });
  const application = await database.collection('projectApplications').findOne({ id: params.applicationId, projectId: params.id, status: 'pending' });
  if (!application) return json({ ok: false, message: 'Application not found or already reviewed.' }, { status: 404 });
  const result = await database.collection('projectApplications').updateOne({ id: params.applicationId, projectId: params.id, status: 'pending' }, { $set: { status: 'rejected', updatedAt: new Date() } });
  if (!result.matchedCount) return json({ ok: false, message: 'Application not found or already reviewed.' }, { status: 404 });
  await database.collection('notifications').insertOne({
    id: `notification-${randomUUID()}`,
    userId: application.applicantId,
    type: 'application_rejected',
    title: 'Application update',
    message: `Your application for ${project.title} was not accepted this time.`,
    projectId: params.id,
    read: false,
    createdAt: new Date()
  });
  return json({ ok: true, message: 'Applicant declined.' });
}
