<script lang="ts">
  import { ArrowLeft, ArrowRight, Check, LockKeyhole } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { dev } from '$app/environment';
  import { page } from '$app/stores';
  import { loginSchema } from '$lib/schemas';

  const demoAccounts = [
    ['John Doe', 'demo-student-001@example.invalid'],
    ['Sofia Martinez', 'demo-student-002@example.invalid'],
    ['Maya Patel', 'demo-student-003@example.invalid'],
    ['Liam Chen', 'demo-student-004@example.invalid']
  ];

  let email = '';
  let code = '';
  let codeRequested = false;
  let developmentCode = '';
  let pending = false;
  let error = '';

  onMount(() => document.querySelector('.auth-page')?.setAttribute('data-app-ready', 'true'));

  async function requestCode() {
    const result = loginSchema.safeParse({ email });
    if (!result.success) {
      error = result.error.issues[0]?.message ?? 'Enter a valid email address.';
      return;
    }

    pending = true;
    error = '';
    try {
      const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? 'We could not send your code.');
      codeRequested = true;
      developmentCode = payload.developmentCode ?? '';
    } catch (requestError) {
      error = requestError instanceof Error ? requestError.message : 'We could not send your code.';
    } finally {
      pending = false;
    }
  }

  async function verifyCode() {
    const result = loginSchema.safeParse({ email });
    if (!result.success || !/^\d{6}$/.test(code.trim())) {
      error = 'Enter the six-digit code from your email.';
      return;
    }

    pending = true;
    error = '';
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? 'That code is not correct.');
      const requestedNext = $page.url.searchParams.get('next');
      const safeNext = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !requestedNext.includes('\\') ? requestedNext : '/home';
      window.location.href = safeNext;
    } catch (verificationError) {
      error = verificationError instanceof Error ? verificationError.message : 'That code is not correct.';
    } finally {
      pending = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in — BuildTogether</title>
  <meta name="description" content="Sign in to BuildTogether, the student project hub." />
</svelte:head>

<div class="auth-page">
  <header class="auth-header">
    <a class="brand auth-brand" href="/" aria-label="BuildTogether home"><span class="brand-mark brand-image"><img src="/brand/handshake-emblem.png" alt="" /></span><span>Build<span>Together</span></span></a>
  </header>

  <main class="auth-layout">
    <section class="auth-intro">
      <h1>Bring your next idea to life.</h1>
      <p>Sign in to discover projects, connect with collaborators, and keep your work moving forward.</p>
      <div class="auth-promise"><span><Check size={14} /></span><div><strong>Built for students</strong><small>Everyone here is building something.</small></div></div>
      <div class="auth-promise"><span><Check size={14} /></span><div><strong>Email sign-in</strong><small>Use a code to access your account.</small></div></div>
    </section>

    <section class="auth-card" aria-labelledby="login-title">
      <div class="auth-card-icon"><LockKeyhole size={20} /></div>
      {#if codeRequested}
        <div class="auth-success"><span><Check size={21} /></span><p class="eyebrow">Check your inbox</p><h2>Enter your code.</h2><p>We sent a six-digit code to <strong>{email}</strong>. It expires in 10 minutes.</p>
          {#if developmentCode}<p class="dev-code" role="status">Development code: <strong>{developmentCode}</strong></p>{/if}
          <form onsubmit={(event) => { event.preventDefault(); verifyCode(); }} novalidate>
            <label for="code">Verification code<input id="code" bind:value={code} inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" aria-invalid={error.length > 0} /></label>
            {#if error}<p class="form-error" role="alert">{error}</p>{/if}
            <button class="button button-dark button-full" type="submit" disabled={pending}>{pending ? 'Verifying…' : 'Verify and sign in'} <ArrowRight size={15} /></button>
          </form>
          <button class="text-link auth-change" type="button" onclick={() => { codeRequested = false; code = ''; error = ''; }}>Use a different email</button>
        </div>
      {:else}
        <h2 id="login-title">Sign in to BuildTogether.</h2><p class="auth-copy">Use your email to continue. We will send you a six-digit sign-in code.</p>
        <form onsubmit={(event) => { event.preventDefault(); requestCode(); }} novalidate>
          <label for="email">Email address<input id="email" bind:value={email} type="email" autocomplete="email" placeholder="you@byui.edu" aria-invalid={error.length > 0} /></label>
          {#if dev}<label for="demo-account">Try a demo project owner<select id="demo-account" value="" onchange={(event) => { if (event.currentTarget.value) email = event.currentTarget.value; error = ''; }}><option value="">Choose a fictional student</option>{#each demoAccounts as [name, address]}<option value={address}>{name}</option>{/each}</select></label><p class="demo-note">Development only. Choose a demo student, then use the code shown on this page. Sign out to switch accounts.</p>{/if}
          {#if error}<p class="form-error" role="alert">{error}</p>{/if}
          <button class="button button-dark button-full" type="submit" disabled={pending}>{pending ? 'Sending code…' : 'Send me a code'} <ArrowRight size={15} /></button>
        </form>
        <p class="auth-footnote">By continuing, you agree to BuildTogether’s community guidelines and Terms & Conditions.</p>
      {/if}
    </section>
  </main>
</div>

<style>
  .auth-page { min-height:100vh; background:#f6fbff; color:#000; font-family:var(--byui-body); }
  .auth-header { height:78px; display:flex; align-items:center; justify-content:space-between; padding:0 clamp(20px,6vw,80px); background:#fff; border-bottom:1px solid rgba(148,149,152,.3); }
  .auth-brand { text-decoration:none; }.auth-brand .brand-image { width:46px; height:31px; }.auth-brand > span:last-child > span { color:var(--byui-blue); }
  .back-link { display:flex; align-items:center; gap:7px; color:var(--byui-deep-blue); font:700 12px var(--byui-display); text-decoration:none; }
  .auth-layout { max-width:1120px; margin:auto; min-height:calc(100vh - 78px); padding:70px clamp(20px,7vw,96px); display:grid; grid-template-columns:1fr 430px; align-items:center; gap:80px; }
  .auth-intro { max-width:530px; }.auth-intro h1 { font:700 clamp(45px,6vw,72px)/.95 var(--byui-display); letter-spacing:-.06em; margin:0 0 22px; }.auth-intro > p:not(.eyebrow) { color:#414141; font-size:16px; line-height:1.6; max-width:430px; }
  .auth-promise { display:flex; align-items:flex-start; gap:11px; margin-top:25px; }.auth-promise > span { width:25px; height:25px; display:grid; place-items:center; border-radius:50%; color:#fff; background:var(--byui-blue); }.auth-promise strong,.auth-promise small { display:block; }.auth-promise strong { font:700 12px var(--byui-display); color:var(--byui-deep-blue); }.auth-promise small { color:#6b7478; font-size:11px; margin-top:3px; }
  .auth-card { background:#fff; border:1px solid rgba(148,149,152,.35); border-radius:12px; padding:34px; box-shadow:0 22px 55px rgba(33,68,145,.1); }.auth-card-icon { width:42px; height:42px; display:grid; place-items:center; background:var(--byui-light-blue); color:var(--byui-deep-blue); border-radius:9px; margin-bottom:25px; }.auth-card h2 { color:#000; font:700 31px/1 var(--byui-display); letter-spacing:-.04em; margin:0 0 13px; }.auth-copy { color:#687579; font-size:12px; line-height:1.6; margin:0 0 22px; }.auth-card form { display:grid; gap:14px; }.auth-card label { display:grid; gap:7px; color:var(--byui-deep-blue); font:700 11px var(--byui-display); }.auth-card input { border:1px solid #c9d8df; border-radius:6px; padding:12px; outline:0; color:#000; font:14px var(--byui-body); }.auth-card input:focus { border-color:var(--byui-blue); box-shadow:0 0 0 3px rgba(0,110,182,.14); }.form-error { color:#a32626; font:11px var(--byui-display); margin:0; }.auth-footnote { color:#879296; font-size:10px; line-height:1.5; margin:17px 0 0; }.auth-success { text-align:center; }.auth-success > span { width:43px; height:43px; display:grid; place-items:center; margin:0 auto 20px; border-radius:50%; color:#fff; background:var(--byui-blue); }.auth-success h2 { margin-bottom:11px; }.auth-success p:not(.eyebrow) { color:#687579; font-size:12px; line-height:1.6; margin-bottom:22px; }.dev-code { color:var(--byui-deep-blue) !important; background:var(--byui-light-blue); padding:10px; border-radius:6px; }.auth-change { margin:18px auto 0; border:0; background:transparent; cursor:pointer; }
  .auth-card select { border:1px solid #c9d8df; border-radius:6px; padding:12px; color:#000; background:#fff; font:14px var(--byui-body); }
  .auth-card select:focus { border-color:var(--byui-blue); box-shadow:0 0 0 3px rgba(0,110,182,.14); }
  .demo-note { color:#687579; font-size:11px; line-height:1.5; margin:0; }
  @media(max-width:780px){.auth-layout{grid-template-columns:1fr;gap:35px;padding-top:50px}.auth-intro h1{font-size:52px}.auth-card{max-width:500px;width:100%}}
</style>
