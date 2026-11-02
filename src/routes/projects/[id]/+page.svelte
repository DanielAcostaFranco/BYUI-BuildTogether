<script lang="ts">
  import { ArrowLeft, ArrowRight, Check, Clock3, ExternalLink, Mail, MapPin, Shield, Users } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;
  let message = '', contribution = '', experienceLevel = '', experienceDetails = '', workSampleUrl = '', availabilityHours = '';
  let selectedRoleId = '', updateText = '', pending = false, updatePending = false, notice = '', updateNotice = '', error = '';
  let confirmationDialog: HTMLDialogElement;
  let confirmation: { applicationId: string; decision: 'accept' | 'reject'; applicantName: string; roleTitle: string } | null = null;
  let reviewPending = false, reviewError = '';
  onMount(() => document.querySelector('.project-detail-page')?.setAttribute('data-app-ready', 'true'));
  $: canRecruit = data.project.status === 'Recruiting' && data.currentMembers < (data.project.teamSize ?? data.project.openRoles + 1) && data.vacancies.some((role) => role.remaining > 0);
  $: teamIsFull = data.currentMembers >= (data.project.teamSize ?? data.project.openRoles + 1) || (data.vacancies.length > 0 && data.vacancies.every((role) => role.remaining === 0));

  async function apply() {
    pending = true; notice = ''; error = '';
    try {
      const response = await fetch(`/api/projects/${data.project.id}/apply`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roleId: selectedRoleId, message, contribution, experienceLevel, experienceDetails, workSampleUrl, availabilityHours }) });
      const payload = await response.json();
      if (!response.ok) error = payload.message ?? 'Could not send your application.';
      else { notice = payload.message; await invalidateAll(); }
    } catch { error = 'Could not send your application. Try again.'; }
    finally { pending = false; }
  }
  function askToReview(applicationId: string, decision: 'accept' | 'reject', applicantName: string, roleTitle: string) {
    reviewError = '';
    confirmation = { applicationId, decision, applicantName, roleTitle };
    confirmationDialog.showModal();
  }
  async function confirmReview() {
    if (!confirmation || reviewPending) return;
    reviewPending = true;
    reviewError = '';
    try {
      const response = await fetch(`/api/projects/${data.project.id}/applications/${confirmation.applicationId}/${confirmation.decision}`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) { reviewError = payload.message ?? 'Could not review applicant.'; return; }
      confirmationDialog.close();
      window.location.reload();
    } catch { reviewError = 'Could not review applicant. Try again.'; }
    finally { reviewPending = false; }
  }
  async function postUpdate() {
    updatePending = true; error = ''; updateNotice = '';
    try {
      const response = await fetch(`/api/projects/${data.project.id}/updates`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: updateText }) });
      const payload = await response.json();
      if (!response.ok) { error = payload.message ?? 'Could not post update.'; return; }
      updateText = ''; updateNotice = 'Update posted.';
      window.location.reload();
    } catch { error = 'Could not post update. Try again.'; }
    finally { updatePending = false; }
  }
</script>

<svelte:head><title>{data.project.title} — BuildTogether</title></svelte:head>
<div class="project-detail-page">
  <header class="detail-header"><a class="brand" href={data.signedIn ? '/home' : '/'} aria-label="BuildTogether home"><span class="brand-mark brand-image"><img src="/brand/handshake-emblem.png" alt="" /></span><span>Build<span>Together</span></span></a><a class="back-link" href={data.signedIn ? '/home' : '/'}><ArrowLeft size={15} /> Back to projects</a></header>
  <main class="detail-main">
    <a class="back-text" href={data.signedIn ? '/home' : '/'}><ArrowLeft size={14} /> All projects</a>
    <div class="detail-layout">
      <article class="detail-card">
        <div class="status-line"><span class="status" class:closed={!canRecruit}>{data.project.status}</span>{#if data.project.status === 'In progress'}<span class="team-full">{teamIsFull ? 'Team complete · following progress' : 'Recruitment closed · following progress'}</span>{/if}</div>
        <p class="eyebrow">{data.project.category} · {data.project.department}</p>
        <h1>{data.project.title}</h1><p class="summary">{data.project.summary}</p>
        <div class="meta"><span><Clock3 size={15} /> {data.project.hoursPerWeek}</span><span><MapPin size={15} /> {data.project.location}</span><span><Users size={15} /> {data.currentMembers} of {data.project.teamSize ?? data.project.openRoles + 1} people</span></div>
        <div class="detail-divider"></div>
        <h2>Team positions</h2>
        {#if data.project.roles?.length}
          <div class="roles">{#each data.project.roles as role, index}<section><h3>{role.title} <small>{data.vacancies[index]?.remaining ?? 0} of {role.peopleNeeded} openings left</small></h3><p>{role.description}</p><div class="tags">{#each role.skills as skill}<span>{skill}</span>{/each}</div></section>{/each}</div>
        {:else}<p class="muted">No positions listed yet.</p>{/if}
        {#if data.project.links?.length}<div class="detail-divider"></div><h2>Project links</h2><p class="muted">Explore the work, code, and resources shared by the team.</p><div class="project-links">{#each data.project.links as link}<a href={link.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> {link.label}</a>{/each}</div>{/if}
        <div class="detail-divider"></div><h2>Project updates</h2>
        {#if data.project.updates?.length}<div class="updates">{#each [...data.project.updates].reverse() as update}<article class="update"><p>{update.text}</p><small>{update.authorName} · {new Date(update.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</small></article>{/each}</div>{:else}<p class="muted">No progress updates yet. Check back as the team builds.</p>{/if}
        {#if data.isCreator || data.isMember}<form class="update-form" onsubmit={(event) => { event.preventDefault(); postUpdate(); }}><label for="project-update">Share a progress update</label><textarea id="project-update" bind:value={updateText} minlength="10" maxlength="1000" rows="4" placeholder="What has your team built or learned?" required></textarea><button class="button button-dark button-small" type="submit" disabled={updatePending}>{updatePending ? 'Posting…' : 'Post update'}</button>{#if updateNotice}<p role="status">{updateNotice}</p>{/if}</form>{/if}
      </article>
      <aside class="side-card" id="join-requests">
        <p class="eyebrow">Created by</p><h2>{data.project.creator}</h2>
        {#if data.isCreator || data.isMember}<a class="workspace-link" href={`/projects/${data.project.id}/workspace`}><Shield size={13} /> Open team workspace <ArrowRight size={13} /></a>{/if}
        {#if data.isAdmin}
          <a class="edit-link" href={`/projects/${data.project.id}/edit`}>Edit project <ArrowRight size={13} /></a>
          <a class="edit-link" href={`/projects/${data.project.id}/team`}>Manage team <ArrowRight size={13} /></a>
          <h3 class="requests-heading">Join requests {#if data.applications.length}<span>{data.applications.length}</span>{/if}</h3>
          <p class="side-copy">Review applicants and contact them by email.</p>
          {#if data.applications.length}
            <div class="applications">
              {#each data.applications as application}
                <div class="application">
                  <strong>{[application.applicant?.firstName, application.applicant?.lastName].filter(Boolean).join(' ') || 'Name unavailable'}</strong>
                  {#if application.applicant?.email}<a class="applicant-email" href={`mailto:${application.applicant.email}`}><Mail size={13} /> {application.applicant.email}</a>{:else}<span class="applicant-email missing">Contact email unavailable</span>{/if}
                  <small>Position: {application.roleTitle || 'Not selected'}{application.applicant?.major ? ` · ${application.applicant.major}` : ''}</small>
                  <details class="request-details">
                    <summary>Read full request</summary>
                    <div class="request-answer"><h4>Why they want to join</h4><p>{application.message || 'No answer provided.'}</p></div>
                    {#if application.contribution}<div class="request-answer"><h4>How they can help</h4><p>{application.contribution}</p></div>{/if}
                    {#if application.experienceLevel}<div class="request-answer"><h4>Experience</h4><p>{application.experienceLevel}</p>{#if application.experienceDetails}<p>{application.experienceDetails}</p>{/if}</div>{/if}
                    {#if application.availabilityHours}<div class="request-answer"><h4>Weekly availability</h4><p>{application.availabilityHours}</p></div>{/if}
                    {#if application.workSampleUrl}<a class="work-sample" href={application.workSampleUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} /> View work sample</a>{/if}
                  </details>
                  <div class="review-actions"><button class="button button-dark button-small" type="button" onclick={() => askToReview(application.id, 'accept', [application.applicant?.firstName, application.applicant?.lastName].filter(Boolean).join(' ') || application.applicant?.email || 'this applicant', application.roleTitle || 'this position')} disabled={!canRecruit || !application.roleId || reviewPending}>Accept <Check size={13} /></button><button class="button button-outline button-small" type="button" onclick={() => askToReview(application.id, 'reject', [application.applicant?.firstName, application.applicant?.lastName].filter(Boolean).join(' ') || application.applicant?.email || 'this applicant', application.roleTitle || 'this position')} disabled={reviewPending}>Reject</button></div>
                </div>
              {/each}
            </div>
          {:else}<p class="side-copy">No pending applications yet.</p>{/if}
        {:else if data.isMember}<div class="notice"><Check size={15} /> You are on this team.</div>
        {:else if data.currentApplication === 'pending'}<div class="notice">Your application is pending.</div>
        {:else if !canRecruit}<div class="notice">{teamIsFull ? 'This team is complete.' : 'This project is not accepting applications.'} Follow its updates here.</div>
        {:else if !data.signedIn}<p class="side-copy">Sign in to request a position on this team.</p><a class="button button-dark button-full" href="/login">Sign in <ArrowRight size={15} /></a>
        {:else if data.needsApplicantName}<div class="notice">Add your first and last name before requesting to join. The creator will see your name and email address.</div><a class="edit-link" href="/profile">Complete your profile <ArrowRight size={13} /></a>
        {:else}
          <p class="side-copy">Tell the creator why this project fits you and what you would bring to the team.</p>
          <form class="apply-form" onsubmit={(event) => { event.preventDefault(); apply(); }}>
            <label for="role-choice">Position</label>
            <select id="role-choice" aria-label="Position to apply for" bind:value={selectedRoleId} required><option value="" disabled>Choose a position</option>{#each data.vacancies.filter((role) => role.remaining > 0) as role}<option value={role.id}>{role.title} · {role.remaining} open</option>{/each}</select>
            <label for="application-message">Why do you want to join?</label>
            <textarea id="application-message" bind:value={message} rows="4" minlength="20" maxlength="500" placeholder="What interests you about this project?" required></textarea>
            <label for="application-contribution">How could you help?</label>
            <textarea id="application-contribution" bind:value={contribution} rows="4" minlength="20" maxlength="500" placeholder="What would you work on or bring to the team?" required></textarea>
            <label for="experience-level">Relevant experience</label>
            <select id="experience-level" bind:value={experienceLevel} required><option value="" disabled>Choose an option</option><option>Relevant experience</option><option>Some experience</option><option>New to this</option></select>
            <label for="experience-details">Experience or past work {experienceLevel === 'New to this' ? '(optional)' : ''}</label>
            <textarea id="experience-details" bind:value={experienceDetails} rows="4" minlength={experienceLevel === 'New to this' ? undefined : 20} maxlength="700" required={experienceLevel !== '' && experienceLevel !== 'New to this'} placeholder={experienceLevel === 'New to this' ? 'You can share related classes, interests, or what you hope to learn.' : 'Describe a project, class, job, or activity where you used these skills.'}></textarea>
            {#if experienceLevel === 'New to this'}<p class="field-hint">No experience is okay. Tell the creator what you are excited to learn.</p>{/if}
            <label for="work-sample-url">Link to your work (optional)</label>
            <input id="work-sample-url" type="url" bind:value={workSampleUrl} maxlength="300" placeholder="https://github.com/your-project" />
            <label for="availability-hours">Time you can commit each week</label>
            <select id="availability-hours" bind:value={availabilityHours} required><option value="" disabled>Choose your availability</option><option>1–2 hours</option><option>3–5 hours</option><option>6–10 hours</option><option>10+ hours</option></select>
            <p class="contact-disclosure">The creator will see your name, email address, and these answers.</p>
            {#if notice}<p class="notice" role="status">{notice}</p>{/if}
            <button class="button button-dark button-full" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Request to join'} <ArrowRight size={15} /></button>
          </form>
        {/if}
        {#if error}<p class="form-error" role="alert">{error}</p>{/if}
      </aside>
    </div>
  </main>
  <dialog class="review-dialog" bind:this={confirmationDialog} oncancel={(event) => { if (reviewPending) event.preventDefault(); }} onclose={() => { confirmation = null; reviewError = ''; }}>
    {#if confirmation}
      <p class="eyebrow">Review join request</p>
      <h2>{confirmation.decision === 'accept' ? 'Accept this request?' : 'Reject this request?'}</h2>
      <p class="dialog-copy">{#if confirmation.decision === 'accept'}Add <strong>{confirmation.applicantName}</strong> to <strong>{data.project.title}</strong> as <strong>{confirmation.roleTitle}</strong>? The applicant will be notified and the team count will update.{:else}Decline <strong>{confirmation.applicantName}</strong>’s request to join <strong>{data.project.title}</strong>? The applicant will be notified.{/if}</p>
      {#if reviewError}<p class="dialog-error" role="alert">{reviewError}</p>{/if}
      <div class="dialog-actions"><button class="button button-outline button-small" type="button" onclick={() => confirmationDialog.close()} disabled={reviewPending}>Cancel</button><button class="button {confirmation.decision === 'accept' ? 'button-dark' : 'button-reject'} button-small" type="button" onclick={confirmReview} disabled={reviewPending}>{reviewPending ? 'Saving…' : confirmation.decision === 'accept' ? 'Yes, accept' : 'Yes, reject'}</button></div>
    {/if}
  </dialog>
</div>

<style>
  .project-detail-page{min-height:100vh;background:#f6fbff;color:#000;font-family:var(--byui-body)}
  .detail-header{height:78px;padding:0 clamp(20px,6vw,80px);display:flex;justify-content:space-between;align-items:center;background:#fff;border-bottom:1px solid #dce7e9}.detail-header .brand{text-decoration:none}.detail-header .brand-image{width:46px;height:31px}
  .back-link,.back-text{display:flex;align-items:center;gap:7px;color:var(--byui-deep-blue);font:700 12px var(--byui-display);text-decoration:none}.detail-main{max-width:1100px;margin:auto;padding:50px 20px 90px}.back-text{margin-bottom:20px}
  .detail-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px}.detail-card,.side-card{background:#fff;border:1px solid #dce7e9;border-radius:11px;padding:30px}.status-line{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.status{display:inline-block;color:#2d8b68;background:#dff1e8;border-radius:99px;padding:6px 10px;font-size:10px;font-weight:800}.status.closed{color:#23465d;background:#dcecf6}.team-full{font-size:11px;color:#64777d}
  .eyebrow{color:var(--byui-blue);font:800 10px var(--byui-display);text-transform:uppercase;letter-spacing:.14em;margin:18px 0 10px}.detail-card h1{font:700 clamp(40px,6vw,70px)/.95 var(--byui-display);letter-spacing:-.06em;margin:0;color:#000}.summary{color:#53656b;font-size:15px;line-height:1.7;max-width:680px;margin:20px 0}.meta{display:flex;flex-wrap:wrap;gap:15px;color:#6f8288;font-size:11px}.meta span{display:flex;align-items:center;gap:5px}.detail-divider{border-top:1px solid #dfe6e8;margin:30px 0}.detail-card h2,.side-card h2{font:700 24px var(--byui-display);margin:0;color:var(--byui-deep-blue)}
  .roles,.updates{display:grid;gap:10px;margin-top:18px}.roles section,.update{border:1px solid #e0e9eb;border-radius:8px;padding:15px}.roles h3{font:700 15px var(--byui-display);margin:0;color:var(--byui-deep-blue)}.roles h3 small{font:400 11px var(--byui-body);color:#77898e;margin-left:7px}.roles p,.side-copy,.muted{color:#687b80;font-size:12px;line-height:1.6}.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.tags span{background:#e8f4fb;color:var(--byui-deep-blue);border-radius:4px;padding:6px 8px;font:700 10px var(--byui-display)}
  .project-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}.project-links a{display:inline-flex;align-items:center;gap:7px;border:1px solid #b9d5e4;background:#f3faff;color:var(--byui-deep-blue);border-radius:7px;padding:9px 12px;text-decoration:none;font:700 12px var(--byui-display)}.project-links a:hover{background:#dceff9}.workspace-link{display:flex;align-items:center;gap:6px;color:var(--byui-blue);font:700 11px var(--byui-display);text-decoration:none;margin-top:14px}.update p{white-space:pre-wrap;color:#42555d;font-size:13px;line-height:1.6;margin:0 0 10px}.update small{color:#839399;font-size:10px}
  .update-form,.apply-form{display:grid;gap:10px;margin-top:20px}.update-form label,.apply-form label{font:700 11px var(--byui-display);color:var(--byui-deep-blue)}.update-form textarea,.apply-form textarea,.apply-form select{box-sizing:border-box;width:100%;resize:vertical;border:1px solid #c9d8df;border-radius:6px;padding:10px;font:13px var(--byui-body);background:#fff;color:#1b2a30}.update-form .button{justify-self:start}.side-card{height:max-content}.side-card h2{font-size:27px}.edit-link{display:flex;align-items:center;gap:5px;color:var(--byui-blue);font:700 11px var(--byui-display);text-decoration:none;margin-top:12px}.requests-heading{display:flex;align-items:center;gap:8px;margin:24px 0 0;color:var(--byui-deep-blue);font:700 15px var(--byui-display)}.requests-heading span{display:grid;place-items:center;min-width:20px;height:20px;padding:0 3px;border-radius:99px;background:var(--byui-light-blue);font-size:10px}.applications{display:grid;gap:10px;margin-top:20px}.application{border-top:1px solid #e1e9eb;padding-top:12px}.application strong,.application small{display:block}.application strong{color:var(--byui-deep-blue);font:700 13px var(--byui-display)}.applicant-email{display:inline-flex;align-items:center;gap:6px;max-width:100%;overflow-wrap:anywhere;color:var(--byui-blue);font:700 11px var(--byui-body);margin-top:7px;text-decoration:underline;text-underline-offset:2px}.applicant-email.missing{color:#6a7d85;text-decoration:none}.application small{color:#6a7d85;margin-top:7px}.application p{color:#687b80;font-size:11px;line-height:1.5}.contact-disclosure{color:#64777d;font-size:11px;line-height:1.5;margin:0 0 2px}.review-actions{display:flex;gap:7px;flex-wrap:wrap}.button-full{width:100%;justify-content:center}.notice{display:flex;align-items:center;gap:7px;background:var(--byui-light-blue);color:var(--byui-deep-blue);border-radius:6px;padding:11px;font:700 11px var(--byui-display);margin-top:18px}.form-error{color:#a32626;font:11px var(--byui-display)}
  .apply-form input{box-sizing:border-box;width:100%;border:1px solid #c9d8df;border-radius:6px;padding:10px;font:13px var(--byui-body);background:#fff;color:#1b2a30}.apply-form textarea{line-height:1.5}.field-hint{color:#64777d;font-size:11px;line-height:1.5;margin:-4px 0 2px}.request-details{margin:14px 0;border:1px solid #dce7e9;border-radius:7px;background:#f9fcfe;padding:10px}.request-details summary{color:var(--byui-blue);font:700 11px var(--byui-display);cursor:pointer}.request-answer{border-top:1px solid #e0e9eb;margin-top:11px;padding-top:10px}.request-answer h4{color:var(--byui-deep-blue);font:700 11px var(--byui-display);margin:0 0 5px}.request-answer p{white-space:pre-wrap;overflow-wrap:anywhere;margin:3px 0 0}.work-sample{display:inline-flex;align-items:center;gap:5px;margin-top:11px;color:var(--byui-blue);font:700 11px var(--byui-display)}
  .review-dialog{box-sizing:border-box;width:min(440px,calc(100vw - 32px));max-height:calc(100vh - 32px);border:1px solid #dce7e9;border-radius:14px;padding:28px;background:#fff;color:var(--byui-deep-blue);box-shadow:0 22px 70px #12354a40;font-family:var(--byui-body)}.review-dialog::backdrop{background:#071e33a6}.review-dialog .eyebrow{margin:0 0 10px}.review-dialog h2{font:700 26px var(--byui-display);margin:0}.dialog-copy{color:#53656b;font-size:13px;line-height:1.6;margin:16px 0 22px}.dialog-copy strong{color:var(--byui-deep-blue)}.dialog-actions{display:flex;justify-content:flex-end;gap:9px;flex-wrap:wrap}.dialog-error{color:#a32626;font-size:12px;line-height:1.5}.button-reject{background:#9c3030;color:#fff;border-color:#9c3030}
  @media(max-width:760px){.detail-layout{grid-template-columns:1fr}.detail-header{padding:0 20px}.detail-header .back-link{display:none}.detail-card,.side-card{padding:22px}}
</style>
