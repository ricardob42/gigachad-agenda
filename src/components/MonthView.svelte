<script>
  import { tick } from 'svelte';
  import Icon from './Icon.svelte';
  import { app, shiftMonth, thisMonth, openDay } from '../lib/store.svelte.js';
  import { MON, MS, DW, key, addD, dayStat, dayRatio, clampYear } from '../lib/logic.js';

  const DOW = DW.map((d) => d.slice(0, 3));
  const y = $derived(app.month.getFullYear());
  const m = $derived(app.month.getMonth());
  const notCurrent = $derived(y !== app.today.getFullYear() || m !== app.today.getMonth());

  const cells = $derived.by(() => {
    const first = new Date(y, m, 1), start = addD(first, -first.getDay());
    const days = Array.from({ length: 44 }, (_, i) => addD(start, i - 1)); // one extra day each side for streak runs
    const full = days.map((d) => { const r = dayRatio(app.data, d); return r.t > 0 && r.n === r.t; });
    return Array.from({ length: 42 }, (_, i) => {
      const d = days[i + 1], k = key(d), st = dayStat(app.data, d), T = st.t.length, A = st.active;
      const rest = !A && st.ex > 0;
      const status = !T ? 'no tasks' : rest ? 'rest day' : `${st.n} of ${A} done${st.ex ? `, ${st.ex} excused` : ''}`;
      const label = `${DW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} — ${status}${app.data.notes[k] ? ', has note' : ''}`;
      return { d, k, st, T, A, rest, label, inM: d.getMonth() === m, isT: +d === +app.today, full: full[i + 1], run: full[i + 1] && (full[i] || full[i + 2]) };
    });
  });
  const defIdx = $derived.by(() => {
    const t = cells.findIndex((c) => c.isT && c.inM);
    return t >= 0 ? t : cells.findIndex((c) => c.inM);
  });
  let focusIdx = $state(null);
  const tabIdx = $derived(focusIdx ?? defIdx);
  $effect(() => { app.month; focusIdx = null; });

  function gridKey(e) {
    const b = e.target.closest('.cell');
    if (!b) return;
    const i = +b.dataset.i;
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'ArrowDown' ? i + 7 : e.key === 'ArrowUp' ? i - 7 : e.key === 'Home' ? i - (i % 7) : e.key === 'End' ? i - (i % 7) + 6 : -1;
    if (n < 0) return;
    e.preventDefault();
    const g = e.currentTarget;
    if (n >= 0 && n < 42) { focusIdx = n; tick().then(() => g.querySelectorAll('.cell')[n]?.focus()); }
  }

  /* month picker */
  let yr = $state(0), wrap, headBtn, wasOpen = false, skipFocus = false;
  function toggle() {
    if (app.monthPop) { app.monthPop = false; return; }
    yr = y; app.monthPop = true;
    tick().then(() => wrap?.querySelector('.mg [aria-pressed=true]')?.focus());
  }
  function pick(i) { app.month = new Date(yr, i, 1); app.monthPop = false; }
  $effect(() => {
    if (!app.monthPop && wasOpen && !skipFocus) headBtn?.focus();
    skipFocus = false;
    wasOpen = app.monthPop;
  });
  function outside(e) { if (app.monthPop && wrap && !wrap.contains(e.target)) { skipFocus = true; app.monthPop = false; } }
</script>

<svelte:window onmousedown={outside} />

<section class="view" id="view-calendar" role="tabpanel" aria-labelledby="t-calendar">
  <div class="bar">
    <div class="wrap" bind:this={wrap}>
      <h1 aria-live="polite">
        <button class="mhb" type="button" bind:this={headBtn} aria-haspopup="dialog" aria-expanded={app.monthPop} onclick={toggle}>
          {MON[m]} <small>{y}</small><Icon name="down" size={18} />
        </button>
      </h1>
      {#if app.monthPop}
        <div class="pop" role="dialog" aria-label="Choose month">
          <div class="ys">
            <button type="button" class="pi" aria-label="Previous year" disabled={yr <= 1900} onclick={() => (yr = clampYear(yr - 1))}><Icon name="left" size={16} /></button>
            <span class="mono" aria-live="polite">{yr}</span>
            <button type="button" class="pi" aria-label="Next year" disabled={yr >= 2100} onclick={() => (yr = clampYear(yr + 1))}><Icon name="right" size={16} /></button>
          </div>
          <div class="mg">
            {#each MS as n, i}
              <button type="button" class="pi" aria-pressed={yr === y && i === m} onclick={() => pick(i)}>{n}</button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
    {#if notCurrent}<span class="chip">Not the current month</span>{/if}
    <div class="nav">
      <button type="button" class="btn icon" aria-label="Previous month" onclick={() => shiftMonth(-1)}><Icon name="left" size={18} /></button>
      <button type="button" class="btn" onclick={thisMonth}>Today</button>
      <button type="button" class="btn icon" aria-label="Next month" onclick={() => shiftMonth(1)}><Icon name="right" size={18} /></button>
    </div>
  </div>

  <div class="dow" aria-hidden="true">{#each DOW as n}<span>{n}</span>{/each}</div>

  {#key app.month.getTime()}
    <div class="grid enter" role="grid" aria-label="Month calendar" onkeydown={gridKey}>
      {#each cells as c, i (c.k)}
        <button
          type="button" class="cell" class:out={!c.inM} class:today={c.isT} class:full={c.full} class:rest={c.rest} class:run={c.run}
          data-i={i} data-k={c.k} style:--i={i} style:--p={c.A ? c.st.n / c.A : 0}
          aria-label={c.label} tabindex={i === tabIdx ? 0 : -1} onclick={() => openDay(c.k)}
        >
          {#if c.st.n > 0}<span class="fill"></span>{/if}
          <span class="d"><span class="n">{c.d.getDate()}</span>{#if app.data.notes[c.k]}<i class="pen" title="Has note"></i>{/if}</span>
          {#each c.st.t.slice(0, 3) as x (x.id)}
            <span class="pill {x.acc ? 'a-' + x.acc : x.tag ? 'tg-' + x.tag : ''}" class:done={x.state === 'done'} class:ex={x.state === 'excused'}>
              <i>{x.time}</i><em>{x.title}</em>
            </span>
          {/each}
          {#if c.T > 3}<span class="more">+{c.T - 3} more</span>{/if}
          {#if c.T}<span class="badge">{c.rest ? 'rest' : `${c.st.n}/${c.A}`}</span>{/if}
        </button>
      {/each}
    </div>
  {/key}

  <p class="key">
    <i class="sw"></i> Fill shows the share of the day's tasks done. A run of full cells is a streak. Striped days are rest days: they neither count nor break a streak.
    <span class="hint"><kbd>←</kbd> <kbd>→</kbd> months · <kbd>T</kbd> today · <kbd>Ctrl K</kbd> commands</span>
  </p>
</section>

<style>
  .bar { display: flex; align-items: center; gap: var(--sp-3); margin: var(--sp-5) 0 var(--sp-4); flex-wrap: wrap; }
  .wrap { position: relative; }
  h1 { font-size: clamp(30px, 5vw, 46px); line-height: 1.05; font-weight: 600; font-variation-settings: 'opsz' 72; }
  .mhb { display: inline-flex; align-items: baseline; gap: var(--sp-2); border: 0; background: none; padding: 0 var(--sp-1); border-radius: var(--r-sm); font: inherit; letter-spacing: inherit; }
  .mhb small { font-weight: 300; color: var(--tx2); font-size: inherit; }
  .mhb :global(svg) { align-self: center; color: var(--tx2); transition: transform .25s var(--ease); }
  .mhb[aria-expanded='true'] :global(svg) { transform: rotate(180deg); }
  .nav { margin-left: auto; display: flex; gap: var(--sp-2); }

  .pop { position: absolute; z-index: 10; top: calc(100% + 8px); left: 0; min-width: 240px; padding: var(--sp-3); border-radius: var(--r-md); border: 1px solid var(--line-2); background: var(--panel-strong); box-shadow: var(--shadow); animation: dd .2s var(--ease); }
  @keyframes dd { from { opacity: 0; transform: translateY(-6px) scale(.98); } }
  .ys { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-2); font-weight: 600; }
  .mg { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-1); }
  .pi { min-height: 40px; min-width: 40px; display: inline-grid; place-items: center; border: 0; border-radius: var(--r-sm); background: none; font-size: 14px; }
  .pi:hover:not(:disabled) { background: var(--surface-3); }
  .pi:disabled { opacity: .4; cursor: default; }
  .pi[aria-pressed='true'] { background: var(--accent); color: var(--on-accent); font-weight: 600; }

  .dow, .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: var(--sp-2); }
  .dow { margin-bottom: var(--sp-2); }
  .dow span { font: 500 11px var(--font-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--tx2); text-align: center; }
  .grid { grid-auto-rows: 1fr; }

  .cell {
    position: relative; overflow: hidden; min-height: 116px; padding: var(--sp-2); text-align: left;
    display: flex; flex-direction: column; gap: var(--sp-1); border-radius: var(--r-md);
    border: 1px solid var(--line); background: var(--surface); box-shadow: inset 0 1px 0 var(--surface-2);
    transition: border-color .2s, transform .2s var(--ease), background .2s;
  }
  .cell:nth-child(7n + 1), .cell:nth-child(7n) { background: var(--surface-2); }
  .cell:hover { border-color: var(--line-2); transform: translateY(-2px); }
  .cell.out { opacity: .45; }
  .cell.full { border-color: color-mix(in srgb, var(--good) 55%, transparent); }
  .cell.run::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 3px; background: var(--good); }
  .cell.today { border-color: var(--tx); box-shadow: 0 0 0 3px color-mix(in srgb, var(--tx) 10%, transparent); }
  .fill {
    position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--p) * 100%); pointer-events: none; transform-origin: bottom;
    background: linear-gradient(to top, color-mix(in srgb, var(--good) 34%, transparent), color-mix(in srgb, var(--good) 14%, transparent));
    border-top: 1px solid color-mix(in srgb, var(--good) 75%, transparent);
  }
  .cell > :not(.fill) { position: relative; }
  .d { display: flex; align-items: center; gap: var(--sp-2); }
  .n { font: 600 17px/1 var(--font-display); font-variant-numeric: tabular-nums; min-width: 26px; height: 26px; display: inline-grid; place-items: center; border-radius: 99px; }
  .today .n { background: var(--accent); color: var(--on-accent); }
  .pen { width: 6px; height: 6px; border-radius: 50%; background: var(--warn); }
  .pill {
    display: flex; gap: var(--sp-1); padding: 0 var(--sp-2); line-height: 20px; border-radius: 6px; white-space: nowrap; font-size: 12px;
    background: var(--surface-2); border-left: 2px solid var(--ac, var(--line-ctl));
  }
  .pill[class*='a-'], .pill[class*='tg-'] { background: color-mix(in srgb, var(--ac) 16%, transparent); }
  .pill i { font: 500 10.5px/20px var(--font-mono); color: var(--tx2); }
  .pill em { font-style: normal; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
  .pill.done { color: var(--tx2); } .pill.done em { text-decoration: line-through; }
  .pill.ex { opacity: .6; border-left-style: dashed; } .pill.ex em { font-style: italic; }
  .cell.rest { background: repeating-linear-gradient(-45deg, var(--surface) 0 6px, var(--surface-2) 6px 12px); } .cell.rest .n { color: var(--tx2); }
  .more { font-size: 11px; color: var(--tx2); }
  .badge { display: none; font: 500 11px var(--font-mono); color: var(--tx2); }

  .enter .cell { animation: in .4s both; animation-delay: calc(var(--i) * 8ms); }
  .enter .fill { animation: rise .7s var(--ease) both; animation-delay: calc(var(--i) * 8ms + 150ms); }
  @keyframes in { from { opacity: 0; transform: translateY(6px); } }
  @keyframes rise { from { transform: scaleY(0); } }

  .key { margin: var(--sp-4) 0 0; font-size: 12px; color: var(--tx2); display: flex; gap: var(--sp-2); align-items: center; flex-wrap: wrap; }
  .sw { display: inline-block; width: 14px; height: 14px; border-radius: 4px; border: 1px solid var(--line-2); background: linear-gradient(to top, color-mix(in srgb, var(--good) 45%, transparent) 66%, transparent 66%); }
  .hint { margin-left: auto; }

  @media (max-width: 700px) {
    h1 { font-size: 30px; }
    .grid, .dow { gap: var(--sp-1); }
    .cell { min-height: 62px; padding: var(--sp-1) var(--sp-2); align-items: flex-start; }
    .pill, .more { display: none; }
    .badge { display: block; }
    .n { font-size: 15px; }
    .hint { display: none; }
  }
  @media (orientation: landscape) and (max-height: 500px) { .cell { min-height: 44px; } }
</style>
