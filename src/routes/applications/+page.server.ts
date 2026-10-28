import { redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';

export async function load({ cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, '/login');
  const applications = await database.collection('projectApplications').find({ applicantId: user.id }).sort({ createdAt: -1 }).toArray();
  const notifications = await database.collection('notifications').find({ userId: user.id }).sort({ createdAt: -1 }).limit(5).toArray();
  const { projects } = await getProjects();
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  return {
    notifications: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      projectId: notification.projectId,
      invitationId: notification.invitationId,
      createdAt: notification.createdAt
    })),
    applications: applications.map((application) => ({
      id: application.id,
      status: application.status,
      roleTitle: application.roleTitle ?? '',
      message: application.message ?? '',
      contribution: application.contribution ?? '',
      experienceLevel: application.experienceLevel ?? '',
      experienceDetails: application.experienceDetails ?? '',
      workSampleUrl: application.workSampleUrl ?? '',
      availabilityHours: application.availabilityHours ?? '',
      createdAt: application.createdAt,
      project: projectsById.get(application.projectId) ?? null
    })).filter((application) => application.project)
  };
}
