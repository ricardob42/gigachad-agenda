<script>
  import { fade } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import { app, closeDay, toggleDone, addTask, deleteTask, clearDay, setNote, moveTo, loadStarter } from '../lib/store.svelte.js';
  import { openFocus } from '../lib/focus.svelte.js';
  import { modal } from '../lib/actions.js';
  import { DW, MON, parse, dayStat, addD, key, validDate } from '../lib/logic.js';

  const k = app.day; // the modal is re-created per day via {#key}
  const d = parse(k);
  const st = $derived(dayStat(app.data, d));
  const pct = $derived(st.t.length ? (st.n / st.t.length) * 100 : 0);

  let time = $state('09:00'), title = $state(''), note = $state(app.data.notes[k] || '');
  let moving = $state(null), moveDate = $state(''), titleEl;

  function add() {
    if (!addTask(k, time, title)) { titleEl?.focus(); return; }
    title = '';
    titleEl?.focus();
  }
  function openMove(id) {
    if (moving === id) { moving = null; return; }
    moveDate = key(addD(d, 1)); moving = id;
  }
  function doMove(id) {
    if (!validDate(moveDate) || moveDate === k) return;
    moving = null;
    moveTo(k, id, moveDate);
  }
  function onNote(e) { note = e.currentTarget.value; setNote(k, note); }
  async function clear() { if (clearDay(k)) note = ''; }
</script>

<div class="ov" transition:fade|global={{ duration: 140 }} onmousedown={(e) => { if (e.target === e.currentTarget) closeDay(); }} role="presentation">
  <div class="dlg" role="dialog" aria-modal="true" aria-labelledby="mt" use:modal={{ initial: '.close' }}>
    <div class="mh">
      <h2 id="mt">{DW[d.getDay()]}, {MON[d.getMonth()]} {d.getDate()} <small>{d.getFullYear()}</small></h2>
      <button type="button" class="x close" aria-label="Close" onclick={closeDay}><Icon name="close" size={18} /></button>
    </div>

    <div class="prog" aria-live="polite">
      <span>{st.n} of {st.t.length} done</span>
      <div class="track"><i style:width="{pct}%"></i></div>
      <span>{Math.round(pct)}%</span>
    </div>

    <ul class="tl">
      {#if !st.t.length}<li class="empty">No tasks for this day.</li>{/if}
      {#each st.t as x (x.id)}
        <li>
          <button type="button" class="row {x.acc ? 'a-' + x.acc : ''}" aria-pressed={!!st.c[x.id]} onclick={() => toggleDone(k, x.id)}>
            <span class="box"><Icon name="check" size={14} stroke={3} /></span>
            <span class="tm">{x.time}</span>
            <span class="t">{x.title}</span>
            {#if !x.custom}<span class="src">Routine</span>{/if}
          </button>
          <button type="button" class="x" aria-label="Start a focus timer for {x.title}" onclick={() => openFocus(k, x.id, x.title)}><Icon name="focus" size={18} /></button>
          {#if x.custom}
            <button type="button" class="x" aria-label="Move task {x.title} to another date" aria-expanded={moving === x.id} onclick={() => openMove(x.id)}><Icon name="move" size={18} /></button>
            <button type="button" class="x" aria-label="Delete task {x.title}" onclick={() => deleteTask(k, x.id)}><Icon name="trash" size={18} /></button>
          {/if}
          {#if moving === x.id}
            <div class="mv">
              <input type="date" bind:value={moveDate} min="1900-01-01" max="2100-12-31" aria-label="Target date" />
              <button type="button" class="btn pri sm" onclick={() => doMove(x.id)}>Move</button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>

    <div class="addf">
      <input type="time" bind:value={time} aria-label="Time" />
      <input type="text" bind:value={title} bind:this={titleEl} maxlength="120" placeholder="New task" aria-label="Task title" onkeydown={(e) => { if (e.key === 'Enter') add(); }} />
      <button type="button" class="btn" onclick={add}>Add</button>
    </div>

    <div class="nh"><label for="day-note">Note</label><span class="mono" class:hi={note.length >= 400} aria-live="polite" aria-atomic="true">{note.length} / 500</span></div>
    <textarea id="day-note" maxlength="500" rows="3" placeholder="Write something about this day" value={note} oninput={onNote}></textarea>

    <div class="mf">
      <button type="button" class="btn" onclick={loadStarter}>Reset to Default Schedule</button>
      <button type="button" class="btn danger" onclick={clear}>Clear day</button>
    </div>
  </div>
</div>

<style>
  .ov { position: fixed; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; padding: var(--sp-4); background: var(--scrim); }
  .dlg {
    width: 100%; max-width: 500px; max-height: calc(100dvh - 32px); overflow: auto; padding: var(--sp-5);
    border-radius: var(--r-xl); border: 1px solid var(--line-2); background: var(--panel-strong);
    backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%);
    box-shadow: var(--shadow); animation: up .35s var(--ease);
  }
  @keyframes up { from { opacity: 0; transform: translateY(16px) scale(.98); } }
  .mh { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-3); }
  h2 { font-size: 26px; line-height: 1.15; }
  h2 small { font-weight: 300; font-size: 16px; color: var(--tx2); }
  .prog { display: flex; align-items: center; gap: var(--sp-3); margin: var(--sp-4) 0; font: 500 12.5px var(--font-mono); color: var(--tx2); }
  .track { flex: 1; height: 6px; border-radius: 9px; background: var(--surface-3); overflow: hidden; }
  .track i { display: block; height: 100%; background: var(--good); border-radius: 9px; transition: width .4s var(--ease); }
  .tl { list-style: none; margin: 0 0 var(--sp-4); padding: 0; display: grid; gap: var(--sp-2); }
  .tl li { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .tl li .row { flex: 1; min-width: 0; width: auto; }
  .tl li.empty { display: block; }
  .mv { flex-basis: 100%; display: flex; gap: var(--sp-2); padding: var(--sp-2); border-radius: var(--r-sm); background: var(--surface-2); animation: up .2s both; }
  .mv input { flex: 1; min-width: 0; }
  .addf { display: flex; gap: var(--sp-2); margin-bottom: var(--sp-4); }
  .addf input[type='text'] { flex: 1; min-width: 0; }
  .nh { display: flex; justify-content: space-between; font-size: 13px; font-weight: 500; margin-bottom: var(--sp-2); }
  .nh span { color: var(--tx2); } .nh span.hi { color: var(--warn); }
  .mf { display: flex; justify-content: space-between; gap: var(--sp-2); flex-wrap: wrap; margin-top: var(--sp-4); }
  @media (max-width: 700px) {
    .ov { align-items: flex-end; padding: 0; }
    .dlg { max-width: none; max-height: 92dvh; border-radius: var(--r-xl) var(--r-xl) 0 0; padding-bottom: calc(var(--sp-5) + env(safe-area-inset-bottom, 0px)); animation: sheet .4s var(--ease); }
    @keyframes sheet { from { transform: translateY(100%); } }
  }
</style>
