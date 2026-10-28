import { randomUUID } from 'node:crypto';
import type { ClientSession, Db } from 'mongodb';
import { recruitmentStatus, roleId, roleVacancies } from '$lib/project-flow';
import { closePendingApplications } from '$lib/server/recruitment';
import type { ProjectRole, ProjectStatus } from '$lib/types';

export async function addTeamMember(database: Db, session: ClientSession, project: Record<string, any>, newUser: { id: string }, selectedRoleId: string) {
  if (project.status === 'Completed') return { status: 409, message: 'Completed projects cannot add members.' };
  if (project.creatorId === newUser.id) return { status: 409, message: 'The creator is already on this team.' };

  const roles = (project.roles ?? []) as ProjectRole[];
  const selectedRole = roles.find((role, index) => roleId(role, index) === selectedRoleId);
  if (!selectedRole) return { status: 400, message: 'Choose a valid position.' };

  const members = await database.collection<{ userId: string; roleId?: string }>('projectMembers')
    .find({ projectId: project.id }, { session, projection: { userId: 1, roleId: 1 } }).toArray();
  if (members.some((member) => member.userId === newUser.id)) return { status: 409, message: 'This person is already on the team.' };
  if (members.length >= (project.teamSize ?? project.openRoles + 1)) return { status: 409, message: 'The team is full.' };
  const vacancies = roleVacancies(roles, members);
  if (!vacancies.some((vacancy) => vacancy.id === selectedRoleId && vacancy.remaining > 0)) {
    return { status: 409, message: 'This position is full.' };
  }

  const now = new Date();
  await database.collection('projects').updateOne({ id: project.id }, { $inc: { recruitmentVersion: 1 } }, { session });
  await database.collection('projectMembers').insertOne({
    id: `membership-${randomUUID()}`, projectId: project.id, userId: newUser.id,
    roleId: selectedRoleId, role: selectedRole.title, joinedAt: now
  }, { session });
  await database.collection('projectApplications').updateMany(
    { projectId: project.id, applicantId: newUser.id, status: 'pending' },
    { $set: { status: 'accepted', updatedAt: now } }, { session }
  );

  const nextVacancies = roleVacancies(roles, [...members, { roleId: selectedRoleId }]);
  const nextStatus = recruitmentStatus(project.status as ProjectStatus, project.teamSize ?? project.openRoles + 1, members.length + 1, nextVacancies);
  await database.collection('projects').updateOne({ id: project.id }, { $set: { status: nextStatus, updatedAt: now } }, { session });
  if (nextStatus === 'In progress') await closePendingApplications(database, session, { id: project.id, title: project.title });
  else if (nextVacancies.find((item) => item.id === selectedRoleId)?.remaining === 0) {
    await closePendingApplications(database, session, { id: project.id, title: project.title }, selectedRoleId);
  }
  await database.collection('notifications').insertOne({
    id: `notification-${randomUUID()}`, userId: newUser.id, type: 'member_added',
    title: 'You joined a project', message: `You were added to ${project.title} as ${selectedRole.title}.`,
    projectId: project.id, read: false, createdAt: now
  }, { session });
  return { status: 200, message: 'Team member added.' };
}
