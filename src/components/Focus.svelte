<script>
  import { fade } from 'svelte/transition';
  import { app } from '../lib/store.svelte.js';
  import { modal } from '../lib/actions.js';
  import { dayLabel, fRem, fmtMMSS } from '../lib/logic.js';
  import { showFocus, closeFocus, toggleFocus, resetFocus, setFocusDuration, completeFocusTask, focusTaskExists, focusTaskDone } from '../lib/focus.svelte.js';

  const C = 552.92; // 2π · 88
  const f = $derived(app.focus);
  const rem = $derived(f ? fRem(f, app.now) : 0);
  const frac = $derived(f ? (f.status === 'done' ? 1 : rem / (f.dur * 60000)) : 0);
  const sub = $derived(!f ? '' : f.status === 'idle' ? `Ready. ${f.dur} minutes.` : f.status === 'running' ? 'Focus.' : f.status === 'paused' ? 'Paused.' : 'Session complete.');
  const go = $derived(!f ? '' : f.status === 'running' ? 'Pause' : f.status === 'paused' ? 'Resume' : f.status === 'done' ? 'Start again' : 'Start');
  const canComplete = $derived(!!f && f.status === 'done' && focusTaskExists() && !focusTaskDone());
  const showPill = $derived(!!f && !app.focusOpen && (f.status === 'running' || f.status === 'done'));
</script>

{#if app.focusOpen && f}
  <div class="fbd" transition:fade|global={{ duration: 140 }} role="presentation">
    <div class="fcard" role="dialog" aria-modal="true" aria-labelledby="ft" use:modal={{ initial: '.go' }}>
      <div class="fk">{dayLabel(f.k)}</div>
      <h2 id="ft">{f.title}</h2>
      <div class="ring">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle class="r0" cx="100" cy="100" r="88" />
          <circle class="r1 {f.status}" cx="100" cy="100" r="88" transform="rotate(-90 100 100)" style:stroke-dashoffset={C * (1 - frac)} />
        </svg>
        <div class="time" role="timer" aria-live="off">{fmtMMSS(rem)}</div>
      </div>
      <div class="sub" aria-live="polite">{sub}</div>
      <div class="dur" role="group" aria-label="Duration">
        {#each [5, 15, 25, 45] as m}<button type="button" aria-pressed={f.dur === m} onclick={() => setFocusDuration(m)}>{m} min</button>{/each}
      </div>
      <div class="bt">
        <button type="button" class="btn pri go" onclick={toggleFocus}>{go}</button>
        <button type="button" class="btn" onclick={resetFocus}>Reset</button>
      </div>
      {#if canComplete}<button type="button" class="btn" onclick={completeFocusTask}>Mark complete</button>{/if}
      <button type="button" class="btn" onclick={closeFocus}>Back to schedule</button>
    </div>
  </div>
{/if}

{#if showPill}
  <button type="button" class="fpill mono" class:raise={!!app.day} onclick={showFocus}
    aria-label={f.status === 'done' ? 'Focus session complete. Open timer.' : `Focus session running, ${fmtMMSS(rem)} left. Open timer.`}>
    {f.status === 'done' ? 'Focus done' : fmtMMSS(rem)}
  </button>
{/if}

<style>
  .fbd { position: fixed; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; padding: var(--sp-4); background: var(--scrim); }
  .fcard { width: 100%; max-width: 420px; max-height: calc(100dvh - 32px); overflow: auto; padding: var(--sp-5); border-radius: var(--r-xl); border: 1px solid var(--line-2); background: var(--panel-strong); box-shadow: var(--shadow); display: grid; gap: var(--sp-3); justify-items: center; text-align: center; animation: up .35s var(--ease); }
  @keyframes up { from { opacity: 0; transform: translateY(14px) scale(.98); } }
  .fk { font: 12px var(--font-mono); letter-spacing: .08em; text-transform: uppercase; color: var(--tx2); }
  h2 { font-size: 22px; overflow-wrap: anywhere; }
  .ring { position: relative; width: 210px; height: 210px; }
  .ring svg { width: 100%; height: 100%; }
  .r0 { fill: none; stroke: var(--surface-3); stroke-width: 9; }
  .r1 { fill: none; stroke: var(--tx); stroke-width: 9; stroke-linecap: round; stroke-dasharray: 552.92; transition: stroke-dashoffset .25s linear, stroke .3s; }
  .r1.paused { stroke: var(--warn); } .r1.done { stroke: var(--good); } .r1.running { stroke: var(--accent); }
  .time { position: absolute; inset: 0; display: grid; place-items: center; font: 500 42px var(--font-mono); font-variant-numeric: tabular-nums; letter-spacing: -.03em; }
  .sub { font-size: 14px; color: var(--tx2); min-height: 21px; }
  .dur, .bt { display: flex; gap: var(--sp-2); flex-wrap: wrap; justify-content: center; }
  .dur button { min-height: 40px; padding: 0 var(--sp-3); border-radius: 99px; border: 1px solid var(--line-ctl); background: none; font: 500 13px var(--font-mono); }
  .dur button[aria-pressed='true'] { background: var(--surface-3); border-color: var(--tx); }
  .fpill { position: fixed; right: calc(var(--sp-4) + env(safe-area-inset-right, 0px)); bottom: calc(var(--sp-4) + var(--nav-h)); z-index: 35; min-height: 44px; padding: 0 var(--sp-4); border-radius: 99px; border: 1px solid var(--line-2); background: var(--panel-strong); box-shadow: var(--shadow); font-weight: 600; animation: up .3s var(--ease); }
  @media (max-width: 700px) { .fpill.raise { bottom: calc(var(--sp-6) * 2 + env(safe-area-inset-bottom, 0px)); } .dur button { min-height: 44px; } }
</style>
