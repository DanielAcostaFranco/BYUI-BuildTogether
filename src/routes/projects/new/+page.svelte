<script lang="ts">
  import { ArrowLeft, ArrowRight, Check, Plus, X } from '@lucide/svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { projectSchema } from '$lib/schemas';
  import { interestOptions, skillOptions } from '$lib/profile-options';

  type ProjectRole = { title: string; description: string; skills: string[]; peopleNeeded: number };

  const categories = ['Technology', 'Design', 'Community', 'Business', 'Research'];
  const departments = ['Accounting', 'Business Management', 'Communication', 'Computer Science', 'Design & Construction Management', 'Education', 'Health & Life Sciences', 'Language & Letters', 'Performing & Visual Arts', 'Science, Technology, Engineering & Mathematics', 'Other'];
  const timeOptions = ['1–2 hrs / week', '2–4 hrs / week', '3–5 hrs / week', '5–8 hrs / week', '8+ hrs / week'];
  const locations = ['Remote', 'Hybrid', 'In person'];

  let title = '', summary = '', category = 'Technology', department = '';
  let interests: string[] = [], selectedInterest = '';
  let roles: ProjectRole[] = [{ title: '', description: '', skills: [], peopleNeeded: 1 }];
  let selectedSkills: string[] = [''];
  let hoursPerWeek = '2–4 hrs / week', location = 'Hybrid', teamSize = '3';
  let termsAccepted = false, pending = false, error = '', saved = false;

  onMount(() => document.querySelector('.create-page')?.setAttribute('data-app-ready', 'true'));

  function addRole() {
    if (roles.length < 8) { roles = [...roles, { title: '', description: '', skills: [], peopleNeeded: 1 }]; selectedSkills = [...selectedSkills, '']; }
  }

  function removeRole(index: number) {
    if (roles.length === 1) return;
    roles = roles.filter((_, roleIndex) => roleIndex !== index);
    selectedSkills = selectedSkills.filter((_, roleIndex) => roleIndex !== index);
  }

  function addSkill(roleIndex: number) {
    const skill = selectedSkills[roleIndex]?.trim();
    if (skill && !roles[roleIndex].skills.includes(skill) && roles[roleIndex].skills.length < 8) {
      roles[roleIndex].skills = [...roles[roleIndex].skills, skill];
      roles = roles;
    }
    selectedSkills[roleIndex] = '';
    selectedSkills = selectedSkills;
  }

  function removeSkill(roleIndex: number, skill: string) { roles[roleIndex].skills = roles[roleIndex].skills.filter((item) => item !== skill); roles = roles; }
  function addInterest() { const interest = selectedInterest.trim(); if (interest && !interests.includes(interest) && interests.length < 12) interests = [...interests, interest]; selectedInterest = ''; }
  function removeInterest(interest: string) { interests = interests.filter((item) => item !== interest); }

  function addCustomSkill(event: KeyboardEvent, roleIndex: number) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const input = event.currentTarget as HTMLInputElement;
    const skill = input.value.trim();
    if (skill && !roles[roleIndex].skills.includes(skill) && roles[roleIndex].skills.length < 8) { roles[roleIndex].skills = [...roles[roleIndex].skills, skill]; roles = roles; }
    input.value = '';
  }

  async function createProject() {
    const skills = [...new Set(roles.flatMap((role) => role.skills))];
    const totalOpenRoles = roles.reduce((total, role) => total + Number(role.peopleNeeded), 0);
    const result = projectSchema.safeParse({ title, summary, category, department, skills, interests, roles, hoursPerWeek, location, openRoles: totalOpenRoles, teamSize, termsAccepted });
    if (!result.success) { error = result.error.issues[0]?.message ?? 'Please check your project details.'; return; }
    pending = true; error = '';
    try {
      const response = await fetch('/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(result.data) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? 'Could not create your project.');
      saved = true;
      setTimeout(() => goto(`/projects/${payload.projectId}`), 700);
    } catch (createError) {
      error = createError instanceof Error ? createError.message : 'Could not create your project.';
    } finally { pending = false; }
  }
</script>

<svelte:head><title>Start a project — BuildTogether</title><meta name="description" content="Create a student project on BuildTogether." /></svelte:head>

<div class="create-page">
  <header class="create-header"><a class="brand" href="/" aria-label="BuildTogether home"><span class="brand-mark brand-image"><img src="/brand/handshake-emblem.png" alt="" /></span><span>Build<span>Together</span></span></a><a class="back-link" href="/"><ArrowLeft size={15} /> Back to projects</a></header>
  <main class="create-main">
    <div class="intro"><p class="eyebrow">Start something meaningful</p><h1>Turn your idea into a project.</h1><p>Give other students enough context to understand the opportunity and decide how they can contribute.</p></div>
    <form class="project-form" onsubmit={(event) => { event.preventDefault(); createProject(); }}>
      <section class="form-card"><div class="card-heading"><div><p class="eyebrow">Project interests</p><h2>What is this project about?</h2><p class="section-help">Choose the topics that students may care about.</p></div></div><div class="skill-editor">{#each interests as interest}<button class="skill-chip" type="button" onclick={() => removeInterest(interest)}>{interest}<X size={12} /></button>{/each}</div><div class="add-row"><select aria-label="Add a project interest" bind:value={selectedInterest}><option value="">Select an interest</option>{#each interestOptions as option}<option value={option}>{option}</option>{/each}</select><button class="button button-outline button-small" type="button" onclick={addInterest}><Plus size={14} /> Add interest</button></div></section>
      <section class="form-card"><div class="card-heading"><div><p class="eyebrow">The project</p><h2>Start with the big picture.</h2><p class="section-help">Describe what you want to build, explore, or improve.</p></div><span class="step">01</span></div><label>Project title<input aria-label="Project title" bind:value={title} maxlength="100" placeholder="e.g. Campus Rideshare" /></label><label>Project description<textarea aria-label="Project description" bind:value={summary} maxlength="360" rows="4" placeholder="What are you hoping to build, explore, or improve?"></textarea><small>{summary.length}/360</small></label></section>
      <section class="form-card"><div class="card-heading"><div><p class="eyebrow">Project details</p><h2>Give the idea some context.</h2><p class="section-help">Choose the area, time commitment, and setting for this project.</p></div><span class="step">02</span></div><div class="field-row"><label>Category<select aria-label="Category" bind:value={category}>{#each categories as option}<option value={option}>{option}</option>{/each}</select></label><label>Department or academic area<select aria-label="Department or academic area" bind:value={department}><option value="" disabled>Select an area</option>{#each departments as option}<option value={option}>{option}</option>{/each}</select></label></div><div class="field-row"><label>Estimated time<select aria-label="Estimated time" bind:value={hoursPerWeek}>{#each timeOptions as option}<option value={option}>{option}</option>{/each}</select></label><label>Location<select aria-label="Location" bind:value={location}>{#each locations as option}<option value={option}>{option}</option>{/each}</select></label></div><label>Total team size<input aria-label="Total team size" type="number" min="1" max="30" bind:value={teamSize} /><small>Includes you as the project creator.</small></label></section>
      <section class="form-card"><div class="card-heading"><div><p class="eyebrow">People you need</p><h2>Build the team around the idea.</h2><p class="section-help">Add each position separately and choose how many people you need for it.</p></div><span class="step">03</span></div><div class="role-list">{#each roles as role, roleIndex}<article class="role-editor"><div class="role-editor-heading"><span class="role-number">Position {roleIndex + 1}</span>{#if roles.length > 1}<button class="remove-role" type="button" aria-label="Remove position {roleIndex + 1}" onclick={() => removeRole(roleIndex)}><X size={15} /> Remove</button>{/if}</div><div class="field-row"><label>Position or need<input aria-label="Position or need {roleIndex + 1}" bind:value={role.title} placeholder="e.g. Product designer" /></label><label>People needed<input aria-label="People needed for position {roleIndex + 1}" type="number" min="1" max="30" bind:value={role.peopleNeeded} /></label></div><label>What would they do?<textarea aria-label="Position description {roleIndex + 1}" bind:value={role.description} maxlength="220" rows="3" placeholder="Describe how this person could contribute."></textarea></label><div class="role-skills"><span class="field-label">Skills for this position</span><div class="skill-editor">{#each role.skills as skill}<button class="skill-chip" type="button" onclick={() => removeSkill(roleIndex, skill)}>{skill}<X size={12} /></button>{/each}</div><div class="add-row"><select aria-label="Add a skill to position {roleIndex + 1}" bind:value={selectedSkills[roleIndex]}><option value="">Select a skill</option>{#each skillOptions as option}<option value={option}>{option}</option>{/each}</select><button class="button button-outline button-small" type="button" onclick={() => addSkill(roleIndex)}><Plus size={14} /> Add skill</button></div><input aria-label="Custom skill for position {roleIndex + 1}" class="custom-skill" placeholder="Or type a custom skill and press Enter" onkeydown={(event) => addCustomSkill(event, roleIndex)} /></div></article>{/each}</div><button class="button button-outline add-role" type="button" onclick={addRole} disabled={roles.length >= 8}><Plus size={15} /> Add another position</button></section>
      <section class="form-card guidelines"><div class="card-heading"><div><p class="eyebrow">Community guidelines</p><h2>Make room for good ideas.</h2></div><span class="step">04</span></div><p>Projects must follow BuildTogether’s community standards and reflect principles of law, justice, respect, and appropriate conduct. We are independent from BYU-Idaho, but we follow the values and conduct principles expected in its community.</p><label class="checkbox-label"><input aria-label="Accept community guidelines" type="checkbox" bind:checked={termsAccepted} /><span>I agree to follow the Terms and Conditions and community guidelines.</span></label></section>
      {#if error}<p class="form-error" role="alert">{error}</p>{/if}{#if saved}<p class="save-notice" role="status"><Check size={15} /> Project created. Taking you to the directory…</p>{/if}<button class="button button-dark submit-button" type="submit" disabled={pending || saved}>{pending ? 'Creating…' : 'Create project'} <ArrowRight size={16} /></button>
    </form>
  </main>
</div>

<style>
  .create-page{min-height:100vh;background:#f6fbff;color:#000;font-family:var(--byui-body)}.create-header{height:78px;padding:0 clamp(20px,6vw,80px);display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid rgba(148,149,152,.3)}.create-header .brand{text-decoration:none}.create-header .brand-image{width:46px;height:31px}.back-link{display:flex;align-items:center;gap:7px;color:var(--byui-deep-blue);font:700 12px var(--byui-display);text-decoration:none}.create-main{max-width:820px;margin:auto;padding:68px 20px 90px}.intro{max-width:650px;margin-bottom:32px}.intro h1{margin:0;color:#000;font:700 clamp(40px,6vw,68px)/.95 var(--byui-display);letter-spacing:-.06em}.intro>p:last-child{color:#53656b;font-size:14px;line-height:1.6;max-width:560px;margin:17px 0 0}.project-form{display:grid;gap:16px}.form-card{background:#fff;border:1px solid rgba(148,149,152,.35);border-radius:11px;padding:27px}.card-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:24px}.card-heading h2{color:#000;font:700 25px var(--byui-display);letter-spacing:-.04em;margin:0}.step{color:var(--byui-blue);font:800 12px var(--byui-display)}.form-card label{display:grid;gap:7px;color:var(--byui-deep-blue);font:700 11px var(--byui-display);margin-top:15px}.form-card input,.form-card textarea,.form-card select{width:100%;box-sizing:border-box;border:1px solid #c9d8df;border-radius:6px;padding:11px;color:#000;background:#fff;outline:0;font:14px var(--byui-body)}.form-card textarea{resize:vertical}.form-card input:focus,.form-card textarea:focus,.form-card select:focus{border-color:var(--byui-blue);box-shadow:0 0 0 3px rgba(0,110,182,.14)}.form-card small{color:#829197;font:10px var(--byui-body);text-align:right}.field-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.skill-editor{display:flex;flex-wrap:wrap;gap:7px;min-height:15px;margin-bottom:12px}.skill-chip{display:inline-flex;align-items:center;gap:5px;padding:8px 10px;border:0;background:#e8f4fb;color:var(--byui-deep-blue);border-radius:5px;font:700 11px var(--byui-display);cursor:pointer}.add-row{display:flex;gap:8px}.add-row select{flex:1}.button-small{font-size:10px!important;padding:8px 10px!important}.custom-skill{margin-top:10px!important}.guidelines p{color:#65767b;font-size:12px;line-height:1.65;margin:0}.checkbox-label{display:flex!important;grid-template-columns:none!important;align-items:flex-start;gap:9px!important;color:#334d58!important;line-height:1.5;margin-top:20px!important}.checkbox-label input{width:16px;flex:0 0 auto;margin-top:1px}.form-error{color:#a32626;font:11px var(--byui-display);margin:0}.save-notice{display:flex;align-items:center;gap:7px;color:var(--byui-deep-blue);background:var(--byui-light-blue);padding:10px 13px;border-radius:6px;font:700 11px var(--byui-display);margin:0}.submit-button{justify-self:start}.role-editor{border:1px solid #dfe8eb;border-radius:8px;padding:16px;margin-top:12px;background:#fbfdfe}.role-editor-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:4px}.role-number{color:var(--byui-blue);font:800 10px var(--byui-display);text-transform:uppercase;letter-spacing:.12em}.remove-role{display:inline-flex;align-items:center;justify-content:center;gap:5px;border:1px solid #e1bfc0;background:#fff7f7;color:#a32626;border-radius:5px;padding:6px 9px;font:700 10px var(--byui-display);line-height:1;cursor:pointer}.remove-role:hover{background:#a32626;color:#fff}.add-role{display:inline-flex;align-items:center;justify-content:center;gap:7px;margin-top:16px;min-height:38px}.section-help{color:#71818a;font:12px/1.5 var(--byui-body);margin:8px 0 0}.field-label{display:block;color:var(--byui-deep-blue);font:700 10px var(--byui-display);margin-bottom:8px}.project-form .button:disabled{opacity:.6;cursor:wait}@media(max-width:650px){.create-header{padding:0 20px}.field-row{grid-template-columns:1fr}.add-row{align-items:stretch;flex-direction:column}.submit-button{width:100%;justify-content:center}.role-editor-heading{align-items:flex-start}.remove-role{padding:8px 9px}}
</style>
