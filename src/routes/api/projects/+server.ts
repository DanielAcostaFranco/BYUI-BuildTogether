import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { projectSchema } from '$lib/schemas';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function POST({ request, cookies }) {
  const result = projectSchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return json({ ok: false, message: result.error.issues[0]?.message ?? 'Please check your project details.' }, { status: 400 });
  }

  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));

  if (!user) {
    return json({ ok: false, message: 'You must be signed in to create a project.' }, { status: 401 });
  }

  const projectId = `project-${randomUUID()}`;
  await database.collection('projects').insertOne({
    id: projectId,
    title: result.data.title,
    summary: result.data.summary,
    category: result.data.category,
    status: 'Recruiting',
    department: result.data.department,
    creatorId: user.id,
    skills: result.data.skills,
    interests: result.data.interests,
    roles: result.data.roles,
    hoursPerWeek: result.data.hoursPerWeek,
    location: result.data.location,
    openRoles: result.data.openRoles,
    teamSize: result.data.teamSize,
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  await database.collection('projectMembers').insertOne({
    id: `membership-${randomUUID()}`,
    projectId,
    userId: user.id,
    role: 'Creator',
    joinedAt: new Date()
  });

  return json({ ok: true, projectId }, { status: 201 });
}
