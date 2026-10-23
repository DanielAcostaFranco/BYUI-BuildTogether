import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function POST({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const result = await database.collection('notifications').updateOne(
    { id: params.id, userId: user.id }, { $set: { read: true } }
  );
  if (!result.matchedCount) return json({ ok: false, message: 'Notification not found.' }, { status: 404 });
  return json({ ok: true });
}
