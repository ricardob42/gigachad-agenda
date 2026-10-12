<script>
  import Icon from './Icon.svelte';
  import { app } from '../lib/store.svelte.js';

  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
</script>

<header class="top">
  <div class="logo" aria-hidden="true"><Icon name="calendar" size={22} stroke={2.1} /></div>
  <div class="brand">
    <b>Gigachad<span> Agenda</span></b>
    <small>Local-first routine calendar</small>
  </div>
  <button class="btn pbtn" type="button" aria-label="Open command palette" onclick={() => (app.palette = true)}>
    <Icon name="search" size={16} />
    <kbd>{mac ? '⌘ K' : 'Ctrl K'}</kbd>
  </button>
</header>

<style>
  .top {
    position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5;
    display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-3) 0;
    background: linear-gradient(color-mix(in srgb, var(--bg) 88%, transparent), color-mix(in srgb, var(--bg) 55%, transparent));
    backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);
    border-bottom: 1px solid var(--line);
  }
  .logo {
    width: 40px; height: 40px; border-radius: 13px; display: grid; place-items: center;
    background: var(--accent); color: var(--on-accent);
    box-shadow: 0 6px 20px -6px var(--accent);
  }
  .brand b { display: block; font: 700 21px/1.05 var(--font-display); letter-spacing: -.02em; }
  .brand b span { font: 300 12px var(--font-body); letter-spacing: .24em; text-transform: uppercase; color: var(--tx2); margin-left: 2px; }
  .brand small { font-size: 12px; color: var(--tx2); }
  .pbtn { margin-left: auto; display: inline-flex; align-items: center; gap: var(--sp-2); }
  @media (max-width: 700px) { .brand small, .pbtn kbd { display: none; } .pbtn { width: 44px; padding: 0; justify-content: center; } }
</style>
