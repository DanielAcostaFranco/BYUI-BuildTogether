import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { canAcceptApplication, recruitmentStatus, roleId, roleVacancies } from '$lib/project-flow';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase, getMongoClient } from '$lib/server/mongodb';
import { closePendingApplications } from '$lib/server/recruitment';
import type { ProjectRole, ProjectStatus } from '$lib/types';

export async function POST({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });

  const session = (await getMongoClient()).startSession();
  try {
    const outcome = await session.withTransaction(async () => {
      const project = await database.collection('projects').findOne({ id: params.id }, { session });
      if (!project) return { status: 404, message: 'Project not found.' };
      if (project.creatorId !== user.id) return { status: 403, message: 'Only the project creator can accept applications.' };
      const application = await database.collection('projectApplications').findOne({ id: params.applicationId, projectId: params.id, status: 'pending' }, { session });
      if (!application) return { status: 404, message: 'Application not found or already reviewed.' };
      const roles = (project.roles ?? []) as ProjectRole[];
      const selectedRole = roles.find((role, index) => roleId(role, index) === application.roleId);
      if (!selectedRole) return { status: 409, message: 'This application has no valid position. Ask the student to apply again.' };
      const members = await database.collection<{ userId: string; roleId?: string }>('projectMembers').find({ projectId: params.id }, { session, projection: { userId: 1, roleId: 1 } }).toArray();
      if (members.some((member) => member.userId === application.applicantId)) return { status: 409, message: 'This student is already on the team.' };
      const vacancies = roleVacancies(roles, members);
      const vacancy = vacancies.find((item) => item.id === application.roleId);
      if (!canAcceptApplication(project.status as ProjectStatus, project.teamSize ?? project.openRoles + 1, members.length, vacancy?.remaining ?? 0)) {
        return { status: 409, message: 'This position is filled or the project is no longer recruiting.' };
      }
      const now = new Date();
      await database.collection('projectMembers').insertOne({ id: `membership-${randomUUID()}`, projectId: params.id, userId: application.applicantId, roleId: application.roleId, role: selectedRole.title, joinedAt: now }, { session });
      await database.collection('projectApplications').updateOne({ _id: application._id, status: 'pending' }, { $set: { status: 'accepted', updatedAt: now } }, { session });
      const nextVacancies = roleVacancies(roles, [...members, { roleId: application.roleId }]);
      const nextStatus = recruitmentStatus(project.status as ProjectStatus, project.teamSize ?? project.openRoles + 1, members.length + 1, nextVacancies);
      await database.collection('projects').updateOne({ id: params.id }, { $set: { status: nextStatus, updatedAt: now }, $inc: { recruitmentVersion: 1 } }, { session });
      if (nextStatus === 'In progress') await closePendingApplications(database, session, { id: params.id, title: project.title });
      else if (nextVacancies.find((item) => item.id === application.roleId)?.remaining === 0) await closePendingApplications(database, session, { id: params.id, title: project.title }, application.roleId);
      await database.collection('notifications').insertOne({
        id: `notification-${randomUUID()}`, userId: application.applicantId, type: 'application_accepted',
        title: 'You joined a project', message: `Your application for ${project.title} as ${selectedRole.title} was accepted.`,
        projectId: params.id, read: false, createdAt: now
      }, { session });
      return { status: 200, message: 'Applicant accepted.', projectStatus: nextStatus };
    });
    return json({ ok: outcome?.status === 200, message: outcome?.message, projectStatus: outcome?.projectStatus }, { status: outcome?.status ?? 500 });
  } finally {
    await session.endSession();
  }
}
