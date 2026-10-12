<script>
  import { app } from '../lib/store.svelte.js';
  import { MON, MS, DW, addD, weekStart, dayRatio, heatLevel, streaks, monthTotals, activeLoad, allTime, breakdown, freqLabel } from '../lib/logic.js';

  const weeks = $derived(app.vw <= 700 ? 13 : 26);

  const heat = $derived.by(() => {
    const st0 = addD(weekStart(app.today), -7 * (weeks - 1));
    let full = 0, withT = 0, prevM = -1;
    const cols = Array.from({ length: weeks }, (_, c) => {
      const sun = addD(st0, c * 7), label = sun.getMonth() !== prevM ? MS[sun.getMonth()] : '';
      prevM = sun.getMonth();
      const cells = Array.from({ length: 7 }, (_, r) => {
        const d = addD(sun, r), rt = dayRatio(app.data, d), up = d > app.today, lv = up ? -2 : heatLevel(rt.n, rt.t);
        if (!up && rt.t) { withT++; if (rt.n === rt.t) full++; }
        return { cls: up ? 'up' : lv < 0 ? 'none' : 'lv' + lv, td: +d === +app.today, title: `${DW[d.getDay()].slice(0, 3)}, ${MS[d.getMonth()]} ${d.getDate()} — ${up ? 'upcoming' : rt.t ? `${rt.n} of ${rt.t} done` : 'no tasks'}` };
      });
      return { label, cells };
    });
    return { cols, full, withT };
  });

  const sk = $derived(streaks(app.data, app.today));
  const mt = $derived(monthTotals(app.data, app.month.getFullYear(), app.month.getMonth()));
  const al = $derived(activeLoad(app.data));
  const nums = $derived([
    [String(sk.cur), 'Day streak', sk.cur === 1 ? 'day in a row' : 'days in a row'],
    [String(sk.best), 'Best streak', 'last 12 months'],
    [`${mt.t ? Math.round((mt.n / mt.t) * 100) : 0}%`, 'Month completion', `${mt.n}/${mt.t} · ${MON[app.month.getMonth()]} ${app.month.getFullYear()}`],
    [String(al.active), 'Active routines', `${al.week} tasks/week${al.archived ? ` · ${al.archived} archived` : ''}`],
    [allTime(app.data).toLocaleString('en-US'), 'Tasks completed', 'all time'],
  ]);
  const last7 = $derived(Array.from({ length: 7 }, (_, j) => { const d = addD(app.today, j - 6), rt = dayRatio(app.data, d); return { d, rt, td: j === 6 }; }));
  const rows = $derived(breakdown(app.data, app.today));
</script>

<section class="view" id="view-stats" role="tabpanel" aria-labelledby="t-stats">
  <div class="card">
    <h2>Consistency</h2>
    <div class="hmw">
      <div class="hm" role="img" aria-label="Consistency heatmap, last {weeks} weeks: {heat.full} fully completed days out of {heat.withT} days with tasks.">
        {#each heat.cols as col, c}
          <div class="hmc" style:--c={c}>
            <div class="hml">{col.label}</div>
            {#each col.cells as x}<div class="hc {x.cls}" class:td={x.td} title={x.title}></div>{/each}
          </div>
        {/each}
      </div>
    </div>
    <div class="leg"><span>Less</span>{#each ['lv0', 'lv1', 'lv2', 'lv3', 'lv4'] as c}<div class="hc {c}"></div>{/each}<span>More</span><div class="hc up"></div><span>Dashed = upcoming</span></div>
  </div>

  <div class="card"><div class="nums" role="group" aria-label="Summary">
    {#each nums as n}<div class="num"><b>{n[0]}</b><span>{n[1]}</span><small>{n[2]}</small></div>{/each}
  </div></div>

  <div class="card">
    <h2>Last 7 days</h2>
    <div class="l7">
      {#each last7 as x}
        <div class="l7c" class:td={x.td}>
          <div class="l7t" class:full={x.rt.t && x.rt.n === x.rt.t} title={x.rt.t ? `${x.rt.n} of ${x.rt.t} done` : 'no tasks'}><i style:height="{x.rt.t ? (x.rt.n / x.rt.t) * 100 : 0}%"></i></div>
          <div class="l7l">{DW[x.d.getDay()].slice(0, 3)} {x.rt.t ? `${x.rt.n}/${x.rt.t}` : '–'}</div>
        </div>
      {/each}
    </div>
  </div>

  <div class="card">
    <h2>Routine breakdown</h2>
    {#if !rows.length}<p class="empty">No active routines.</p>{:else}
      <div class="btw" role="table" aria-label="Routine breakdown">
        <div class="btr bth" role="row"><div class="bn" role="columnheader">#</div><div role="columnheader">Routine</div><div role="columnheader">Last 30 days</div><div class="ba" role="columnheader">All time</div></div>
        <div class="btb" role="rowgroup">
          {#each rows as x, j (x.r.id)}
            <div class="btr {x.r.accent ? 'a-' + x.r.accent : ''}" class:top={j === 0} role="row">
              <div class="bn" role="cell">{j + 1}</div>
              <div role="cell"><div>{x.r.name}</div><div class="bm">{x.r.time} · {freqLabel(x.r)}</div></div>
              <div class="bp" role="cell"><span>{x.done}/{x.exp} · {x.pct}%</span><div class="mp"><i style:width="{x.pct}%"></i></div></div>
              <div class="ba" role="cell">{x.all}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .hmw { overflow-x: auto; padding-bottom: var(--sp-1); }
  .hm { display: flex; gap: var(--sp-1); min-width: max-content; }
  .hmc { flex: 1 1 24px; min-width: 24px; max-width: 48px; display: grid; grid-template-rows: 16px repeat(7, auto); gap: var(--sp-1); }
  .hml { font: 500 11px/16px var(--font-mono); color: var(--tx2); height: 16px; white-space: nowrap; }
  .hc { aspect-ratio: 1; border-radius: 4px; border: 1px solid var(--line); animation: pix .5s var(--ease) both; animation-delay: calc(var(--c, 0) * 14ms); }
  @keyframes pix { from { opacity: 0; transform: scale(.6); } }
  .hc.lv0 { background: var(--surface-2); }
  .hc.lv1 { background: color-mix(in srgb, var(--good) 22%, transparent); border-color: color-mix(in srgb, var(--good) 30%, transparent); }
  .hc.lv2 { background: color-mix(in srgb, var(--good) 42%, transparent); border-color: color-mix(in srgb, var(--good) 50%, transparent); }
  .hc.lv3 { background: color-mix(in srgb, var(--good) 66%, transparent); border-color: color-mix(in srgb, var(--good) 70%, transparent); }
  .hc.lv4 { background: var(--good); border-color: var(--good); }
  .hc.up { border-style: dashed; } .hc.td { outline: 2px solid var(--tx); outline-offset: 1px; }
  .leg { display: flex; align-items: center; gap: var(--sp-2); margin-top: var(--sp-3); font-size: 12px; color: var(--tx2); flex-wrap: wrap; }
  .leg .hc { width: 16px; animation: none; }

  .nums { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--sp-4); }
  .num b { display: block; font: 600 34px/1.1 var(--font-display); font-variant-numeric: tabular-nums; }
  .num span { display: block; font-size: 13px; color: var(--tx2); }
  .num small { display: block; font-size: 12px; color: var(--tx2); margin-top: var(--sp-1); }

  .l7 { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: var(--sp-2); }
  .l7c { display: grid; gap: var(--sp-1); justify-items: center; }
  .l7t { position: relative; width: 100%; max-width: 56px; height: 96px; border-radius: var(--r-sm); border: 1px solid var(--line); background: var(--surface); overflow: hidden; }
  .l7t i { position: absolute; left: 0; right: 0; bottom: 0; background: color-mix(in srgb, var(--good) 55%, transparent); transition: height .5s var(--ease); }
  .l7t.full i { background: var(--good); }
  .l7t::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed var(--line-2); }
  .l7l { font: 500 11.5px var(--font-mono); color: var(--tx2); text-align: center; }
  .l7c.td .l7l { color: var(--tx); font-weight: 700; } .l7c.td .l7t { border-color: var(--tx); }

  .btw { border: 1px solid var(--line); border-radius: var(--r-md); overflow: hidden; }
  .btr { display: grid; grid-template-columns: 32px minmax(0, 1fr) minmax(120px, 200px) 72px; gap: var(--sp-3); align-items: center; padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--line); }
  .btr:last-child { border-bottom: 0; }
  .bth { font-size: 12px; font-weight: 500; color: var(--tx2); background: var(--surface); }
  .btb { max-height: 384px; overflow: auto; }
  .bn { text-align: center; font-family: var(--font-mono); color: var(--tx2); } .btr.top .bn { color: var(--tx); font-weight: 700; }
  .bm { font-size: 12px; color: var(--tx2); font-family: var(--font-mono); }
  .bp { display: grid; gap: var(--sp-1); font: 12px var(--font-mono); }
  .mp { height: 6px; border-radius: 9px; background: var(--surface-3); overflow: hidden; }
  .mp i { display: block; height: 100%; background: var(--ac, var(--good)); transition: width .5s var(--ease); }
  .ba { text-align: right; font-family: var(--font-mono); }
  @media (max-width: 980px) { .nums { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 700px) { .nums { grid-template-columns: repeat(2, minmax(0, 1fr)); } .btr { grid-template-columns: 28px minmax(0, 1fr) 96px; } .btr .ba { display: none; } }
</style>
