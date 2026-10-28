import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { applicationSchema } from '$lib/schemas';
import { canAcceptApplication, roleId, roleVacancies } from '$lib/project-flow';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase, getMongoClient } from '$lib/server/mongodb';
import type { ProjectRole, ProjectStatus } from '$lib/types';

export async function POST({ params, request, cookies }) {
  const result = applicationSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return json({ ok: false, message: result.error.issues[0]?.message ?? 'Choose a position.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'Sign in to join a project.' }, { status: 401 });
  if (!user.firstName?.trim() || !user.lastName?.trim()) {
    return json({ ok: false, message: 'Add your first and last name to your profile before requesting to join.' }, { status: 400 });
  }

  const session = (await getMongoClient()).startSession();
  try {
    const outcome = await session.withTransaction(async () => {
      const project = await database.collection('projects').findOne({ id: params.id }, { session });
      if (!project) return { status: 404, message: 'Project not found.' };
      if (project.creatorId === user.id) return { status: 400, message: 'You already own this project.' };
      const existingMember = await database.collection('projectMembers').findOne({ projectId: params.id, userId: user.id }, { session });
      if (existingMember) return { status: 409, message: 'You are already on this team.' };
      const existing = await database.collection('projectApplications').findOne({ projectId: params.id, applicantId: user.id, status: { $in: ['pending', 'accepted'] } }, { session });
      if (existing) return { status: 409, message: existing.status === 'pending' ? 'Your application is already pending.' : 'You are already on this team.' };
      const roles = (project.roles ?? []) as ProjectRole[];
      const selectedRole = roles.find((role, index) => roleId(role, index) === result.data.roleId);
      if (!selectedRole) return { status: 400, message: 'Choose a valid position.' };
      const members = await database.collection<{ roleId?: string }>('projectMembers').find({ projectId: params.id }, { session, projection: { roleId: 1 } }).toArray();
      const vacancy = roleVacancies(roles, members).find((role) => role.id === result.data.roleId);
      if (!canAcceptApplication(project.status as ProjectStatus, project.teamSize ?? project.openRoles + 1, members.length, vacancy?.remaining ?? 0)) {
        return { status: 409, message: 'This position is filled or the project is no longer recruiting.' };
      }
      await database.collection('projects').updateOne({ id: params.id }, { $inc: { recruitmentVersion: 1 } }, { session });
      const applicationId = `application-${randomUUID()}`;
      const createdAt = new Date();
      await database.collection('projectApplications').insertOne({ id: applicationId, projectId: params.id, applicantId: user.id, roleId: result.data.roleId, roleTitle: selectedRole.title, message: result.data.message, contribution: result.data.contribution, experienceLevel: result.data.experienceLevel, experienceDetails: result.data.experienceDetails, workSampleUrl: result.data.workSampleUrl, availabilityHours: result.data.availabilityHours, status: 'pending', createdAt, updatedAt: createdAt }, { session });
      await database.collection('notifications').insertOne({
        id: `notification-${applicationId}`, userId: project.creatorId, type: 'application_received',
        title: 'New request to join', message: `${user.firstName.trim()} ${user.lastName.trim()} wants to join ${project.title} as ${selectedRole.title}. Open the project to review their request and contact email.`,
        projectId: params.id, applicationId, read: false, createdAt
      }, { session });
      return { status: 201, message: 'Application sent.' };
    });
    return json({ ok: outcome?.status === 201, message: outcome?.message }, { status: outcome?.status ?? 500 });
  } finally {
    await session.endSession();
  }
}
