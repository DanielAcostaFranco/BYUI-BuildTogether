import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function sendTeamInvitation(email: string, projectTitle: string, roleTitle: string, invitationUrl: string) {
  if (env.AUTH_EMAIL_MODE === 'local' && dev) return { developmentInviteUrl: invitationUrl };
  if (env.AUTH_EMAIL_MODE !== 'brevo' || !env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    throw new Error('Brevo is not configured for team invitations.');
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME || 'BuildTogether' },
      to: [{ email }],
      subject: 'Invitation to join a BuildTogether project',
      htmlContent: `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:560px;margin:auto"><h1>You're invited to BuildTogether</h1><p>A project creator invited you to join <strong>${escapeHtml(projectTitle)}</strong> as <strong>${escapeHtml(roleTitle)}</strong>.</p><p><a href="${escapeHtml(invitationUrl)}" style="background:#006eb6;color:white;padding:12px 18px;border-radius:6px;text-decoration:none">View invitation</a></p><p>This invitation expires in 7 days. Sign in with this email address to accept it. If you weren't expecting it, you can ignore this message.</p></div>`
    })
  });
  if (!response.ok) throw new Error(`Brevo rejected the team invitation (HTTP ${response.status}).`);
  return {};
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}
