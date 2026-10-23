<script lang="ts">
  import { ArrowRight, Bookmark, Check, ChevronDown, Clock3, Compass, Filter, MapPin, Search, Sparkles, Users } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { filterDashboardProjects, type Project } from '$lib/types';
  import type { PageData } from './$types';

  export let data: PageData;

  let query = '';
  let category = 'All projects';
  let status = 'Any status';
  let location = 'Any location';
  let visibleCount = 9;
  let menuOpen = false;
  let saved = new Set<string>();
  let projectItems: Project[] = data.projects;

  $: visibleProjects = filterDashboardProjects(projectItems, query, category, status, location);

  const categories = ['All projects', 'Technology', 'Design', 'Community', 'Business', 'Research'];

  onMount(() => {
    document.querySelector('.site-shell')?.setAttribute('data-app-ready', 'true');
  });

  function toggleSaved(id: string) {
    saved = new Set(saved);
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
  }

</script>

<svelte:head>
  <title>BuildTogether — Where student ideas become real projects</title>
  <meta name="description" content="Discover meaningful student projects and find your next team at BYU-Idaho." />
</svelte:head>

<div class="site-shell">
  <header class="topbar">
    <a class="brand" href="/" aria-label="BuildTogether home">
      <span class="brand-mark brand-image"><img src="/brand/handshake-emblem.png" alt="" /></span>
      <span>Build<span>Together</span></span>
    </a>

    <div class="top-actions">
      <a class="sign-in" href="/login">Sign in</a>
      <a class="button button-dark button-small" href="/projects/new">Start a project <ArrowRight size={15} /></a>
    </div>
  </header>

  <main>
    <section class="hero" id="about">
      <div class="hero-copy">
        <p class="eyebrow"><span class="eyebrow-dot"></span> The student project hub</p>
        <h1>Build something that matters <em>together.</em></h1>
        <p class="hero-lede">Find collaborators, practice the skills you care about, and leave BYU-Idaho with proof of what you can build.</p>
        <div class="hero-actions">
          <a class="button button-dark" href="#projects">Explore projects <ArrowRight size={16} /></a>
          <a class="text-link" href="#how-it-works">See how it works <ArrowRight size={15} /></a>
        </div>
        <div class="hero-proof"><span class="proof-avatars"><i>AM</i><i>SW</i><i>NL</i><i>+ </i></span><span><strong>61 students</strong> are collaborating this month</span></div>
      </div>
      <div class="hero-art" aria-label="Illustration of students collaborating">
        <div class="sun"></div><div class="scribble scribble-one">✦</div><div class="scribble scribble-two">↗</div>
        <div class="paper-card paper-main"><span class="paper-label">PROJECT IN PROGRESS</span><h2>Campus<br /><strong>Rideshare</strong></h2><div class="mini-line"></div><div class="paper-meta"><span><Users size={14} /> 4 collaborators</span><span><Clock3 size={14} /> 3–5 hrs</span></div></div>
        <div class="paper-card paper-note"><span class="note-check"><Check size={13} /></span><span>Make room<br /><strong>for good ideas.</strong></span></div>
        <div class="hero-shape"></div>
      </div>
    </section>

    <section class="projects-section" id="projects">
      <div class="section-heading"><div><p class="eyebrow">Explore the community</p><h2>Find your next project.</h2><p>Real ideas, real collaborators, room for you.</p></div><button class="section-link view-all" type="button" onclick={() => (visibleCount = visibleProjects.length)}>View all projects <ArrowRight size={15} /></button></div>
      <div class="explore-layout">
        <aside class="filters" aria-label="Project filters">
          <div class="filter-title"><span>Filter projects</span><Filter size={15} /></div>
          <label class="search-field"><Search size={16} /><input bind:value={query} oninput={() => (visibleCount = 9)} placeholder="Search projects" aria-label="Search projects" /></label>
          <div class="filter-group"><span class="filter-label">Category</span>{#each categories as item}<button class:selected={category === item} class="filter-option" type="button" onclick={() => { category = item; visibleCount = 9; }}>{item}<span>{item === 'All projects' ? projectItems.length : projectItems.filter((project) => project.category === item).length}</span></button>{/each}</div>
          <div class="quick-filters"><label>Status<select aria-label="Filter public projects by status" bind:value={status} onchange={() => (visibleCount = 9)}><option>Any status</option><option>Recruiting</option><option>Idea</option></select></label><label>Location<select aria-label="Filter public projects by location" bind:value={location} onchange={() => (visibleCount = 9)}><option>Any location</option><option>Remote</option><option>Hybrid</option><option>In person</option></select></label></div>
          <div class="filter-callout"><Sparkles size={17} /><div><strong>Not sure where to start?</strong><p>Tell us what you want to learn and we’ll help you find a fit.</p><button type="button">Get recommendations <ArrowRight size={13} /></button></div></div>
        </aside>

        <div class="project-results"><div class="results-toolbar"><span><strong>{visibleProjects.length}</strong> projects to explore <small class="data-source">{data.dataSource === 'mongodb' ? 'Live from MongoDB' : 'Demo data'}</small></span><button class="sort-button" type="button">Most relevant <ChevronDown size={15} /></button></div>{#if visibleProjects.length > 0}<div class="project-grid">{#each visibleProjects.slice(0, visibleCount) as project}<article class:featured={project.featured} class="project-card"><div class="project-card-top"><span class:idea={project.status === 'Idea'} class="status">{project.status}</span><button class:saved={saved.has(project.id)} class="icon-button" type="button" aria-label={saved.has(project.id) ? `Remove ${project.title} from saved projects` : `Save ${project.title}`} onclick={() => toggleSaved(project.id)}><Bookmark size={17} fill={saved.has(project.id) ? 'currentColor' : 'none'} /></button></div><div class="project-category">{project.category} <span>·</span> {project.department}</div><h3><a class="project-title-link" href={`/projects/${project.id}`}>{project.title}</a></h3><p>{project.summary}</p><div class="tag-list">{#each project.skills as skill}<span>{skill}</span>{/each}</div><div class="project-footer"><span><Clock3 size={14} /> {project.hoursPerWeek}</span><span><MapPin size={14} /> {project.location}</span></div><div class="card-bottom"><div class="creator"><span class="avatar">{project.initials}</span><span>Created by <strong>{project.creator}</strong></span></div></div></article>{/each}</div>{#if visibleProjects.length > visibleCount}<button class="more-projects" type="button" onclick={() => (visibleCount += 9)}>More projects <ArrowRight size={15} /></button>{/if}{:else}<div class="empty-state"><Compass size={24} /><h3>No projects match that search.</h3><p>Try another keyword or reset the category filter.</p><button class="button button-outline button-small" type="button" onclick={() => { query = ''; category = 'All projects'; visibleCount = 9; }}>Clear filters</button></div>{/if}</div>
      </div>
    </section>

    <section class="how-section" id="how-it-works"><div class="how-intro"><p class="eyebrow">A better way to get started</p><h2>Your idea is only the beginning.</h2><p>BuildTogether makes it easier to move from “someone should…” to “we built it.”</p></div><div class="steps"><div><span>01</span><h3>Discover</h3><p>Find projects that match your interests, skills, and time.</p></div><div><span>02</span><h3>Connect</h3><p>See the opportunity clearly, then apply for the role that fits.</p></div><div><span>03</span><h3>Build</h3><p>Work with students from across campus on something real.</p></div></div></section>
  </main>

  <footer class="footer"><div class="brand"><span class="brand-mark brand-image"><img src="/brand/handshake-emblem.png" alt="" /></span><span>Build<span>Together</span></span></div><span>Where student ideas become real projects.</span><span class="footer-right">BYU-Idaho student community · 2026</span></footer>
</div>
