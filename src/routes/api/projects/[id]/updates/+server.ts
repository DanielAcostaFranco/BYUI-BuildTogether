import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { projectUpdateSchema } from '$lib/schemas';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import type { ProjectUpdate } from '$lib/types';

export async function POST({ params, request, cookies }) {
  const result = projectUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return json({ ok: false, message: result.error.issues[0]?.message ?? 'Check your update.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'Sign in to post an update.' }, { status: 401 });
  const project = await database.collection('projects').findOne({ id: params.id });
  if (!project) return json({ ok: false, message: 'Project not found.' }, { status: 404 });
  const member = await database.collection('projectMembers').findOne({ projectId: params.id, userId: user.id });
  if (!member && project.creatorId !== user.id) return json({ ok: false, message: 'Only team members can post updates.' }, { status: 403 });
  const update = { id: `update-${randomUUID()}`, text: result.data.text, authorId: user.id, authorName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Project creator', createdAt: new Date() };
  await database.collection<{ id: string; updates: ProjectUpdate[]; updatedAt: Date }>('projects').updateOne({ id: params.id }, { $push: { updates: { $each: [update], $slice: -100 } }, $set: { updatedAt: new Date() } });
  return json({ ok: true, update }, { status: 201 });
}
