import { error, redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';

export async function load({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, '/login');
  const { projects } = await getProjects();
  const project = projects.find((item) => item.id === params.id);
  if (!project) error(404, 'Project not found.');
  if (project.creatorId !== user.id) error(403, 'Only the project creator can edit it.');
  return { project };
}
