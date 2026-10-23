import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function load({ cookies }) {
  const token = cookies.get('buildtogether_session');
  if (!token) return { signedIn: false, unreadNotifications: 0 };

  const database = await getDatabase();
  const user = await getSessionUser(database, token);
  if (!user) return { signedIn: false, unreadNotifications: 0 };
  return {
    signedIn: true,
    unreadNotifications: await database.collection('notifications').countDocuments({ userId: user.id, read: { $ne: true } })
  };
}
