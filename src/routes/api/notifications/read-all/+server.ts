import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function POST({ cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const result = await database.collection('notifications').updateMany(
    { userId: user.id, read: { $ne: true } }, { $set: { read: true } }
  );
  return json({ ok: true, updated: result.modifiedCount });
}
