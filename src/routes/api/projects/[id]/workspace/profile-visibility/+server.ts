import { json } from '@sveltejs/kit';
import { teamProfileVisibilitySchema } from '$lib/schemas';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjectAccess } from '$lib/server/project-access';

export async function PATCH({ params, request, cookies }) {
  const parsed = teamProfileVisibilitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, message: 'Choose which profile details to share.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const access = await getProjectAccess(database, params.id, user.id);
  if (!access.role) return json({ ok: false, message: 'Only team members can change this setting.' }, { status: 403 });
  await database.collection('users').updateOne({ id: user.id }, { $set: { [`teamProfileVisibility.${params.id}`]: parsed.data } });
  return json({ ok: true, message: 'Team profile sharing updated.' });
}
