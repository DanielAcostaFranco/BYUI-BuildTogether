import { redirect } from '@sveltejs/kit';
import { hashSessionToken } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function POST({ cookies }) {
  const token = cookies.get('buildtogether_session');
  if (token) {
    const database = await getDatabase();
    await database.collection('sessions').deleteOne({ tokenHash: hashSessionToken(token) });
  }

  cookies.delete('buildtogether_session', { path: '/' });
  redirect(303, '/');
}
