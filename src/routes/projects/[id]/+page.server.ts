import { error } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';
import { roleVacancies } from '$lib/project-flow';
import type { ProjectRole } from '$lib/types';

type Application = { id: string; applicantId: string; roleId?: string; roleTitle?: string; message?: string; contribution?: string; experienceLevel?: string; experienceDetails?: string; workSampleUrl?: string; availabilityHours?: string };
type Applicant = { id: string; firstName?: string; lastName?: string; email: string; major?: string; skills?: string[] };
type Member = { id: string; userId: string; roleId?: string; role: string; joinedAt: Date };

export async function load({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  const { projects } = await getProjects();
  const project = projects.find((item) => item.id === params.id);
  if (!project) error(404, 'Project not found.');

  const members = await database.collection('projectMembers').countDocuments({ projectId: params.id });
  const projectMembers = await database.collection<Member>('projectMembers').find({ projectId: params.id }, { projection: { _id: 0, id: 1, userId: 1, roleId: 1, role: 1, joinedAt: 1 } }).sort({ joinedAt: 1 }).toArray();
  const memberUsers = await database.collection<Applicant>('users').find({ id: { $in: projectMembers.map((member) => member.userId) } }, { projection: { _id: 0, id: 1, firstName: 1, lastName: 1 } }).toArray();
  const memberUserById = new Map(memberUsers.map((member) => [member.id, member]));
  const currentApplication = user ? await database.collection('projectApplications').findOne({ projectId: params.id, applicantId: user.id }, { sort: { createdAt: -1 }, projection: { _id: 0, status: 1, roleTitle: 1 } }) : null;
  const isCreator = Boolean(user && project.creatorId === user.id);
  const membership = user && !isCreator ? await database.collection('projectMembers').findOne({ projectId: params.id, userId: user.id }, { projection: { accessRole: 1 } }) : null;
  const applications = isCreator ? await database.collection<Application>('projectApplications').find({ projectId: params.id, status: 'pending' }, { projection: { _id: 0, id: 1, applicantId: 1, roleId: 1, roleTitle: 1, message: 1, contribution: 1, experienceLevel: 1, experienceDetails: 1, workSampleUrl: 1, availabilityHours: 1 } }).toArray() : [];
  const applicantIds = applications.map((application) => application.applicantId);
  const applicants = await database.collection<Applicant>('users').find({ id: { $in: applicantIds } }, { projection: { _id: 0, id: 1, firstName: 1, lastName: 1, email: 1, major: 1, skills: 1 } }).toArray();
  const applicantById = new Map(applicants.map((applicant) => [applicant.id, applicant]));

  return {
    project,
    signedIn: Boolean(user),
    isMember: Boolean(user && projectMembers.some((member) => member.userId === user.id)),
    vacancies: roleVacancies((project.roles ?? []) as ProjectRole[], projectMembers),
    currentMembers: members || (isCreator ? 1 : 0),
    members: projectMembers.map((member) => ({ ...member, user: memberUserById.get(member.userId) ?? null })),
    currentApplication: currentApplication?.status ?? null,
    isCreator,
    isAdmin: isCreator || membership?.accessRole === 'admin',
    needsApplicantName: Boolean(user && !isCreator && (!user.firstName?.trim() || !user.lastName?.trim())),
    applications: applications.map((application) => ({ ...application, applicant: applicantById.get(application.applicantId) ?? null }))
  };
}
