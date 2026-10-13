<script>
  import Icon from './Icon.svelte';
  import { app, shiftWeek, thisWeek, openDay, cycleTask, moveTo, copyTasks } from '../lib/store.svelte.js';
  import { MON, DW, key, addD, dayStat, weekLabel, STATE_TEXT } from '../lib/logic.js';

  const days = $derived(Array.from({ length: 7 }, (_, i) => {
    const d = addD(app.week, i), k = key(d), st = dayStat(app.data, d);
    return { d, k, st, isT: +d === +app.today, fut: d > app.today, custom: Object.keys(app.data.customTasks[k] || {}).length };
  }));
  const total = $derived(days.reduce((a, x) => a + x.st.active, 0));
  const done = $derived(days.reduce((a, x) => a + x.st.n, 0));

  let dragT = $state(null), over = $state(null), copyFrom = $state(null);
  const checked = (t) => (t.state === 'done' ? 'true' : t.state === 'excused' ? 'mixed' : 'false');
  const headLabel = (x) => {
    const st = x.st, count = !st.t.length ? ', no tasks' : !st.active ? ', rest day' : `, ${st.n} of ${st.active} done`;
    return `${DW[x.d.getDay()]}, ${MON[x.d.getMonth()]} ${x.d.getDate()}${count}${st.ex && st.active ? `, ${st.ex} excused` : ''}${app.data.notes[x.k] ? ', has note' : ''}`;
  };
</script>

<section class="view" id="view-week" role="tabpanel" aria-labelledby="t-week">
  <div class="bar">
    <h1 aria-live="polite">{weekLabel(app.week)}</h1>
    {#if total}<span class="chip">{done}/{total} this week</span>{/if}
    <div class="nav">
      <button type="button" class="btn icon" aria-label="Previous week" onclick={() => shiftWeek(-1)}><Icon name="left" size={18} /></button>
      <button type="button" class="btn" onclick={thisWeek}>Today</button>
      <button type="button" class="btn icon" aria-label="Next week" onclick={() => shiftWeek(1)}><Icon name="right" size={18} /></button>
    </div>
  </div>

  <div class="wgrid" class:dnd={dragT}>
    {#each days as x, i (x.k)}
      <div
        class="wcard" class:today={x.isT} class:future={x.fut} class:over={over === x.k} data-k={x.k} style:--i={i}
        role="group" aria-label={headLabel(x)}
        ondragover={(e) => { if (!dragT) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; over = x.k; }}
        ondragleave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) over = null; }}
        ondrop={(e) => { e.preventDefault(); over = null; if (dragT) moveTo(dragT.k, dragT.id, x.k); }}
      >
        <div class="wtop">
          <button type="button" class="wh" aria-label={headLabel(x)} onclick={() => openDay(x.k)}>
            <span class="dw">{DW[x.d.getDay()].slice(0, 3)}</span>
            <span class="dn">{x.d.getDate()}</span>
            {#if app.data.notes[x.k]}<i class="pen"></i>{/if}
            <span class="ct">{#if x.st.active}{x.st.n}/{x.st.active}{:else if x.st.ex}Rest{/if}</span>
          </button>
          <button type="button" class="x wcopy" aria-label="Copy custom tasks from {DW[x.d.getDay()]}" aria-expanded={copyFrom === x.k} onclick={() => (copyFrom = copyFrom === x.k ? null : x.k)}><Icon name="copy" size={16} /></button>
        </div>
        <div class="prog"><i style:width="{x.st.active ? (x.st.n / x.st.active) * 100 : 0}%"></i></div>

        {#if copyFrom === x.k}
          <div class="copy" role="group" aria-label="Copy to">
            <span>{x.custom ? `Copy ${x.custom} custom task${x.custom === 1 ? '' : 's'} to…` : 'No custom tasks to copy'}</span>
            <div class="f">
              {#each days as y (y.k)}
                {#if y.k !== x.k}<button type="button" class="btn sm" disabled={!x.custom} onclick={() => { copyFrom = null; copyTasks(x.k, y.k); }}>{DW[y.d.getDay()].slice(0, 3)} {y.d.getDate()}</button>{/if}
              {/each}
            </div>
          </div>
        {/if}

        <ul class="wl">
          {#if !x.st.t.length}<li class="empty">{x.fut ? 'Nothing scheduled.' : 'No tasks recorded.'}</li>{/if}
          {#each x.st.t as t (t.id)}
            <li>
              <button
                type="button" class="row wrow {t.acc ? 'a-' + t.acc : t.tag ? 'tg-' + t.tag : ''}" role="checkbox" aria-checked={checked(t)}
                aria-label="{t.title}, {t.time}, {STATE_TEXT[t.state]}" draggable={t.custom} onclick={() => cycleTask(x.k, t.id)}
                ondragstart={(e) => { dragT = { k: x.k, id: t.id }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', t.id); } catch { /* ignore */ } }}
                ondragend={() => { dragT = null; over = null; }}
              >
                <span class="box">
                  {#if t.state === 'done'}<Icon name="check" size={14} stroke={3} />{:else if t.state === 'excused'}<Icon name="rest" size={12} stroke={2.4} />{/if}
                </span>
                <span class="tm">{t.time}</span>
                <span class="t">{t.title}</span>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</section>

<style>
  .bar { display: flex; align-items: center; gap: var(--sp-3); margin: var(--sp-5) 0 var(--sp-4); flex-wrap: wrap; }
  h1 { font-size: clamp(26px, 4vw, 40px); line-height: 1.1; font-weight: 600; font-variation-settings: 'opsz' 72; }
  .nav { margin-left: auto; display: flex; gap: var(--sp-2); }
  .wgrid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: var(--sp-2); align-items: start; }
  .wcard {
    display: flex; flex-direction: column; gap: var(--sp-2); padding: var(--sp-3); min-width: 0;
    border-radius: var(--r-md); border: 1px solid var(--line); background: var(--surface);
    animation: in .4s both; animation-delay: calc(var(--i) * 40ms);
  }
  .wcard.today { border-color: var(--tx); box-shadow: 0 0 0 3px color-mix(in srgb, var(--tx) 10%, transparent); }
  .dnd .wcard { border-style: dashed; }
  .wcard.over { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent); }
  @keyframes in { from { opacity: 0; transform: translateY(8px); } }
  .wtop { display: flex; align-items: center; gap: var(--sp-1); }
  .wh { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: var(--sp-2); min-height: 36px; padding: 0; border: 0; background: none; text-align: left; }
  .dn { font: 600 24px/1 var(--font-display); font-variant-numeric: tabular-nums; }
  .today .dn { color: var(--accent); }
  .dw { font: 500 11px var(--font-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--tx2); }
  .ct { margin-left: auto; font: 500 12px var(--font-mono); color: var(--tx2); }
  .pen { width: 6px; height: 6px; border-radius: 50%; background: var(--warn); align-self: center; }
  .wcopy { width: 36px; height: 36px; }
  @media (hover: hover) { .wcopy { opacity: 0; } .wcard:hover .wcopy, .wcopy:focus-visible, .wcopy[aria-expanded='true'] { opacity: 1; } }
  .prog { height: 3px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
  .prog i { display: block; height: 100%; background: var(--good); transition: width .4s var(--ease); }
  .copy { display: grid; gap: var(--sp-2); padding: var(--sp-2); border-radius: var(--r-sm); background: var(--surface-2); font-size: 12px; color: var(--tx2); animation: in .2s both; }
  .wl { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-1); }
  .wl .empty { font-size: 13px; }
  .wrow { min-height: 36px; padding: 0 var(--sp-2); gap: var(--sp-2); font-size: 13px; }
  .wrow .tm { font-size: 11px; }
  .wrow[draggable='true'] { cursor: grab; }
  .wrow[class*='a-'], .wrow[class*='tg-'] { background: color-mix(in srgb, var(--ac) 14%, transparent); }
  .wcard.future .ct { opacity: .7; }
  @media (max-width: 980px) { .wgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 700px) { .wgrid { grid-template-columns: 1fr; } .wrow, .wh, .wcopy { min-height: 44px; } .wcopy { width: 44px; } }
</style>
