import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';

export async function load({ cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, '/login');
  const { projects } = await getProjects();
  const mine = projects.filter((project) => project.creatorId === user.id);
  const projectsWithApplications = await Promise.all(mine.map(async (project) => ({ ...project, currentMembers: await database.collection('projectMembers').countDocuments({ projectId: project.id }) || 1, pendingApplications: await database.collection('projectApplications').countDocuments({ projectId: project.id, status: 'pending' }) })));
  return { projects: projectsWithApplications };
}
