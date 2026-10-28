import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjectAccess } from '$lib/server/project-access';

export async function POST({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const access = await getProjectAccess(database, params.id, user.id);
  if (!access.role) return json({ ok: false, message: 'You are not on this team.' }, { status: 403 });
  if (access.role === 'owner') return json({ ok: false, message: 'The owner cannot leave the project. Transfer ownership or delete the project instead.' }, { status: 409 });
  await database.collection('projectMembers').deleteOne({ projectId: params.id, userId: user.id });
  return json({ ok: true, message: 'You left the team.' });
}
