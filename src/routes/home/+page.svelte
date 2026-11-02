<script lang="ts">
  import { ArrowRight, Bookmark, Clock3, MapPin, Plus, Search, UserRound, Users } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import { filterDashboardProjects } from '$lib/types';
  import Brand from '$lib/components/Brand.svelte';

  export let data: PageData;
  let query = '';
  let category = 'All projects';
  let status = 'Any status';
  let location = 'Any location';
  let visibleCount = 9;
  const categories = ['All projects', 'Technology', 'Design', 'Community', 'Business', 'Research'];
  let saved = new Set<string>();
  $: projects = filterDashboardProjects(data.projects, query, category, status, location);
  $: shownProjects = projects.slice(0, visibleCount);
  function resetVisibleCount() { visibleCount = 9; }
  $: firstName = data.user.firstName || 'Student';
  onMount(() => document.querySelector('.dashboard-page')?.setAttribute('data-app-ready', 'true'));
  function toggleSaved(id: string) { saved = new Set(saved); saved.has(id) ? saved.delete(id) : saved.add(id); }
</script>

<svelte:head><title>Home — BuildTogether</title><meta name="description" content="Your BuildTogether student dashboard." /></svelte:head>

<div class="dashboard-page">
  <header class="dashboard-header"><Brand href="/home" /><nav><a href="/home" class="active">Home</a><a href="/applications">My applications</a><a href="/projects/mine">My projects</a><a href="/profile"><UserRound size={14} /> Profile</a><a class="button button-dark button-small" href="/projects/new"><Plus size={14} /> Start a project</a></nav></header>
  <main class="dashboard-main">
    <section class="welcome"><div><p class="eyebrow">Your BuildTogether home</p><h1>Welcome back, {firstName}.</h1><p>Find a project that fits your curiosity, your skills, and the time you have.</p></div><div class="welcome-actions"><a class="button button-dark" href="/projects/new">Start a project <ArrowRight size={15} /></a><a class="button button-outline" href="/profile">Complete your profile</a></div></section>
    <section class="dashboard-stats"><div><span class="stat-icon"><Search size={16} /></span><strong>{data.projectCount}</strong><span>projects to explore</span></div><div><span class="stat-icon"><Users size={16} /></span><strong>{data.registeredUserCount}</strong><span>registered users</span></div><div><span class="stat-icon"><Clock3 size={16} /></span><strong>2–5 hrs</strong><span>typical weekly commitment</span></div></section>
    <section class="project-section">
      <div class="section-heading"><div><p class="eyebrow">Discover opportunities</p><h2>Find your next project.</h2></div><span class="result-count">{projects.length} matching projects</span></div>
      <div class="dashboard-filters" aria-label="Project filters">
        <label class="search-field"><Search size={15} /><input aria-label="Search dashboard projects" bind:value={query} oninput={resetVisibleCount} placeholder="Search projects, skills, or people" /></label>
        <label>Category<select aria-label="Filter by category" bind:value={category} onchange={resetVisibleCount}>{#each categories as option}<option value={option}>{option}</option>{/each}</select></label>
        <label>Status<select aria-label="Filter by status" bind:value={status} onchange={resetVisibleCount}><option>Any status</option><option>Recruiting</option><option>In progress</option><option>Completed</option></select></label>
        <label>Location<select aria-label="Filter by location" bind:value={location} onchange={resetVisibleCount}><option>Any location</option><option>Remote</option><option>Hybrid</option><option>In person</option></select></label>
      </div>
      {#if projects.length > 0}<div class="project-grid">{#each shownProjects as project}<article class:featured={project.featured} class="project-card"><div class="project-card-top"><span class="status">{project.status}</span><button class:saved={saved.has(project.id)} class="icon-button" type="button" aria-label={saved.has(project.id) ? `Remove ${project.title} from saved projects` : `Save ${project.title}`} onclick={() => toggleSaved(project.id)}><Bookmark size={17} fill={saved.has(project.id) ? 'currentColor' : 'none'} /></button></div><div class="project-category">{project.category} <span>·</span> {project.department}</div><h3><a class="project-title-link" href={`/projects/${project.id}`}>{project.title}</a></h3><p>{project.summary}</p><div class="tag-list">{#each project.skills as skill}<span>{skill}</span>{/each}</div><div class="project-footer"><span><Clock3 size={14} /> {project.hoursPerWeek}</span><span><MapPin size={14} /> {project.location}</span></div><div class="creator"><span class="avatar">{project.initials}</span><span>Created by <strong>{project.creator}</strong></span></div></article>{/each}</div>{:else}<div class="empty-state"><h3>No projects match those filters.</h3><p>Try another category, status, location, or search term.</p></div>{/if}
      {#if projects.length > visibleCount}<button class="more-projects" type="button" onclick={() => (visibleCount += 9)}>More projects <ArrowRight size={15} /></button>{/if}
    </section>
  </main>
</div>

<style>
  .dashboard-page{min-height:100vh;background:#f6fbff;color:#000;font-family:var(--byui-body)}.dashboard-header{height:78px;padding:0 clamp(20px,6vw,80px);display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid rgba(148,149,152,.3)}.dashboard-header .brand{text-decoration:none}.dashboard-header .brand-image{width:46px;height:31px}.dashboard-header nav{display:flex;align-items:center;gap:22px}.dashboard-header nav>a:not(.button){display:flex;align-items:center;gap:5px;color:#64777d;font:700 12px var(--byui-display);text-decoration:none}.dashboard-header nav>a.active{color:var(--byui-deep-blue)}.dashboard-main{max-width:1240px;margin:auto;padding:64px clamp(20px,6vw,80px) 90px}.welcome{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;padding-bottom:45px}.welcome h1{margin:0;color:#000;font:700 clamp(38px,5vw,65px)/.96 var(--byui-display);letter-spacing:-.06em}.welcome p:last-child{color:#53656b;font-size:14px;margin:16px 0 0}.welcome-actions{display:flex;gap:10px;flex:0 0 auto}.dashboard-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:56px}.dashboard-stats>div{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #dce7e9;border-radius:8px;padding:15px}.stat-icon{width:29px;height:29px;display:grid;place-items:center;background:var(--byui-light-blue);color:var(--byui-deep-blue);border-radius:50%}.dashboard-stats strong{color:var(--byui-deep-blue);font:700 16px var(--byui-display)}.dashboard-stats>div>span:last-child{color:#7c8d92;font-size:10px}.project-section .section-heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:18px}.project-section h2{color:#000;font:700 32px var(--byui-display);letter-spacing:-.05em;margin:0}.search-field{display:flex;align-items:center;gap:7px;border:1px solid #d5e2e4;background:#fff;border-radius:6px;padding:8px 10px;color:#839399}.search-field input{border:0;outline:0;color:#1a303a;font:12px var(--byui-body);width:190px}.project-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.project-card{display:flex;flex-direction:column;min-height:315px;background:#fff;border:1px solid #dfe8e9;border-radius:9px;padding:18px}.project-card.featured{background:var(--byui-deep-blue);color:#fff;border-color:var(--byui-deep-blue)}.project-card.featured h3,.project-card.featured .project-category,.project-card.featured .project-footer,.project-card.featured .creator{color:#fff}.project-card.featured p{color:#c5d5da}.project-card-top{display:flex;justify-content:space-between}.status{color:#2d8b68;background:#dff1e8;border-radius:99px;padding:5px 8px;font-size:8px;font-weight:800;letter-spacing:.08em}.status.idea{color:#a56b1c;background:#f9edc9}.icon-button{padding:2px;border:0;color:#8aa0a0;background:transparent;cursor:pointer}.icon-button.saved{color:#e36b43}.project-category{color:#7f9293;font-size:10px;margin-top:20px}.project-category span{margin:0 3px;color:#b5c1bd}.project-card h3{color:var(--byui-deep-blue);font:700 19px/1.05 var(--byui-display);letter-spacing:-.05em;margin:8px 0 9px}.project-card p{color:#71818a;font-size:11px;line-height:1.5;margin:0}.tag-list{display:flex;flex-wrap:wrap;gap:5px;margin:17px 0}.tag-list span{background:#e9f0ec;color:#5e7779;border-radius:3px;padding:5px 6px;font-size:9px}.project-footer{display:flex;gap:9px;flex-wrap:wrap;color:#7e9091;font-size:9px;margin-top:auto}.project-footer span{display:inline-flex;align-items:center;gap:4px}.creator{display:flex;align-items:center;gap:6px;color:#788c8c;font-size:9px;margin-top:15px;padding-top:12px;border-top:1px solid #e0e8e3}.creator strong{color:var(--byui-deep-blue)}.project-card.featured .creator{border-color:rgba(255,255,255,.18)}.avatar{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:var(--byui-light-blue);color:var(--byui-deep-blue);font-size:8px;font-weight:800}.empty-state{text-align:center;padding:60px;border:1px dashed #cbdad5;border-radius:9px}.empty-state h3{color:var(--byui-deep-blue);margin:0 0 6px}.empty-state p{color:#71818a;font-size:12px;margin:0}@media(max-width:800px){.welcome{align-items:flex-start;flex-direction:column}.welcome-actions{flex-wrap:wrap}.dashboard-stats{grid-template-columns:1fr}.project-section .section-heading{align-items:flex-start;flex-direction:column;gap:14px}.project-grid{grid-template-columns:1fr}.dashboard-header nav>a:not(.button){display:none}}
  .result-count{color:#64777d;font:700 11px var(--byui-display)}
  .dashboard-filters{display:grid;grid-template-columns:minmax(200px,1.5fr) repeat(3,minmax(130px,1fr));align-items:end;gap:10px;margin:0 0 18px;padding:15px;background:#fff;border:1px solid #dce7e9;border-radius:9px}
  .dashboard-filters>label:not(.search-field){display:grid;gap:6px;color:var(--byui-deep-blue);font:700 11px var(--byui-display)}
  .dashboard-filters select{width:100%;border:1px solid #cbdde4;border-radius:6px;background:#fff;color:var(--byui-deep-blue);padding:10px;font:12px var(--byui-body)}
  .dashboard-filters .search-field{margin:0;min-height:38px;box-sizing:border-box}.dashboard-filters .search-field input{width:100%}
  .more-projects{display:flex;align-items:center;justify-content:center;gap:7px;margin:24px auto 0;border:1px solid #a7c9dd;border-radius:7px;background:#fff;color:var(--byui-deep-blue);padding:12px 20px;cursor:pointer;font:700 12px var(--byui-display)}
  .more-projects:hover{background:var(--byui-light-blue)}
  @media(max-width:900px){.dashboard-filters{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:560px){.dashboard-filters{grid-template-columns:1fr}.dashboard-filters .search-field input{width:100%}}
</style>
