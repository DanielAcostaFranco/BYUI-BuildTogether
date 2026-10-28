import { error, redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjectAccess } from '$lib/server/project-access';

function visibleUser(user: any, currentUserId: string, userId: string, projectId: string) {
  const savedVisibility = user.teamProfileVisibility ?? {};
  const visibility = savedVisibility[projectId] ?? (typeof savedVisibility.major === 'boolean' ? savedVisibility : {});
  const show = (key: string) => userId === currentUserId || visibility[key] === true;
  return {
    id: user.id, firstName: user.firstName ?? '', lastName: user.lastName ?? '', email: user.email,
    avatarUrl: show('avatar') ? user.avatarUrl ?? null : null,
    major: show('major') ? user.major ?? '' : '', graduationYear: show('graduationYear') ? user.graduationYear ?? null : null,
    bio: show('bio') ? user.bio ?? '' : '', skills: show('skills') ? user.skills ?? [] : [],
    interests: show('interests') ? user.interests ?? [] : [], links: show('links') ? user.links ?? [] : [],
    previousProjects: show('previousProjects') ? user.previousProjects ?? [] : []
  };
}

export async function load({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, `/login?next=${encodeURIComponent(`/projects/${params.id}/workspace`)}`);
  const access = await getProjectAccess(database, params.id, user.id);
  if (!access.project) error(404, 'Project not found.');
  if (!access.role) error(403, 'This workspace is only available to accepted team members.');

  const projectMembers = await database.collection<any>('projectMembers').find({ projectId: params.id }, { projection: { _id: 0, id: 1, userId: 1, roleId: 1, role: 1, accessRole: 1, joinedAt: 1 } }).sort({ joinedAt: 1 }).toArray();
  const users = await database.collection<any>('users').find({ id: { $in: projectMembers.map((member) => member.userId) } }, { projection: { _id: 0, id: 1, firstName: 1, lastName: 1, email: 1, avatarUrl: 1, major: 1, graduationYear: 1, bio: 1, skills: 1, interests: 1, links: 1, previousProjects: 1, teamProfileVisibility: 1 } }).toArray();
  const usersById = new Map(users.map((member) => [member.id, member]));
  const members = projectMembers.map((member) => ({ ...member, accessRole: member.userId === access.project?.creatorId ? 'owner' : member.accessRole === 'admin' ? 'admin' : 'member', user: visibleUser(usersById.get(member.userId) ?? { id: member.userId, email: 'Unavailable' }, user.id, member.userId, params.id) }));
  const workspaceLinks = await database.collection('projectWorkspaceLinks').find({ projectId: params.id }, { projection: { _id: 0, id: 1, label: 1, url: 1, addedBy: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray();
  const { _id: _projectId, ...project } = access.project;
  const savedVisibility = user.teamProfileVisibility ?? {};
  return { project, accessRole: access.role, currentUserId: user.id, visibility: savedVisibility[params.id] ?? (typeof savedVisibility.major === 'boolean' ? savedVisibility : { major: false, graduationYear: false, bio: false, skills: false, interests: false, links: false, previousProjects: false, avatar: false }), members, workspaceLinks };
}
