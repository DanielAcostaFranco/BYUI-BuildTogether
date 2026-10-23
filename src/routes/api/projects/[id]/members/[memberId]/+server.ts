import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function DELETE({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const project = await database.collection('projects').findOne({ id: params.id, creatorId: user.id });
  if (!project) return json({ ok: false, message: 'Only the project creator can manage this team.' }, { status: 403 });
  const member = await database.collection('projectMembers').findOne({ id: params.memberId, projectId: params.id });
  if (!member) return json({ ok: false, message: 'Team member not found.' }, { status: 404 });
  if (member.userId === user.id) return json({ ok: false, message: 'The project creator cannot be removed from the team.' }, { status: 400 });
  await database.collection('projectMembers').deleteOne({ id: params.memberId, projectId: params.id });
  return json({ ok: true, message: 'Team member removed.' });
}
