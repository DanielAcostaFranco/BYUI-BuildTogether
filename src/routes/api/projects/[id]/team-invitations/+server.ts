import { randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { normalizeEmail, getSessionUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/mongodb';
import { INVITATION_TTL_MS, sendTeamInvitation } from '$lib/server/team-invitations';
import { roleId, roleVacancies } from '$lib/project-flow';
import type { ProjectRole } from '$lib/types';
import { canManageProject, getProjectAccess } from '$lib/server/project-access';

const addSchema = z.object({
  email: z.string().trim().email().refine((email) => email.toLowerCase().endsWith('@byui.edu'), 'Use a BYU-Idaho email ending in @byui.edu.'),
  roleId: z.string().trim().min(1, 'Choose a position.')
});

export async function POST({ params, request, cookies, url }) {
  const result = addSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return json({ ok: false, message: result.error.issues[0]?.message ?? 'Check the email and position.' }, { status: 400 });
  const database = await getDatabase();
  const owner = await getSessionUser(database, cookies.get('buildtogether_session'));
  if (!owner) return json({ ok: false, message: 'You must be signed in.' }, { status: 401 });
  const email = normalizeEmail(result.data.email);
  const access = await getProjectAccess(database, params.id, owner.id);
  const project = access.project;
  if (!project || !canManageProject(access.role)) return json({ ok: false, message: 'Only the owner or an admin can manage this team.' }, { status: 403 });
  if (project.status === 'Completed') return json({ ok: false, message: 'Completed projects cannot add members.' }, { status: 409 });
  if (email === normalizeEmail(owner.email)) return json({ ok: false, message: 'You are already the project creator.' }, { status: 409 });
  const roles = (project.roles ?? []) as ProjectRole[];
  const selectedRole = roles.find((role, index) => roleId(role, index) === result.data.roleId);
  if (!selectedRole) return json({ ok: false, message: 'Choose a valid position.' }, { status: 400 });
  const members = await database.collection<{ roleId?: string }>('projectMembers').find({ projectId: params.id }, { projection: { roleId: 1 } }).toArray();
  const vacancy = roleVacancies(roles, members).find((item) => item.id === result.data.roleId);
  if (members.length >= (project.teamSize ?? project.openRoles + 1) || !vacancy?.remaining) {
    return json({ ok: false, message: 'This team or position is full.' }, { status: 409 });
  }

  const existingUser = await database.collection('users').findOne({ email }, { projection: { id: 1 } });
  const invitations = database.collection('teamInvitations');
  const duplicate = await invitations.findOne({ projectId: params.id, email, status: 'pending', expiresAt: { $gt: new Date() } });
  if (duplicate) return json({ ok: false, message: 'An invitation is already pending for this email.' }, { status: 409 });

  const invitation = {
    id: `invitation-${randomUUID()}`, projectId: params.id, email, roleId: result.data.roleId,
    roleTitle: selectedRole.title, invitedBy: owner.id, status: 'pending',
    createdAt: new Date(), expiresAt: new Date(Date.now() + INVITATION_TTL_MS)
  };
  await invitations.insertOne(invitation);
  if (existingUser?.id) {
    await database.collection('notifications').insertOne({
      id: `notification-${invitation.id}`, userId: existingUser.id, type: 'team_invitation', title: 'Invitation to join a team',
      message: `${owner.firstName || 'A project creator'} invited you to join ${project.title} as ${selectedRole.title}. Review the invitation to accept or decline.`,
      projectId: params.id, invitationId: invitation.id, read: false, createdAt: invitation.createdAt
    });
  }
  const invitationUrl = new URL(`/invitations/${invitation.id}`, url.origin).toString();
  try {
    const delivery = await sendTeamInvitation(email, project.title, selectedRole.title, invitationUrl);
    return json({ ok: true, message: 'Invitation sent. The student can accept after signing in with that email.', ...delivery }, { status: 201 });
  } catch (error) {
    await invitations.deleteOne({ id: invitation.id, status: 'pending' });
    if (existingUser?.id) await database.collection('notifications').deleteOne({ id: `notification-${invitation.id}`, userId: existingUser.id });
    console.error('Could not send team invitation:', error);
    return json({ ok: false, message: 'Could not send the invitation. Check Brevo and try again.' }, { status: 502 });
  }
}
