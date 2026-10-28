<script lang="ts">
  import { ArrowLeft, ArrowRight, UserPlus, UserRound, Trash2 } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  export let data: PageData;
  let email = '', selectedRoleId = '', busy = false, notice = '', error = '', developmentInviteUrl = '', showAddMember = false;
  onMount(() => document.querySelector('.team-page')?.setAttribute('data-app-ready', 'true'));

  async function addByEmail() {
    busy = true; notice = ''; error = ''; developmentInviteUrl = '';
    try {
      const response = await fetch(`/api/projects/${data.project.id}/team-invitations`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, roleId: selectedRoleId })
      });
      const payload = await response.json();
      if (!response.ok) { error = payload.message ?? 'Could not add this person.'; return; }
      notice = payload.message;
      developmentInviteUrl = payload.developmentInviteUrl ?? '';
      email = ''; selectedRoleId = '';
      await invalidateAll();
    } catch { error = 'Could not add this person. Try again.'; }
    finally { busy = false; }
  }

  async function removeMember(memberId: string, name: string) {
    if (!window.confirm(`Remove ${name} from this team? They will be notified.`)) return;
    busy = true; error = ''; notice = '';
    try {
      const response = await fetch(`/api/projects/${data.project.id}/members/${memberId}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) { error = payload.message ?? 'Could not remove this member.'; return; }
      notice = payload.message;
      await invalidateAll();
    } catch { error = 'Could not remove this member. Try again.'; }
    finally { busy = false; }
  }

  async function cancelInvitation(invitationId: string) {
    busy = true; error = ''; notice = '';
    try {
      const response = await fetch(`/api/projects/${data.project.id}/team-invitations/${invitationId}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) { error = payload.message ?? 'Could not cancel this invitation.'; return; }
      notice = payload.message;
      await invalidateAll();
    } catch { error = 'Could not cancel this invitation. Try again.'; }
    finally { busy = false; }
  }
</script>

<svelte:head><title>Manage team — {data.project.title}</title></svelte:head>
<div class="team-page">
  <header class="team-header"><a class="brand" href="/home" aria-label="BuildTogether home"><span class="brand-mark brand-image"><img src="/brand/handshake-emblem.png" alt="" /></span><span>Build<span>Together</span></span></a><a class="back-link" href={`/projects/${data.project.id}`}><ArrowLeft size={15} /> Back to project</a></header>
  <main class="team-main">
    <a class="back-text" href={`/projects/${data.project.id}`}><ArrowLeft size={14} /> {data.project.title}</a>
    <div class="heading"><div><p class="eyebrow">Project team</p><h1>Manage your team.</h1><p>Add students by BYU-Idaho email and manage everyone building with you.</p></div><div class="team-count">{data.members.length} <span>of {data.project.teamSize ?? data.project.openRoles + 1} members</span></div></div>

    <section class="members-section" aria-labelledby="members-heading"><div class="section-heading-row"><div><p class="eyebrow">People on the project</p><h2 class="members-heading" id="members-heading">Current members</h2></div><span class="member-total">{data.members.length}/{data.project.teamSize ?? data.project.openRoles + 1}</span></div><div class="member-grid">{#each data.members as member}<article class="member-card"><div class="member-top"><span class="avatar">{member.user?.firstName?.[0] ?? '?'}{member.user?.lastName?.[0] ?? ''}</span><span class="role">{member.role}</span></div><h3>{[member.user?.firstName, member.user?.lastName].filter(Boolean).join(' ') || member.user?.email || 'Team member'}</h3>{#if member.user?.major}<p class="major">{member.user.major}</p>{/if}{#if member.user?.skills?.length}<div class="tags">{#each member.user.skills.slice(0, 4) as skill}<span>{skill}</span>{/each}</div>{/if}<div class="member-footer"><span><UserRound size={13} /> {member.user?.email ?? 'BuildTogether member'}</span>{#if member.user?.email}<a href={`mailto:${member.user.email}`}>Contact <ArrowRight size={13} /></a>{/if}</div>{#if member.userId !== data.project.creatorId}<button class="remove-member" type="button" onclick={() => removeMember(member.id, [member.user?.firstName, member.user?.lastName].filter(Boolean).join(' ') || member.user?.email || 'this member')} disabled={busy}><Trash2 size={14} /> Remove from team</button>{/if}</article>{/each}{#each data.invitations as invitation}<article class="member-card invitation-card"><div class="member-top"><span class="avatar pending-avatar"><UserPlus size={18} /></span><span class="pending-role">Pending invitation</span></div><h3>{invitation.email}</h3><p class="major">{invitation.roleTitle}</p><p class="invitation-copy">Waiting for this student to accept or decline.</p><div class="member-footer"><span>Expires {new Date(invitation.expiresAt).toLocaleDateString('en-US')}</span><button type="button" onclick={() => cancelInvitation(invitation.id)} disabled={busy}>Cancel</button></div></article>{/each}
      <section class="add-member-card" aria-labelledby="add-member-heading">
        <button class="add-member-trigger" type="button" aria-expanded={showAddMember} onclick={() => { showAddMember = !showAddMember; if (!showAddMember) { notice = ''; error = ''; } }}>
          <span class="section-icon"><UserPlus size={20} /></span><span><span class="eyebrow">Grow the team</span><strong id="add-member-heading">+ Add member</strong></span><span class="expand-icon" class:rotated={showAddMember}><ArrowRight size={18} /></span>
        </button>
        {#if showAddMember}
          <div class="add-member-content"><p>Add someone already on BuildTogether or invite a student by their BYU-Idaho email.</p><form class="add-form" onsubmit={(event) => { event.preventDefault(); addByEmail(); }}><label for="teammate-email">BYU-Idaho email</label><input id="teammate-email" type="email" bind:value={email} placeholder="student@byui.edu" required /><label for="teammate-position">Position</label><select id="teammate-position" bind:value={selectedRoleId} required><option value="" disabled>Choose an open position</option>{#each data.vacancies.filter((role) => role.remaining > 0) as role}<option value={role.id}>{role.title} · {role.remaining} open</option>{/each}</select><button class="button button-dark" type="submit" disabled={busy || !data.vacancies.some((role) => role.remaining > 0)}>{busy ? 'Working…' : 'Add or invite student'} <ArrowRight size={15} /></button></form><p class="hint">Invitations expire after 7 days and do not reserve a position.</p>{#if notice}<p class="success" role="status">{notice}</p>{/if}{#if error}<p class="form-error" role="alert">{error}</p>{/if}{#if developmentInviteUrl}<p class="hint">Local development invitation: <a href={developmentInviteUrl}>Open invitation</a></p>{/if}</div>
        {/if}
      </section></div></section>
  </main>
</div>

<style>
  .team-page{min-height:100vh;background:#f6fbff;color:#000;font-family:var(--byui-body)}.team-header{height:78px;padding:0 clamp(20px,6vw,80px);display:flex;justify-content:space-between;align-items:center;background:#fff;border-bottom:1px solid rgba(148,149,152,.3)}.team-header .brand{text-decoration:none}.team-header .brand-image{width:46px;height:31px}.back-link,.back-text{display:flex;align-items:center;gap:7px;color:var(--byui-deep-blue);font:700 12px var(--byui-display);text-decoration:none}.team-main{max-width:1000px;margin:auto;padding:50px 20px 90px}.back-text{font-size:11px}.heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:35px 0}.heading h1{font:700 clamp(40px,6vw,68px)/.95 var(--byui-display);letter-spacing:-.06em;margin:0}.heading p:last-child{color:#64777d;font-size:14px}.eyebrow{color:var(--byui-blue);font:800 10px var(--byui-display);text-transform:uppercase;letter-spacing:.14em;margin:0 0 8px}.team-count{color:var(--byui-deep-blue);font:700 28px var(--byui-display)}.team-count span{color:#829197;font:400 11px var(--byui-body)}.member-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.member-card{background:#fff;border:1px solid #dce7e9;border-radius:10px;padding:22px}.member-top{display:flex;justify-content:space-between;align-items:center}.avatar{width:42px;height:42px;display:grid;place-items:center;border-radius:50%;background:var(--byui-light-blue);color:var(--byui-deep-blue);font:800 13px var(--byui-display)}.role{color:#2d8b68;background:#dff1e8;border-radius:99px;padding:5px 8px;font:800 8px var(--byui-display);text-transform:uppercase}.member-card h3{color:var(--byui-deep-blue);font:700 23px var(--byui-display);margin:18px 0 4px}.major{color:#64777d;font-size:11px;margin:0}.tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:16px}.tags span{background:#e8f4fb;color:var(--byui-deep-blue);border-radius:4px;padding:6px 8px;font:700 9px var(--byui-display)}.member-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid #e1e9eb;margin-top:20px;padding-top:14px;color:#829197;font-size:10px}.member-footer span,.member-footer a{display:flex;align-items:center;gap:5px}.member-footer a{color:var(--byui-blue);font:700 10px var(--byui-display);text-decoration:none}@media(max-width:700px){.team-header{padding:0 20px}.team-header .back-link{display:none}.heading{align-items:flex-start;flex-direction:column}.member-grid{grid-template-columns:1fr}}
  .members-section{min-width:0}.section-heading-row{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:15px}.section-heading-row .eyebrow{margin:0 0 6px}.member-total{color:#829197;font:700 13px var(--byui-display)}.add-member-card{box-sizing:border-box;min-height:236px;background:#fff;border:1px solid #dce7e9;border-radius:10px;padding:22px;box-shadow:none;overflow:hidden}.add-member-trigger{width:100%;min-height:190px;display:flex;align-items:center;gap:13px;padding:0;border:0;background:transparent;color:var(--byui-deep-blue);text-align:left;cursor:pointer}.add-member-trigger:hover{background:#f8fcff}.add-member-trigger>span:nth-child(2){display:grid;gap:5px;flex:1}.add-member-trigger .eyebrow{margin:0}.add-member-trigger strong{font:700 22px var(--byui-display)}.expand-icon{display:inline-flex;color:var(--byui-blue);transition:transform .2s ease}.expand-icon.rotated{transform:rotate(90deg)}.section-icon{width:43px;height:43px;flex:none;display:grid;place-items:center;border-radius:9px;background:var(--byui-light-blue);color:var(--byui-blue)}.add-member-content{padding:0;border-top:1px solid #e1e9eb}.add-member-content>p{color:#64777d;font-size:13px;line-height:1.6}.add-form{display:grid;gap:9px;margin-top:20px}.add-form label{color:var(--byui-deep-blue);font:700 11px var(--byui-display)}.add-form input,.add-form select{box-sizing:border-box;width:100%;border:1px solid #c9d8df;border-radius:6px;background:#fff;padding:11px;font:13px var(--byui-body);color:#1b2a30}.add-form button{justify-self:stretch;margin-top:8px;justify-content:center}.hint{font-size:11px!important}.success{color:#2d8b68!important;font-weight:700}.form-error{color:#a32626!important}.invitations{margin:0 0 34px}.invitation-list{display:grid;gap:9px;margin-top:14px}.invitation-list article{display:flex;align-items:center;justify-content:space-between;gap:16px;background:#fff;border:1px solid #dce7e9;border-radius:8px;padding:15px}.invitation-list strong{overflow-wrap:anywhere;font-size:12px}.invitation-list p{color:#64777d;font-size:11px;margin:5px 0 0}.invitation-list button,.remove-member{border:0;background:transparent;color:#9c3030;font:700 11px var(--byui-display);cursor:pointer}.members-heading{margin:0}.member-card h3{color:var(--byui-deep-blue);font:700 23px var(--byui-display);margin:18px 0 4px;overflow-wrap:anywhere}.member-footer span{overflow-wrap:anywhere}.remove-member{display:inline-flex;align-items:center;gap:5px;margin-top:14px;padding:0}.remove-member:disabled,.invitation-list button:disabled{opacity:.5;cursor:not-allowed}@media(max-width:700px){.add-form{grid-template-columns:1fr}.invitation-list article{align-items:flex-start;flex-direction:column}}
  .pending-avatar{background:#fff3cf;color:#a56b1c}.pending-role{color:#a56b1c;background:#f9edc9;border-radius:99px;padding:5px 8px;font:800 8px var(--byui-display);text-transform:uppercase}.invitation-copy{color:#64777d;font-size:11px;line-height:1.5;margin:18px 0 0}.member-footer button{border:0;background:transparent;color:#9c3030;font:700 10px var(--byui-display);cursor:pointer}.member-footer button:disabled{opacity:.5;cursor:not-allowed}
</style>
