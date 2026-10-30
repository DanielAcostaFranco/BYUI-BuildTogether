<script lang="ts">
  export let href = '/';
  export let compact = false;
</script>

<a class="brand" class:compact href={href} aria-label="BuildTogether home">
  <span class="brand-mark brand-image"><img src="/brand/handshake-emblem.png" alt="" /></span>
  <span>Build<span>Together</span></span>
</a>

<style>
  .brand { display: inline-flex; align-items: center; gap: 10px; color: #152c3e; text-decoration: none; font-size: 18px; font-weight: 750; letter-spacing: -.06em; white-space: nowrap; }
  .brand > span:last-child > span { color: #e36b43; }
  .brand-mark { width: 46px; height: 31px; display: grid; place-items: center; overflow: hidden; background: transparent; }
  .brand-mark img { width: 100%; height: 100%; object-fit: cover; }
  .brand.compact .brand-mark { width: 31px; height: 31px; border-radius: 10px; background: #153b56; }
  @media (max-width: 520px) { .brand { font-size: 17px; } .brand:not(.compact) .brand-mark { width: 40px; } }
</style>
