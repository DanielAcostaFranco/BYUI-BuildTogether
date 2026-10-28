import { json } from '@sveltejs/kit';
import { getSessionUser, normalizeEmail } from '$lib/server/auth';
import { getDatabase, getMongoClient } from '$lib/server/mongodb';
import { addTeamMember } from '$lib/server/team-members';

export async function POST({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'Sign in with the invited email address.' }, { status: 401 });
  const session = (await getMongoClient()).startSession();
  try {
    const outcome = await session.withTransaction(async () => {
      const invitation = await database.collection('teamInvitations').findOne({ id: params.id, email: normalizeEmail(user.email), status: 'pending' }, { session });
      if (!invitation) return { status: 404, message: 'Invitation not found or already used.' };
      if (invitation.expiresAt <= new Date()) return { status: 410, message: 'This invitation has expired.' };
      const project = await database.collection('projects').findOne({ id: invitation.projectId }, { session });
      if (!project) return { status: 404, message: 'Project not found.' };
      const added = await addTeamMember(database, session, project, { id: user.id as string }, invitation.roleId);
      if (added.status !== 200) return added;
      await database.collection('teamInvitations').updateOne({ _id: invitation._id, status: 'pending' }, { $set: { status: 'accepted', acceptedAt: new Date() } }, { session });
      await database.collection('teamInvitations').updateMany(
        { projectId: invitation.projectId, email: invitation.email, id: { $ne: invitation.id }, status: 'pending' },
        { $set: { status: 'cancelled', cancelledAt: new Date() } }, { session }
      );
      await database.collection('notifications').insertOne({
        id: `notification-${invitation.id}-accepted`, userId: project.creatorId, type: 'team_invitation_accepted',
        title: 'Team invitation accepted',
        message: `${user.firstName || user.email} accepted the invitation to join ${project.title} as ${invitation.roleTitle}.`,
        projectId: project.id, invitationId: invitation.id, read: false, createdAt: new Date()
      }, { session });
      return { status: 200, message: 'You joined the team.' };
    });
    return json({ ok: outcome?.status === 200, message: outcome?.message }, { status: outcome?.status ?? 500 });
  } finally { await session.endSession(); }
}
