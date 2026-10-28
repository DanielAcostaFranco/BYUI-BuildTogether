import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { getSessionUser, normalizeEmail } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function POST({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'Sign in with the invited email address.' }, { status: 401 });
  const invitation = await database.collection('teamInvitations').findOne(
    { id: params.id, email: normalizeEmail(user.email), status: 'pending' },
    { projection: { _id: 1, id: 1, projectId: 1, roleTitle: 1, expiresAt: 1 } }
  );
  if (!invitation) return json({ ok: false, message: 'Invitation not found or already closed.' }, { status: 404 });
  if (invitation.expiresAt <= new Date()) return json({ ok: false, message: 'This invitation has expired.' }, { status: 410 });
  const result = await database.collection('teamInvitations').updateOne(
    { id: params.id, email: normalizeEmail(user.email), status: 'pending', expiresAt: { $gt: new Date() } },
    { $set: { status: 'rejected', rejectedAt: new Date() } }
  );
  if (!result.matchedCount) return json({ ok: false, message: 'Invitation not found or already closed.' }, { status: 404 });
  const project = await database.collection('projects').findOne({ id: invitation.projectId }, { projection: { creatorId: 1, title: 1 } });
  if (project) await database.collection('notifications').insertOne({
    id: `notification-${randomUUID()}`, userId: project.creatorId, type: 'team_invitation_rejected',
    title: 'Team invitation declined', message: `${user.firstName || user.email} declined the invitation to join ${project.title}.`,
    projectId: invitation.projectId, invitationId: invitation.id, read: false, createdAt: new Date()
  });
  return json({ ok: true, message: 'Invitation declined.' });
}
