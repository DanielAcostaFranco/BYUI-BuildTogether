import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';

export async function load({ cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, '/login');
  return {
    ...(await getProjects()),
    user: { firstName: user.firstName ?? '', lastName: user.lastName ?? '', email: user.email, role: user.role }
  };
}
