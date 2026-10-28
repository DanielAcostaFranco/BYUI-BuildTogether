import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function load({ cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, '/login');

  const notifications = await database.collection('notifications')
    .find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return {
    notifications: notifications.map(({ id, title, message, type, projectId, invitationId, createdAt, read }) => ({
      id, title, message, type, projectId, invitationId, createdAt, read: read === true
    }))
  };
}
