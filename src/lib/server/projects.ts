import { getDatabase } from '$lib/server/mongodb';
import { projects as fallbackProjects, type Project } from '$lib/types';

type ProjectDocument = Omit<Project, 'creator' | 'initials'> & { creatorId?: string };
type UserDocument = { id: string; firstName: string; lastName: string };

export async function getProjects() {
  try {
    const database = await getDatabase();
    const projectDocuments = await database.collection<ProjectDocument>('projects').find({}).sort({ featured: -1, title: 1 }).toArray();
    if (projectDocuments.length === 0) return { projects: fallbackProjects, dataSource: 'fallback' as const };
    const creatorIds = projectDocuments.map((project) => project.creatorId).filter((id): id is string => Boolean(id));
    const users = await database.collection<UserDocument>('users').find({ id: { $in: creatorIds } }).toArray();
    const usersById = new Map(users.map((user) => [user.id, user]));
    const mappedProjects: Project[] = projectDocuments.map((project) => {
      const { _id, ...projectFields } = project as ProjectDocument & { _id?: unknown };
      const creator = project.creatorId ? usersById.get(project.creatorId) : undefined;
      return {
        ...projectFields,
        creator: creator ? `${creator.firstName} ${creator.lastName}`.trim() : 'BuildTogether',
        initials: creator ? `${creator.firstName[0] ?? ''}${creator.lastName[0] ?? ''}`.toUpperCase() : 'BT'
      };
    });
    return { projects: mappedProjects, dataSource: 'mongodb' as const };
  } catch (error) {
    console.error('Could not load projects from MongoDB:', error);
    return { projects: fallbackProjects, dataSource: 'fallback' as const };
  }
}
