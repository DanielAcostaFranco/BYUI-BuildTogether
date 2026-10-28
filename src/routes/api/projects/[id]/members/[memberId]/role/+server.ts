import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { canManageProject, getProjectAccess } from '$lib/server/project-access';

const roleSchema = z.object({ accessRole: z.enum(['admin', 'member']) });

export async function PATCH({ params, request, cookies }) {
  const parsed = roleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, message: 'Choose admin or member.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const access = await getProjectAccess(database, params.id, user.id);
  if (!canManageProject(access.role)) return json({ ok: false, message: 'Only the owner or an admin can change roles.' }, { status: 403 });
  if (access.role !== 'owner' && parsed.data.accessRole === 'admin') return json({ ok: false, message: 'Only the owner can promote an admin.' }, { status: 403 });
  const member = await database.collection('projectMembers').findOne({ id: params.memberId, projectId: params.id });
  if (!member || member.userId === access.project?.creatorId) return json({ ok: false, message: 'The project owner cannot be reassigned.' }, { status: 400 });
  await database.collection('projectMembers').updateOne({ _id: member._id }, { $set: { accessRole: parsed.data.accessRole } });
  return json({ ok: true, message: `Member is now ${parsed.data.accessRole}.` });
}
