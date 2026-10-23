import { json } from '@sveltejs/kit';
import { profileSchema } from '$lib/schemas';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function PATCH({ request, cookies }) {
  const result = profileSchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return json({ ok: false, message: result.error.issues[0]?.message ?? 'Please check your profile details.' }, { status: 400 });
  }

  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));

  if (!user) {
    return json({ ok: false, message: 'You must be signed in to update your profile.' }, { status: 401 });
  }

  await database.collection('users').updateOne(
    { id: user.id },
    {
      $set: {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        major: result.data.major,
        graduationYear: result.data.graduationYear,
        bio: result.data.bio,
        skills: result.data.skills,
        interests: result.data.interests,
        links: result.data.links,
        previousProjects: result.data.previousProjects,
        avatarUrl: result.data.avatarUrl,
        updatedAt: new Date()
      }
    }
  );

  return json({ ok: true, message: 'Profile saved.' });
}
