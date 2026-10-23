import { error, redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';

type TeamMember = { id: string; userId: string; role: string; joinedAt: Date };

export async function load({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, '/login');
  const { projects } = await getProjects();
  const project = projects.find((item) => item.id === params.id);
  if (!project) error(404, 'Project not found.');
  if (project.creatorId !== user.id) error(403, 'Only the project creator can manage this team.');
  const members = await database.collection<TeamMember>('projectMembers').find({ projectId: params.id }, { projection: { _id: 0, id: 1, userId: 1, role: 1, joinedAt: 1 } }).sort({ joinedAt: 1 }).toArray();
  const users = await database.collection('users').find({ id: { $in: members.map((member) => member.userId) } }, { projection: { _id: 0, id: 1, firstName: 1, lastName: 1, email: 1, major: 1, skills: 1, avatar: 1 } }).toArray();
  const usersById = new Map(users.map((member) => [member.id, member]));
  return {
    project,
    members: members.map((member) => ({ ...member, user: usersById.get(member.userId) ?? null }))
  };
}
