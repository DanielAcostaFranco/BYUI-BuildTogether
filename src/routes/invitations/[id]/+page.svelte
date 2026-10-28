<script lang="ts">
  import { ArrowLeft, ArrowRight, Check } from '@lucide/svelte';
  import type { PageData } from './$types';
  export let data: PageData;
  let pending = false, error = '', accepted = false, rejected = false;
  async function accept() {
    pending = true; error = '';
    try {
      const response = await fetch(`/api/invitations/${data.invitation.id}/accept`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) { error = payload.message ?? 'Could not accept the invitation.'; return; }
      accepted = true;
    } catch { error = 'Could not accept the invitation. Try again.'; }
    finally { pending = false; }
  }
  async function reject() {
    pending = true; error = '';
    try {
      const response = await fetch(`/api/invitations/${data.invitation.id}/reject`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) { error = payload.message ?? 'Could not decline the invitation.'; return; }
      rejected = true;
    } catch { error = 'Could not decline the invitation. Try again.'; }
    finally { pending = false; }
  }
</script>

<svelte:head><title>Team invitation — BuildTogether</title></svelte:head>
<div class="invite-page">
  <main class="invite-card">
    <a class="back" href="/home"><ArrowLeft size={15} /> BuildTogether home</a>
    <p class="eyebrow">Team invitation</p>
    <h1>{data.project.title}</h1>
    <p>{data.project.creatorName} invited <strong>{data.invitation.email}</strong> to join as <strong>{data.invitation.roleTitle}</strong>.</p>
    {#if accepted || data.invitation.status === 'accepted'}
      <p class="success"><Check size={18} /> You are on the team.</p><a class="button button-dark" href={`/projects/${data.project.id}`}>View project <ArrowRight size={15} /></a>
    {:else if rejected || data.invitation.status === 'rejected'}<p class="notice">You declined this invitation.</p>
    {:else if data.invitation.status !== 'pending'}<p class="notice">This invitation is no longer available.</p>
    {:else if data.invitation.expired}<p class="notice">This invitation expired. Ask the project creator to send a new one.</p>
    {:else}<p class="hint">Accepting adds you to the team if the position is still open. Invitations do not reserve a spot.</p><div class="invite-actions"><button class="button button-dark" type="button" onclick={accept} disabled={pending}>{pending ? 'Working…' : 'Accept invitation'} <ArrowRight size={15} /></button><button class="text-button" type="button" onclick={reject} disabled={pending}>Decline invitation</button></div>{#if error}<p class="error" role="alert">{error}</p>{/if}{/if}
  </main>
</div>

<style>
  .invite-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:#f6fbff;color:var(--byui-deep-blue);font-family:var(--byui-body)}.invite-card{box-sizing:border-box;width:min(100%,560px);padding:38px;background:#fff;border:1px solid #dce7e9;border-radius:14px;box-shadow:0 20px 55px #12354a12}.back{display:inline-flex;align-items:center;gap:6px;margin-bottom:32px;color:var(--byui-blue);font:700 12px var(--byui-display);text-decoration:none}.eyebrow{color:var(--byui-blue);font:800 11px var(--byui-display);letter-spacing:.12em;text-transform:uppercase}.invite-card h1{font:700 clamp(32px,5vw,48px)/1 var(--byui-display);letter-spacing:-.04em;margin:8px 0 20px}.invite-card p{font-size:14px;line-height:1.65}.hint,.notice{color:#64777d}.success{display:flex;align-items:center;gap:8px;color:#2d8b68}.error{color:#a32626}.invite-card .button{display:inline-flex;align-items:center;gap:8px;margin-top:16px;text-decoration:none}.invite-actions{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.text-button{border:0;background:transparent;color:#9c3030;font:700 11px var(--byui-display);cursor:pointer}.text-button:disabled{opacity:.5}
</style>
