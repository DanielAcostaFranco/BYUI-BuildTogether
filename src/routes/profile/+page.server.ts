import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';

export async function load({ cookies }) {
  try {
    const database = await getDatabase();
    const user = await getSessionUser(database, cookies.get('buildtogether_session'));

    if (!user) return { user: null };

    return {
      user: {
        id: user.id,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email,
        role: user.role,
        major: user.major ?? '',
        graduationYear: user.graduationYear ?? null,
        bio: user.bio ?? '',
        skills: user.skills ?? [],
        interests: user.interests ?? [],
        links: user.links ?? [],
        previousProjects: user.previousProjects ?? [],
        avatarUrl: user.avatarUrl ?? null
      }
    };
  } catch (error) {
    console.error('Could not load profile:', error);
    return { user: null };
  }
}
