import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase, getMongoClient } from '$lib/server/mongodb';
import { canManageProject, getProjectAccess } from '$lib/server/project-access';

export async function DELETE({ params, cookies }) {
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const session = (await getMongoClient()).startSession();
  try {
    const outcome = await session.withTransaction(async () => {
      const access = await getProjectAccess(database, params.id, user.id);
      const project = access.project;
      if (!project || !canManageProject(access.role)) return { status: 403, message: 'Only the owner or an admin can manage this team.' };
      const member = await database.collection('projectMembers').findOne({ id: params.memberId, projectId: params.id }, { session });
      if (!member) return { status: 404, message: 'Team member not found.' };
      if (member.userId === user.id) return { status: 400, message: 'The project creator cannot be removed from the team.' };
      await database.collection('projectMembers').deleteOne({ _id: member._id }, { session });
      await database.collection('projectApplications').updateMany({ projectId: params.id, applicantId: member.userId, status: 'accepted' }, { $set: { status: 'removed', updatedAt: new Date() } }, { session });
      await database.collection('projects').updateOne({ id: params.id }, { $inc: { recruitmentVersion: 1 } }, { session });
      await database.collection('notifications').insertOne({
        id: `notification-${randomUUID()}`, userId: member.userId, type: 'member_removed', title: 'Team membership updated',
        message: `You are no longer on the ${project.title} team.`, projectId: params.id, read: false, createdAt: new Date()
      }, { session });
      return { status: 200, message: 'Team member removed. The project remains closed unless you reopen recruitment in Edit project.' };
    });
    return json({ ok: outcome?.status === 200, message: outcome?.message }, { status: outcome?.status ?? 500 });
  } finally { await session.endSession(); }
}
