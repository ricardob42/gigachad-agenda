<script>
  import Icon from './Icon.svelte';
  import { app, setTab, backupDue } from '../lib/store.svelte.js';

  const TABS = [['calendar', 'Calendar'], ['week', 'Week'], ['routines', 'Routines'], ['look', 'Look'], ['backup', 'Backup'], ['stats', 'Stats']];
  const due = $derived(backupDue());

  function onkeydown(e) {
    const btns = [...e.currentTarget.querySelectorAll('[role=tab]')], i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    const n = e.key === 'ArrowRight' ? (i + 1) % btns.length : e.key === 'ArrowLeft' ? (i - 1 + btns.length) % btns.length : e.key === 'Home' ? 0 : e.key === 'End' ? btns.length - 1 : -1;
    if (n < 0) return;
    e.preventDefault();
    btns[n].focus();
    btns[n].click();
  }
</script>

<nav class="tabs" role="tablist" aria-label="Views" {onkeydown}>
  {#each TABS as [id, label]}
    <button type="button" class="tab" role="tab" id="t-{id}" aria-controls="view-{id}" aria-selected={app.tab === id} tabindex={app.tab === id ? 0 : -1} onclick={() => setTab(id)}>
      <Icon name={id} size={20} />
      <span>{label}</span>
      {#if id === 'backup' && due}<i class="dot" aria-hidden="true"></i><span class="sr">, backup due</span>{/if}
    </button>
  {/each}
</nav>

<style>
  .tabs { display: flex; gap: var(--sp-1); margin-top: var(--sp-3); padding: var(--sp-1); width: max-content; max-width: 100%; border-radius: var(--r-md); border: 1px solid var(--line); background: var(--panel); }
  .tab { position: relative; min-height: 40px; padding: 0 var(--sp-4); border: 0; border-radius: var(--r-sm); background: none; font-weight: 500; font-size: 14px; color: var(--tx2); display: inline-flex; align-items: center; gap: var(--sp-2); transition: color .2s, background .2s; }
  .tab :global(svg) { display: none; }
  .tab:hover { color: var(--tx); }
  .tab[aria-selected='true'] { background: var(--surface-3); color: var(--tx); }
  .tab::after { content: ''; position: absolute; left: 22%; right: 22%; bottom: 3px; height: 2px; border-radius: 2px; background: var(--accent); transform: scaleX(0); transition: transform .3s var(--ease); }
  .tab[aria-selected='true']::after { transform: scaleX(1); }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--warn); }

  @media (max-width: 700px) {
    .tabs {
      position: fixed; z-index: 15; left: var(--sp-3); right: var(--sp-3); width: auto; margin: 0; justify-content: space-between;
      bottom: calc(var(--sp-2) + env(safe-area-inset-bottom, 0px)); padding: var(--sp-1);
      border-radius: var(--r-lg); background: var(--panel-strong); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);
      box-shadow: var(--shadow);
    }
    .tab { flex: 1; min-width: 0; min-height: 52px; padding: 0; flex-direction: column; justify-content: center; gap: 2px; font-size: 11px; }
    .tab :global(svg) { display: block; }
    .tab::after { left: 36%; right: 36%; bottom: 2px; }
    .dot { position: absolute; top: 8px; right: 22%; }
  }
</style>
