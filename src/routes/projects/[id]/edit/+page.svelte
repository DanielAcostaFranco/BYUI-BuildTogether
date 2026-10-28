<script lang="ts">
  import { ArrowLeft, ArrowRight, Check, Plus, X } from '@lucide/svelte';
  import { goto } from '$app/navigation';
  import { projectSchema } from '$lib/schemas';
  import { roleId } from '$lib/project-flow';
  import { interestOptions, skillOptions } from '$lib/profile-options';
  import type { ProjectRole, ProjectLink, ProjectStatus } from '$lib/types';
  import type { PageData } from './$types';

  export let data: PageData;
  const categories = ['Technology', 'Design', 'Community', 'Business', 'Research'];
  const departments = ['Accounting', 'Business Management', 'Communication', 'Computer Science', 'Design & Construction Management', 'Education', 'Health & Life Sciences', 'Language & Letters', 'Performing & Visual Arts', 'Science, Technology, Engineering & Mathematics', 'Other'];
  const timeOptions = ['1–2 hrs / week', '2–4 hrs / week', '3–5 hrs / week', '5–8 hrs / week', '8+ hrs / week'];
  const locations = ['Remote', 'Hybrid', 'In person'];
  let title = data.project.title, summary = data.project.summary, category = data.project.category, department = data.project.department;
  let status: ProjectStatus = data.project.status;
  let interests: string[] = data.project.interests ?? [], selectedInterest = '';
  let hoursPerWeek = data.project.hoursPerWeek, location = data.project.location, teamSize = String(data.project.teamSize ?? data.project.openRoles + 1);
  let roles: ProjectRole[] = data.project.roles?.map((role, index) => ({ ...role, id: roleId(role, index), skills: [...role.skills] })) ?? [{ title: '', description: '', skills: [], peopleNeeded: 1 }];
  let links: ProjectLink[] = data.project.links?.map((link) => ({ ...link })) ?? [];
  let selectedSkills = roles.map(() => ''), pending = false, error = '', saved = false;
  function addRole() { if (roles.length < 8) { roles = [...roles, { title: '', description: '', skills: [], peopleNeeded: 1 }]; selectedSkills = [...selectedSkills, '']; } }
  function removeRole(index: number) { if (roles.length > 1) { roles = roles.filter((_, i) => i !== index); selectedSkills = selectedSkills.filter((_, i) => i !== index); } }
  function addSkill(index: number) { const skill = selectedSkills[index]; if (skill && !roles[index].skills.includes(skill)) roles[index].skills = [...roles[index].skills, skill]; roles = roles; selectedSkills[index] = ''; selectedSkills = selectedSkills; }
  function removeSkill(index: number, skill: string) { roles[index].skills = roles[index].skills.filter((item) => item !== skill); roles = roles; }
  function addInterest() { const interest = selectedInterest.trim(); if (interest && !interests.includes(interest) && interests.length < 12) interests = [...interests, interest]; selectedInterest = ''; }
  function removeInterest(interest: string) { interests = interests.filter((item) => item !== interest); }
  function addLink() { if (links.length < 8) links = [...links, { label: '', url: '' }]; }
  function removeLink(index: number) { links = links.filter((_, itemIndex) => itemIndex !== index); }

  async function saveProject() {
    const skills = [...new Set(roles.flatMap((role) => role.skills))];
    const openRoles = roles.reduce((total, role) => total + Number(role.peopleNeeded), 0);
    const result = projectSchema.safeParse({ title, summary, category, department, status, skills, interests, roles, links, hoursPerWeek, location, openRoles, teamSize, termsAccepted: true });
    if (!result.success) { error = result.error.issues[0]?.message ?? 'Please check your project details.'; return; }
    pending = true; error = '';
    try {
      const response = await fetch(`/api/projects/${data.project.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(result.data) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? 'Could not update your project.');
      saved = true; setTimeout(() => goto(`/projects/${data.project.id}`), 700);
    } catch (saveError) { error = saveError instanceof Error ? saveError.message : 'Could not update your project.'; }
    finally { pending = false; }
  }
</script>

<svelte:head><title>Edit {data.project.title} — BuildTogether</title></svelte:head>
<div class="edit-page"><header class="edit-header"><a class="brand" href="/home" aria-label="BuildTogether home"><span class="brand-mark brand-image"><img src="/brand/handshake-emblem.png" alt="" /></span><span>Build<span>Together</span></span></a><a href={`/projects/${data.project.id}`} class="back-link"><ArrowLeft size={15} /> Back to project</a></header>
  <main class="edit-main"><div class="intro"><p class="eyebrow">Project settings</p><h1>Edit your project.</h1><p>Keep the opportunity and its progress accurate as your team evolves.</p></div>
    <form class="edit-form" onsubmit={(event) => { event.preventDefault(); saveProject(); }}>
      <section class="form-card"><div class="card-heading"><h2>Project details</h2></div><label>Project title<input aria-label="Project title" bind:value={title} /></label><label>Project description<textarea aria-label="Project description" bind:value={summary} rows="4"></textarea></label><div class="field-row"><label>Category<select aria-label="Category" bind:value={category}>{#each categories as option}<option value={option}>{option}</option>{/each}</select></label><label>Department<select aria-label="Department" bind:value={department}>{#each departments as option}<option value={option}>{option}</option>{/each}</select></label></div><div class="field-row"><label>Estimated time<select aria-label="Estimated time" bind:value={hoursPerWeek}>{#each timeOptions as option}<option value={option}>{option}</option>{/each}</select></label><label>Location<select aria-label="Location" bind:value={location}>{#each locations as option}<option value={option}>{option}</option>{/each}</select></label></div><div class="field-row"><label>Total team size<input aria-label="Total team size" type="number" min="1" max="30" bind:value={teamSize} /><small>Includes you and cannot be smaller than current membership.</small></label><label>Project status<select aria-label="Project status" bind:value={status}><option value="Recruiting">Recruiting</option><option value="Idea">Idea</option><option value="In progress">In progress — applications closed</option><option value="Completed">Completed — archived in directory</option></select><small>A full team automatically moves to In progress.</small></label></div></section>
      <section class="form-card"><div class="card-heading"><h2>People you need</h2></div>{#each roles as role, index}<article class="role"><div class="role-top"><strong>Position {index + 1}</strong>{#if roles.length > 1}<button class="remove" type="button" onclick={() => removeRole(index)}><X size={14} /> Remove</button>{/if}</div><div class="field-row"><label>Position<input aria-label="Position {index + 1}" bind:value={role.title} /></label><label>People needed<input aria-label="People needed {index + 1}" type="number" min="1" max="30" bind:value={role.peopleNeeded} /></label></div><label>Description<textarea aria-label="Description {index + 1}" bind:value={role.description} rows="3"></textarea></label><div class="skills"><div>{#each role.skills as skill}<button type="button" class="skill" onclick={() => removeSkill(index, skill)}>{skill}<X size={11} /></button>{/each}</div><div class="add-skill"><select aria-label="Skill for position {index + 1}" bind:value={selectedSkills[index]}><option value="">Add a skill</option>{#each skillOptions as skill}<option value={skill}>{skill}</option>{/each}</select><button class="button button-outline small" type="button" onclick={() => addSkill(index)}><Plus size={13} /> Add</button></div></div></article>{/each}<button class="button button-outline add-item" type="button" onclick={addRole} disabled={roles.length >= 8}><Plus size={14} /> Add another position</button></section>
      <section class="form-card"><div class="card-heading"><h2>Project links</h2></div><p class="section-help">Share GitHub, prototypes, documentation, or a project website.</p>{#each links as link, index}<div class="field-row link-row"><label>Link label<input aria-label="Project link label {index + 1}" bind:value={link.label} placeholder="GitHub repository" /></label><label>URL<input aria-label="Project link URL {index + 1}" type="url" bind:value={link.url} placeholder="https://github.com/..." /></label><button class="remove" type="button" aria-label="Remove project link {index + 1}" onclick={() => removeLink(index)}><X size={14} /> Remove</button></div>{/each}<button class="button button-outline add-item" type="button" onclick={addLink} disabled={links.length >= 8}><Plus size={14} /> Add project link</button></section>
      <section class="form-card"><div class="card-heading"><h2>Project interests</h2></div><div class="skills"><div>{#each interests as interest}<button type="button" class="skill" onclick={() => removeInterest(interest)}>{interest}<X size={11} /></button>{/each}</div><div class="add-skill"><select aria-label="Add a project interest" bind:value={selectedInterest}><option value="">Choose an interest</option>{#each interestOptions as interest}<option value={interest}>{interest}</option>{/each}</select><button class="button button-outline small" type="button" onclick={addInterest}><Plus size={13} /> Add</button></div></div></section>
      {#if error}<p class="form-error" role="alert">{error}</p>{/if}{#if saved}<p class="notice" role="status"><Check size={15} /> Project updated.</p>{/if}<button class="button button-dark" type="submit" disabled={pending || saved}>{pending ? 'Saving…' : 'Save project'} <ArrowRight size={15} /></button>
    </form>
  </main>
</div>

<style>
  .edit-page{min-height:100vh;background:#f6fbff;color:#000;font-family:var(--byui-body)}.edit-header{height:78px;padding:0 clamp(20px,6vw,80px);display:flex;justify-content:space-between;align-items:center;background:#fff;border-bottom:1px solid #dce7e9}.edit-header .brand{text-decoration:none}.edit-header .brand-image{width:46px;height:31px}.back-link{display:flex;align-items:center;gap:7px;color:var(--byui-deep-blue);font:700 12px var(--byui-display);text-decoration:none}
  .edit-main{max-width:820px;margin:auto;padding:60px 20px 90px}.intro h1{font:700 clamp(40px,6vw,68px)/.95 var(--byui-display);letter-spacing:-.06em;margin:0}.intro p:last-child{color:#64777d;font-size:14px}.edit-form{display:grid;gap:16px;margin-top:30px}.form-card{background:#fff;border:1px solid #dce7e9;border-radius:10px;padding:26px}.card-heading{margin-bottom:22px}.card-heading h2{font:700 25px var(--byui-display);color:var(--byui-deep-blue);margin:0}.eyebrow{color:var(--byui-blue);font:800 10px var(--byui-display);text-transform:uppercase;letter-spacing:.14em;margin:0 0 8px}.form-card label{display:grid;gap:7px;color:var(--byui-deep-blue);font:700 11px var(--byui-display);margin-top:14px}.form-card input,.form-card textarea,.form-card select{width:100%;box-sizing:border-box;border:1px solid #c9d8df;border-radius:6px;padding:10px;font:14px var(--byui-body);outline:0}.field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form-card small{color:#829197;font:10px var(--byui-body)}.role{border:1px solid #e0e9eb;border-radius:8px;padding:15px;margin-top:12px}.role-top{display:flex;justify-content:space-between;align-items:center;color:var(--byui-blue);font:800 10px var(--byui-display);text-transform:uppercase}.remove{display:inline-flex;align-items:center;gap:4px;color:#a32626;background:#fff7f7;border:1px solid #e1bfc0;border-radius:5px;padding:7px 10px;font:700 10px var(--byui-display);cursor:pointer}.skills{margin-top:16px}.skills>div:first-child{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}.skill{display:inline-flex;align-items:center;gap:4px;border:0;border-radius:5px;background:#e8f4fb;color:var(--byui-deep-blue);padding:7px 8px;font:700 10px var(--byui-display)}.add-skill{display:flex;gap:7px}.add-skill select{flex:1}.small{padding:8px 10px!important;font-size:10px!important}.form-error{color:#a32626;font:11px var(--byui-display)}.notice{display:flex;align-items:center;gap:6px;background:var(--byui-light-blue);color:var(--byui-deep-blue);padding:10px;border-radius:6px;font:700 11px var(--byui-display)}.add-item{display:inline-flex;align-items:center;gap:7px;margin-top:16px}.section-help{font-size:12px;color:#71818a}.link-row{align-items:end;margin-top:14px}.link-row .remove{grid-column:1/-1;justify-self:end}
  @media(max-width:650px){.field-row{grid-template-columns:1fr}.edit-header{padding:0 20px}.edit-header .back-link{font-size:11px}.add-skill{flex-direction:column}}
</style>
