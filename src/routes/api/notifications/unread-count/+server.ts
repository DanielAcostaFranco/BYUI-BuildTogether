import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function GET({ cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const unread = await database.collection('notifications').countDocuments({ userId: user.id, read: { $ne: true } });
  return json({ ok: true, unread });
}
