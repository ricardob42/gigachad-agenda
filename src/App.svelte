<script>
  import Header from './components/Header.svelte';
  import Tabs from './components/Tabs.svelte';
  import MonthView from './components/MonthView.svelte';
  import WeekView from './components/WeekView.svelte';
  import RoutinesView from './components/RoutinesView.svelte';
  import LookView from './components/LookView.svelte';
  import BackupView from './components/BackupView.svelte';
  import StatsView from './components/StatsView.svelte';
  import DayModal from './components/DayModal.svelte';
  import Focus from './components/Focus.svelte';
  import CommandPalette from './components/CommandPalette.svelte';
  import ConfirmDialog from './components/ConfirmDialog.svelte';
  import Toasts from './components/Toasts.svelte';
  import { app, closeTop, stepNav, thisMonth, thisWeek } from './lib/store.svelte.js';
  import { THEMES, swipeDir } from './lib/logic.js';

  const bgUrl = $derived(app.bg[app.vw <= 700 ? 'mobile' : 'desktop']);
  const overlay = $derived(!!(app.day || app.palette || app.focusOpen || app.confirm));

  $effect(() => {
    const t = THEMES.find((x) => x.id === app.prefs.theme) || THEMES[0];
    document.documentElement.dataset.theme = t.id;
    document.documentElement.style.setProperty('--bg-image-opacity', String(app.prefs.dim / 100));
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.color);
  });
  $effect(() => { document.body.style.overflow = overlay ? 'hidden' : ''; });

  const typing = (t) => !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);

  function onkeydown(e) {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key && e.key.toLowerCase() === 'k') { e.preventDefault(); app.palette = !app.palette; return; }
    if (e.key === 'Escape') { if (closeTop()) e.preventDefault(); return; }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !typing(e.target) && !overlay) { e.preventDefault(); app.palette = true; return; }
    if (overlay || (app.tab !== 'calendar' && app.tab !== 'week') || e.target.closest?.('.grid') || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowLeft') stepNav(-1);
    else if (e.key === 'ArrowRight') stepNav(1);
    else if (e.key === 't' || e.key === 'T') (app.tab === 'week' ? thisWeek : thisMonth)();
  }

  let sx = 0, sy = 0, swiping = false;
  function touchstart(e) {
    swiping = e.touches.length === 1 && !(e.target.closest && e.target.closest('input,textarea'));
    if (swiping) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
  }
  function touchend(e) {
    if (!swiping) return;
    swiping = false;
    const t = e.changedTouches[0];
    if (!t || overlay || (app.tab !== 'calendar' && app.tab !== 'week')) return;
    const d = swipeDir(t.clientX - sx, t.clientY - sy);
    if (d) stepNav(d);
  }
</script>

<svelte:window bind:innerWidth={app.vw} {onkeydown} ontouchstart={touchstart} ontouchend={touchend} />

<div class="bgimg" class:on={!!bgUrl} style:background-image={bgUrl ? `url("${bgUrl}")` : null} aria-hidden="true"></div>
<div class="bgvig" aria-hidden="true"></div>

<div class="app">
  <Header />
  <Tabs />
  <main>
    {#if app.tab === 'calendar'}<MonthView />
    {:else if app.tab === 'week'}<WeekView />
    {:else if app.tab === 'routines'}<RoutinesView />
    {:else if app.tab === 'look'}<LookView />
    {:else if app.tab === 'backup'}<BackupView />
    {:else if app.tab === 'stats'}<StatsView />
    {/if}
  </main>
  <footer class="foot"><span>Gigachad Agenda</span><span class="mid"> • local-first · offline-ready</span><span> • v21</span></footer>
</div>

{#if app.day}{#key app.day}<DayModal />{/key}{/if}
<Focus />
{#if app.palette}<CommandPalette />{/if}
{#if app.confirm}<ConfirmDialog />{/if}
<Toasts />

<style>
  .bgimg { position: fixed; inset: 0; z-index: -1; background-size: cover; background-position: center; opacity: 0; transition: opacity .4s; pointer-events: none; }
  .bgimg.on { opacity: var(--bg-image-opacity); }
  .bgvig { position: fixed; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(ellipse at 50% 30%, transparent 0, var(--vig) 100%); }
  .foot { margin-top: var(--sp-6); text-align: center; font: 11.5px var(--font-mono); letter-spacing: .04em; color: var(--tx2); }
  @media (max-width: 700px) { .mid { display: none; } }
</style>
