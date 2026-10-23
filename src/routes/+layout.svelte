<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Bell, LogOut } from '@lucide/svelte';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
  let unreadNotifications = data.unreadNotifications;
  $: if (data.unreadNotifications !== undefined) unreadNotifications = data.unreadNotifications;

  onMount(() => {
    if (!data.signedIn) return;
    async function refreshUnread() {
      try {
        const response = await fetch('/api/notifications/unread-count');
        if (!response.ok) return;
        const payload = await response.json();
        unreadNotifications = payload.unread;
      } catch { /* Keep the last known count while offline. */ }
    }
    const timer = window.setInterval(refreshUnread, 20_000);
    return () => window.clearInterval(timer);
  });
</script>

{#key $page.url.pathname}
  <div class="route-content"><slot /></div>
{/key}

{#if data.signedIn}
  <a class="notification-dock" href="/notifications" aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}><Bell size={18} strokeWidth={2} /><span>Notifications</span>{#if unreadNotifications > 0}<strong>{unreadNotifications > 99 ? '99+' : unreadNotifications}</strong>{/if}</a>
  <form class="session-dock" method="POST" action="/api/auth/sign-out">
    <button type="submit" aria-label="Sign out"><LogOut size={17} strokeWidth={2} /><span>Sign out</span></button>
  </form>
{/if}
