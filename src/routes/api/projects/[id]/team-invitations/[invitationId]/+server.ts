import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function DELETE({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const project = await database.collection('projects').findOne({ id: params.id, creatorId: user.id });
  if (!project) return json({ ok: false, message: 'Only the project creator can cancel invitations.' }, { status: 403 });
  const result = await database.collection('teamInvitations').updateOne(
    { id: params.invitationId, projectId: params.id, status: 'pending' },
    { $set: { status: 'cancelled', cancelledAt: new Date() } }
  );
  return json({ ok: result.modifiedCount > 0, message: result.modifiedCount ? 'Invitation cancelled.' : 'Invitation not found.' }, { status: result.modifiedCount ? 200 : 404 });
}
