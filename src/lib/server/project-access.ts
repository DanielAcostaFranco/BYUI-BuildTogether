import type { Db } from 'mongodb';

export type ProjectTeamRole = 'owner' | 'admin' | 'member';
type ProjectAccess = { project: any; membership: any; role: ProjectTeamRole | null };

export async function getProjectAccess(database: Db, projectId: string, userId: string): Promise<ProjectAccess> {
  const project = await database.collection('projects').findOne({ id: projectId });
  if (!project) return { project: null, membership: null, role: null as ProjectTeamRole | null };
  if (project.creatorId === userId) return { project, membership: null, role: 'owner' as const };
  const membership = await database.collection('projectMembers').findOne({ projectId, userId });
  if (!membership) return { project, membership: null, role: null as ProjectTeamRole | null };
  const role = membership.accessRole === 'admin' ? 'admin' : 'member';
  return { project, membership, role };
}

export function canManageProject(role: ProjectTeamRole | null) {
  return role === 'owner' || role === 'admin';
}

export function canDeleteProject(role: ProjectTeamRole | null) {
  return role === 'owner';
}
