<script>
  import Icon from './Icon.svelte';
  import { app } from '../lib/store.svelte.js';
  import { streaks, dayRatio } from '../lib/logic.js';

  const cur = $derived(streaks(app.data, app.today).cur);
  const td = $derived(dayRatio(app.data, app.today));
  // Lit only while the streak is safe: today is complete, or nothing is due today.
  const lit = $derived(cur > 0 && (td.t === 0 || td.n === td.t));
  const tip = $derived(lit ? `Current streak: ${cur} ${cur === 1 ? 'day' : 'days'}` : cur > 0 ? `Streak of ${cur} ${cur === 1 ? 'day' : 'days'} is at risk: finish today's tasks to keep it` : 'No active streak');
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
</script>

<header class="top">
  <div class="logo" aria-hidden="true"><Icon name="calendar" size={22} stroke={2.1} /></div>
  <div class="brand">
    <b>Gigachad<span> Agenda</span></b>
    <small>Local-first routine calendar</small>
  </div>
  <div class="right">
    <div class="streak" class:off={!lit} role="img" aria-label={tip} title={tip}>
      <Icon name="flame" size={20} /><b class="mono">{cur}</b>
    </div>
    <button class="btn pbtn" type="button" aria-label="Open command palette" onclick={() => (app.palette = true)}>
      <Icon name="search" size={16} />
      <kbd>{mac ? '⌘ K' : 'Ctrl K'}</kbd>
    </button>
  </div>
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
  .right { margin-left: auto; display: flex; align-items: center; gap: var(--sp-3); }
  .streak { display: inline-flex; align-items: center; gap: var(--sp-1); min-height: 40px; padding: 0 var(--sp-3); border-radius: var(--r-sm); border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
  .streak b { font-weight: 600; font-size: 15px; }
  .streak :global(svg) { fill: color-mix(in srgb, currentColor 30%, transparent); transform-origin: 50% 90%; animation: flicker 2.8s ease-in-out infinite; }
  .streak.off { border-color: var(--line); background: var(--surface); color: var(--tx2); }
  .streak.off :global(svg) { animation: none; }
  @keyframes flicker { 0%, 100% { transform: scale(1) rotate(0); } 30% { transform: scale(1.07, 1.1) rotate(-3deg); } 60% { transform: scale(.97, 1.03) rotate(2deg); } }
  .pbtn { display: inline-flex; align-items: center; gap: var(--sp-2); }
  @media (max-width: 700px) { .brand small, .pbtn kbd { display: none; } .pbtn { width: 44px; padding: 0; justify-content: center; } .right { gap: var(--sp-2); } .streak { min-height: 44px; } }
</style>
