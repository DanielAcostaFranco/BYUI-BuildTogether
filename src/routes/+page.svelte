<script lang="ts">
  import { ArrowRight } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { filterDashboardProjects, type Project } from '$lib/types';
  import Brand from '$lib/components/Brand.svelte';
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
    <Brand compact />

    <div class="top-actions">
      <a class="sign-in" href="/login">Sign in</a>
      <a class="button button-dark button-small" href="/projects/new">Start a project <ArrowRight size={15} /></a>
    </div>
  </header>

  <main>
    <section class="hero" id="about">
      <div class="hero-copy">
        <h1>Build<em>Together</em> something that matters.</h1>
        <p class="hero-lede">Find collaborators, practice the skills you care about, and leave college with proof of what you can build.</p>
        <div class="hero-actions">
          <a class="button button-dark" href="#projects">Explore projects <ArrowRight size={16} /></a>
          <a class="text-link" href="#how-it-works">See how it works <ArrowRight size={15} /></a>
        </div>
        <div class="hero-proof"><span class="proof-avatars"><i>AM</i><i>SW</i><i>NL</i><i>+ </i></span><span><strong>{data.registeredUserCount} registered users</strong> are building together</span></div>
      </div>
      <div class="hero-art" aria-label="BuildTogether emblem">
        <img class="hero-logo" src="/brand/handshake-emblem.png" alt="BuildTogether handshake emblem" />
      </div>
    </section>


    <section class="how-section" id="how-it-works"><div class="how-intro"><h2>Your idea is only the beginning.</h2><p>BuildTogether makes it easier to move from “someone should…” to “we built it.”</p></div><div class="steps"><div><span>01</span><h3>Discover</h3><p>Find projects that match your interests, skills, and time.</p></div><div><span>02</span><h3>Connect</h3><p>See the opportunity clearly, then apply for the role that fits.</p></div><div><span>03</span><h3>Build</h3><p>Work with students from across campus on something real.</p></div></div></section>
  </main>

</div>
