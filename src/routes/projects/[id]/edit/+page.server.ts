import { error, redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';
import { canManageProject, getProjectAccess } from '$lib/server/project-access';

export async function load({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, '/login');
  const { projects } = await getProjects();
  const project = projects.find((item) => item.id === params.id);
  if (!project) error(404, 'Project not found.');
  const access = await getProjectAccess(database, params.id, user.id);
  if (!canManageProject(access.role)) error(403, 'Only the owner or an admin can edit this project.');
  return { project };
}
