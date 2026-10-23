<script lang="ts">
  import { ArrowLeft, ArrowUpRight, Bell, CheckCheck } from '@lucide/svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  export let data: PageData;
  let busy = false;

  async function markRead(id: string) {
    const response = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
    if (response.ok) await invalidateAll();
  }

  async function openNotification(id: string, projectId: string | undefined) {
    if (!projectId) return;
    await markRead(id);
    await goto(`/projects/${projectId}`);
  }

  async function markAllRead() {
    busy = true;
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (response.ok) await invalidateAll();
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Notifications — BuildTogether</title></svelte:head>

<main class="notifications-page">
  <a class="back" href="/home"><ArrowLeft size={16} /> Back to home</a>
  <div class="heading"><div><p class="eyebrow">Your activity</p><h1>Notifications.</h1><p>Requests and updates from your projects, all in one place.</p></div>{#if data.notifications.some((item) => !item.read)}<button class="mark-all" type="button" onclick={markAllRead} disabled={busy}><CheckCheck size={16} /> Mark all as read</button>{/if}</div>
  {#if data.notifications.length > 0}
    <div class="notification-list">{#each data.notifications as notification}<article class:unread={!notification.read} class="notification"><span class="icon"><Bell size={17} /></span><div class="notification-body"><div class="title-row"><h2>{notification.title}</h2>{#if !notification.read}<span class="unread-label">New</span>{/if}</div><p>{notification.message}</p><small>{new Date(notification.createdAt).toLocaleString()}</small></div><div class="actions">{#if notification.projectId}<button type="button" onclick={() => openNotification(notification.id, notification.projectId)}>Open project <ArrowUpRight size={14} /></button>{/if}{#if !notification.read}<button type="button" class="text-button" onclick={() => markRead(notification.id)}>Mark read</button>{/if}</div></article>{/each}</div>
  {:else}
    <section class="empty"><Bell size={23} /><h2>All caught up.</h2><p>When someone asks to join your project, you will see it here.</p></section>
  {/if}
</main>

<style>
  .notifications-page{min-height:100vh;background:#f6fbff;padding:50px clamp(20px,6vw,80px) 100px;color:var(--byui-deep-blue);font-family:var(--byui-body)}
  .notifications-page>*{max-width:960px;margin-left:auto;margin-right:auto}.back{display:flex;align-items:center;gap:6px;color:var(--byui-blue);font:700 12px var(--byui-display);text-decoration:none}.heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-top:42px;margin-bottom:25px}.eyebrow{color:var(--byui-blue);font:800 10px var(--byui-display);text-transform:uppercase;letter-spacing:.14em}.heading h1{margin:0;color:#000;font:700 clamp(38px,6vw,66px)/1 var(--byui-display);letter-spacing:-.05em}.heading p:last-child{color:#64777d;font-size:14px}.mark-all{display:inline-flex;align-items:center;gap:7px;border:1px solid #cbdde9;border-radius:7px;background:#fff;color:var(--byui-deep-blue);padding:10px 13px;font:700 12px var(--byui-display);cursor:pointer}.notification-list{display:grid;gap:10px}.notification{display:flex;align-items:flex-start;gap:14px;background:#fff;border:1px solid #dce7e9;border-radius:10px;padding:20px}.notification.unread{border-color:#acd1e8;background:#fafdff}.icon{width:36px;height:36px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--byui-light-blue);color:var(--byui-blue)}.notification-body{flex:1}.title-row{display:flex;align-items:center;gap:9px}.notification h2{font:700 17px var(--byui-display);margin:0}.unread-label{border-radius:20px;background:var(--byui-blue);color:#fff;padding:3px 7px;font:800 9px var(--byui-display)}.notification p{margin:7px 0;color:#53656b;font-size:13px;line-height:1.5}.notification small{color:#829197;font-size:10px}.actions{display:flex;align-items:flex-end;flex-direction:column;gap:8px}.actions button{display:inline-flex;align-items:center;gap:4px;background:none;border:0;color:var(--byui-blue);font:700 11px var(--byui-display);cursor:pointer;white-space:nowrap}.actions .text-button{color:#64777d}.empty{padding:70px 20px;text-align:center;background:#fff;border:1px dashed #cbdde9;border-radius:10px}.empty :global(svg){color:var(--byui-blue)}.empty h2{font:700 24px var(--byui-display);margin:10px 0}.empty p{color:#64777d;font-size:13px}@media(max-width:650px){.heading{align-items:flex-start;flex-direction:column}.notification{flex-wrap:wrap}.actions{width:100%;align-items:flex-start;flex-direction:row;margin-left:50px}}
</style>
