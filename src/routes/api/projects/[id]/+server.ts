import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { projectSchema } from '$lib/schemas';
import { recruitmentStatus, roleVacancies } from '$lib/project-flow';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase, getMongoClient } from '$lib/server/mongodb';
import { closePendingApplications } from '$lib/server/recruitment';
import type { ProjectStatus } from '$lib/types';

export async function PATCH({ params, request, cookies }) {
  const body = await request.json().catch(() => null);
  const result = projectSchema.safeParse({ ...body, termsAccepted: true });
  if (!result.success) return json({ ok: false, message: result.error.issues[0]?.message ?? 'Please check your project details.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });

  const session = (await getMongoClient()).startSession();
  try {
    const outcome = await session.withTransaction(async () => {
      const project = await database.collection('projects').findOne({ id: params.id }, { session });
      if (!project) return { status: 404, message: 'Project not found.' };
      const membership = await database.collection('projectMembers').findOne({ projectId: params.id, userId: user.id }, { session, projection: { accessRole: 1 } });
      if (project.creatorId !== user.id && membership?.accessRole !== 'admin') return { status: 403, message: 'Only the owner or an admin can edit it.' };
      const members = await database.collection<{ roleId?: string }>('projectMembers').find({ projectId: params.id }, { session, projection: { roleId: 1 } }).toArray();
      if (result.data.teamSize < members.length) return { status: 400, message: `Team size cannot be smaller than your ${members.length} current members.` };
      const roles = result.data.roles.map((role) => ({ ...role, id: role.id ?? `role-${randomUUID()}` }));
      const vacancies = roleVacancies(roles, members);
      if (vacancies.some((vacancy) => vacancy.filled > vacancy.needed) || members.some((member) => member.roleId && !roles.some((role) => role.id === member.roleId))) {
        return { status: 400, message: 'Keep positions and their filled slots while members are assigned to them.' };
      }
      const pending = await database.collection('projectApplications').find({ projectId: params.id, status: 'pending', roleId: { $exists: true } }, { session, projection: { roleId: 1 } }).toArray();
      if (pending.some((application) => !roles.some((role) => role.id === application.roleId))) {
        return { status: 400, message: 'Review pending applications before removing their positions.' };
      }
      const desiredStatus = (result.data.status ?? project.status) as ProjectStatus;
      const status = recruitmentStatus(desiredStatus, result.data.teamSize, members.length, vacancies);
      await database.collection('projects').updateOne({ id: params.id }, { $set: {
        title: result.data.title, summary: result.data.summary, category: result.data.category, department: result.data.department,
        skills: result.data.skills, interests: result.data.interests, roles, links: result.data.links, hoursPerWeek: result.data.hoursPerWeek, location: result.data.location,
        openRoles: roles.reduce((total, role) => total + role.peopleNeeded, 0), teamSize: result.data.teamSize, status, updatedAt: new Date()
      }, $inc: { recruitmentVersion: 1 } }, { session });
      if (status === 'In progress' || status === 'Completed') await closePendingApplications(database, session, { id: params.id, title: result.data.title });
      return { status: 200, message: 'Project updated.' };
    });
    return json({ ok: outcome?.status === 200, message: outcome?.message }, { status: outcome?.status ?? 500 });
  } finally { await session.endSession(); }
}
