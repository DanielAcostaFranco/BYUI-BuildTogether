import { error, redirect } from '@sveltejs/kit';
import { getSessionUser, normalizeEmail } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function load({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, `/login?next=${encodeURIComponent(`/invitations/${params.id}`)}`);
  const invitation = await database.collection('teamInvitations').findOne({ id: params.id, email: normalizeEmail(user.email) });
  if (!invitation) error(404, 'Invitation not found for this account. Sign in with the invited email address.');
  const project = await database.collection('projects').findOne({ id: invitation.projectId }, { projection: { _id: 0, id: 1, title: 1, creatorId: 1 } });
  if (!project) error(404, 'Project not found.');
  const creator = await database.collection('users').findOne({ id: project.creatorId }, { projection: { firstName: 1, lastName: 1 } });
  return {
    invitation: { id: invitation.id, email: invitation.email, roleTitle: invitation.roleTitle, status: invitation.status, expired: invitation.expiresAt <= new Date() },
    project: { id: project.id, title: project.title, creatorName: [creator?.firstName, creator?.lastName].filter(Boolean).join(' ') || 'A project creator' }
  };
}
