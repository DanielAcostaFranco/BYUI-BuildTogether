import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';

export async function load({ cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (user) redirect(303, '/home');
  const [projectsData, registeredUserCount] = await Promise.all([
    getProjects(),
    database.collection('users').countDocuments({})
  ]);
  return { ...projectsData, registeredUserCount };
}
