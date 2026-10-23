import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { applicationSchema } from '$lib/schemas';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function POST({ params, request, cookies }) {
  const result = applicationSchema.safeParse(await request.json().catch(() => ({})));
  if (!result.success) return json({ ok: false, message: result.error.issues[0]?.message ?? 'Please check your message.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in to join a project.' }, { status: 401 });
  const project = await database.collection('projects').findOne({ id: params.id });
  if (!project) return json({ ok: false, message: 'Project not found.' }, { status: 404 });
  if (project.creatorId === user.id) return json({ ok: false, message: 'You already own this project.' }, { status: 400 });
  const existing = await database.collection('projectApplications').findOne({ projectId: params.id, applicantId: user.id, status: { $in: ['pending', 'accepted'] } });
  if (existing) return json({ ok: false, message: existing.status === 'accepted' ? 'You are already on this team.' : 'Your application is already pending.' }, { status: 409 });
  const members = await database.collection('projectMembers').countDocuments({ projectId: params.id });
  if (members >= (project.teamSize ?? (project.openRoles ?? 0) + 1)) return json({ ok: false, message: 'This team is already full.' }, { status: 400 });
  const applicationId = `application-${randomUUID()}`;
  const createdAt = new Date();
  await database.collection('projectApplications').insertOne({ id: applicationId, projectId: params.id, applicantId: user.id, message: result.data.message, status: 'pending', createdAt, updatedAt: createdAt });
  await database.collection('notifications').updateOne(
    { id: `notification-${applicationId}` },
    { $setOnInsert: {
      id: `notification-${applicationId}`,
      userId: project.creatorId,
      type: 'application_received',
      title: 'New request to join',
      message: `${[user.firstName, user.lastName].filter(Boolean).join(' ') || 'A student'} wants to join ${project.title}.`,
      projectId: params.id,
      applicationId,
      read: false,
      createdAt
    } },
    { upsert: true }
  );
  return json({ ok: true, message: 'Application sent.' }, { status: 201 });
}
