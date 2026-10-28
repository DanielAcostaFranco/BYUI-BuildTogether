import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { getDatabase, getMongoClient } from '$lib/server/mongodb';

export async function POST({ params, request, cookies }) {
  const body = await request.json().catch(() => null) as { memberId?: string } | null;
  if (!body?.memberId) return json({ ok: false, message: 'Choose a team member first.' }, { status: 400 });
  const database = await getDatabase();
  const user = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!user) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const session = (await getMongoClient()).startSession();
  try {
    const outcome = await session.withTransaction(async () => {
      const project = await database.collection('projects').findOne({ id: params.id }, { session });
      if (!project) return { status: 404, message: 'Project not found.' };
      if (project.creatorId !== user.id) return { status: 403, message: 'Only the current owner can transfer ownership.' };
      const newOwner = await database.collection('projectMembers').findOne({ id: body.memberId, projectId: params.id }, { session });
      if (!newOwner || newOwner.userId === user.id) return { status: 400, message: 'Choose another accepted team member.' };
      const now = new Date();
      await database.collection('projects').updateOne({ id: params.id }, { $set: { creatorId: newOwner.userId, updatedAt: now } }, { session });
      await database.collection('projectMembers').updateMany({ projectId: params.id }, { $set: { accessRole: 'member' } }, { session });
      await database.collection('projectMembers').updateOne({ _id: newOwner._id }, { $set: { accessRole: 'owner' } }, { session });
      await database.collection('projectMembers').updateOne({ projectId: params.id, userId: user.id }, { $set: { accessRole: 'admin' } }, { session });
      await database.collection('notifications').insertMany([
        { id: `notification-${randomUUID()}`, userId: newOwner.userId, type: 'ownership_transferred', title: 'You are now the project owner', message: `You are now the owner of ${project.title}.`, projectId: params.id, read: false, createdAt: now },
        { id: `notification-${randomUUID()}`, userId: user.id, type: 'ownership_transferred', title: 'Project ownership transferred', message: `You are now an admin of ${project.title}.`, projectId: params.id, read: false, createdAt: now }
      ], { session });
      return { status: 200, message: 'Project ownership transferred.' };
    });
    return json({ ok: outcome?.status === 200, message: outcome?.message }, { status: outcome?.status ?? 500 });
  } finally { await session.endSession(); }
}
