import { error, redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { getProjects } from '$lib/server/projects';

type Application = { id: string; applicantId: string; message: string };
type Applicant = { id: string; firstName: string; lastName: string; email: string };
type Member = { id: string; userId: string; role: string; joinedAt: Date };

export async function load({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) redirect(303, '/login');
  const { projects } = await getProjects();
  const project = projects.find((item) => item.id === params.id);
  if (!project) error(404, 'Project not found.');

  const members = await database.collection('projectMembers').countDocuments({ projectId: params.id });
  const projectMembers = await database.collection<Member>('projectMembers').find({ projectId: params.id }, { projection: { _id: 0, id: 1, userId: 1, role: 1, joinedAt: 1 } }).sort({ joinedAt: 1 }).toArray();
  const memberUsers = await database.collection<Applicant>('users').find({ id: { $in: projectMembers.map((member) => member.userId) } }, { projection: { _id: 0, id: 1, firstName: 1, lastName: 1, email: 1 } }).toArray();
  const memberUserById = new Map(memberUsers.map((member) => [member.id, member]));
  const currentApplication = await database.collection('projectApplications').findOne({ projectId: params.id, applicantId: user.id }, { projection: { _id: 0, status: 1 } });
  const isCreator = project.creatorId === user.id;
  const applications = isCreator ? await database.collection<Application>('projectApplications').find({ projectId: params.id, status: 'pending' }, { projection: { _id: 0, id: 1, applicantId: 1, message: 1 } }).toArray() : [];
  const applicantIds = applications.map((application) => application.applicantId);
  const applicants = await database.collection<Applicant>('users').find({ id: { $in: applicantIds } }, { projection: { _id: 0, id: 1, firstName: 1, lastName: 1, email: 1 } }).toArray();
  const applicantById = new Map(applicants.map((applicant) => [applicant.id, applicant]));

  return {
    project,
    currentMembers: members || (isCreator ? 1 : 0),
    members: projectMembers.map((member) => ({ ...member, user: memberUserById.get(member.userId) ?? null })),
    currentApplication: currentApplication?.status ?? null,
    isCreator,
    applications: applications.map((application) => ({ ...application, applicant: applicantById.get(application.applicantId) ?? null }))
  };
}
