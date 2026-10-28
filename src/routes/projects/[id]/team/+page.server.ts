import { error, redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';
import { roleVacancies } from '$lib/project-flow';
import type { ProjectRole } from '$lib/types';
import { canManageProject, getProjectAccess } from '$lib/server/project-access';

type TeamMember = { id: string; userId: string; roleId?: string; role: string; joinedAt: Date };

export async function load({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, '/login');
  const { projects } = await getProjects();
  const project = projects.find((item) => item.id === params.id);
  if (!project) error(404, 'Project not found.');
  const access = await getProjectAccess(database, params.id, user.id);
  if (!canManageProject(access.role)) error(403, 'Only the owner or an admin can manage this team.');
  const members = await database.collection<TeamMember>('projectMembers').find({ projectId: params.id }, { projection: { _id: 0, id: 1, userId: 1, roleId: 1, role: 1, joinedAt: 1 } }).sort({ joinedAt: 1 }).toArray();
  const users = await database.collection('users').find({ id: { $in: members.map((member) => member.userId) } }, { projection: { _id: 0, id: 1, firstName: 1, lastName: 1, email: 1, major: 1, skills: 1, avatarUrl: 1 } }).toArray();
  const usersById = new Map(users.map((member) => [member.id, member]));
  const invitations = await database.collection('teamInvitations').find({ projectId: params.id, status: 'pending', expiresAt: { $gt: new Date() } }, { projection: { _id: 0, id: 1, email: 1, roleTitle: 1, expiresAt: 1 } }).sort({ createdAt: -1 }).toArray();
  return {
    project,
    members: members.map((member) => ({ ...member, user: usersById.get(member.userId) ?? null })),
    vacancies: roleVacancies((project.roles ?? []) as ProjectRole[], members),
    invitations
    ,accessRole: access.role
  };
}
