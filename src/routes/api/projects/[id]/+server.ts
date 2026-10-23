import { json } from '@sveltejs/kit';
import { projectSchema } from '$lib/schemas';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function PATCH({ params, request, cookies }) {
  const body = await request.json().catch(() => null);
  const result = projectSchema.safeParse({ ...body, termsAccepted: true });
  if (!result.success) return json({ ok: false, message: result.error.issues[0]?.message ?? 'Please check your project details.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const project = await database.collection('projects').findOne({ id: params.id });
  if (!project) return json({ ok: false, message: 'Project not found.' }, { status: 404 });
  if (project.creatorId !== user.id) return json({ ok: false, message: 'Only the project creator can edit it.' }, { status: 403 });
  const currentMembers = await database.collection('projectMembers').countDocuments({ projectId: params.id });
  if (result.data.teamSize < currentMembers) return json({ ok: false, message: `Team size cannot be smaller than your ${currentMembers} current members.` }, { status: 400 });
  await database.collection('projects').updateOne({ id: params.id }, { $set: {
    title: result.data.title, summary: result.data.summary, category: result.data.category, department: result.data.department,
    skills: result.data.skills, interests: result.data.interests, roles: result.data.roles, hoursPerWeek: result.data.hoursPerWeek, location: result.data.location,
    openRoles: result.data.openRoles, teamSize: result.data.teamSize, updatedAt: new Date()
  }});
  return json({ ok: true, message: 'Project updated.' });
}
