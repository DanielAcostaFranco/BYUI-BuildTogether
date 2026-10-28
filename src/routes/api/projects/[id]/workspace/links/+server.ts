import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { workspaceLinkSchema } from '$lib/schemas';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjectAccess } from '$lib/server/project-access';

export async function POST({ params, request, cookies }) {
  const parsed = workspaceLinkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, message: parsed.error.issues[0]?.message ?? 'Check the link.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const access = await getProjectAccess(database, params.id, user.id);
  if (!access.role) return json({ ok: false, message: 'Only accepted team members can add links.' }, { status: 403 });
  const link = { id: `workspace-link-${randomUUID()}`, projectId: params.id, label: parsed.data.label, url: parsed.data.url, addedBy: user.id, createdAt: new Date() };
  await database.collection('projectWorkspaceLinks').insertOne(link);
  return json({ ok: true, link }, { status: 201 });
}

export async function DELETE({ params, request, cookies }) {
  const body = await request.json().catch(() => null) as { linkId?: string } | null;
  if (!body?.linkId) return json({ ok: false, message: 'Link not found.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const access = await getProjectAccess(database, params.id, user.id);
  if (!access.role) return json({ ok: false, message: 'Only team members can remove links.' }, { status: 403 });
  const result = await database.collection('projectWorkspaceLinks').deleteOne({ id: body.linkId, projectId: params.id, ...(access.role === 'member' ? { addedBy: user.id } : {}) });
  if (!result.deletedCount) return json({ ok: false, message: 'You cannot remove this link.' }, { status: 403 });
  return json({ ok: true });
}
