<script>
  import { tick } from 'svelte';
  import Icon from './Icon.svelte';
  import { app, submitRoutine, removeRoutine, toggleArchive, reorderRoutines, stepRoutine, loadStarter, toast, excuseRange, todayKey } from '../lib/store.svelte.js';
  import { ACC, DW, freqLabel, splitRoutines, moveRel, REST_MAX_DAYS } from '../lib/logic.js';

  const lists = $derived(splitRoutines(app.data.routines));
  let name = $state(''), time = $state('09:00'), days = $state([]), accent = $state(''), editingId = $state(null), msg = $state('');
  let nameEl, listEl;
  let restFrom = $state(todayKey()), restTo = $state(todayKey());

  const accents = ['', ...ACC];
  const cap = (c) => (c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Automatic');

  // drop the edit if the routine disappeared (e.g. imported backup)
  $effect(() => { if (editingId && !app.data.routines.some((r) => r.id === editingId)) reset(); });

  function reset() { editingId = null; name = ''; time = '09:00'; days = []; accent = ''; }
  function toggleDay(i) { days = days.includes(i) ? days.filter((x) => x !== i) : [...days, i]; }
  function submit() {
    const err = submitRoutine(editingId, { name, time, days, accent });
    if (err) { msg = err; return; }
    msg = editingId ? '' : 'Routine added.';
    reset();
  }
  function startEdit(r) {
    editingId = r.id; name = r.name; time = r.time; days = [...r.days]; accent = r.accent || ''; msg = '';
    nameEl?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    nameEl?.focus(); nameEl?.select();
  }
  function accKey(e) {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    accent = accents[(accents.indexOf(accent) + dir + accents.length) % accents.length];
    tick().then(() => e.currentTarget.querySelector('[aria-checked=true]')?.focus());
  }

  /* reorder: pointer drag on the grip, or arrow keys */
  let drag = $state(null); // {id, y0, dy, tgt}
  function down(e, id) {
    if (e.button > 0) return;
    e.preventDefault();
    drag = { id, y0: e.clientY, dy: 0, tgt: null };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  }
  function move(e) {
    if (!drag) return;
    let tgt = null;
    listEl.querySelectorAll('[data-rid]').forEach((li) => {
      if (li.dataset.rid === drag.id) return;
      const q = li.getBoundingClientRect();
      if (e.clientY >= q.top && e.clientY <= q.bottom) tgt = { id: li.dataset.rid, after: e.clientY > q.top + q.height / 2 };
    });
    drag.dy = e.clientY - drag.y0;
    drag.tgt = tgt;
  }
  function up(ok) {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (ok && d.tgt) reorderRoutines(moveRel(app.data.routines, d.id, d.tgt.id, d.tgt.after));
  }
  async function gripKey(e, id) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const r = stepRoutine(id, e.key === 'ArrowUp' ? -1 : 1);
    if (!r) return;
    await tick();
    listEl.querySelector(`[data-rid="${id}"] .grip`)?.focus();
    toast(`Moved to position ${r.pos} of ${r.total}.`, 'info');
  }
</script>

{#snippet card(r, arch)}
  <li
    class="ri {r.accent ? 'a-' + r.accent : ''}" class:arch class:editing={r.id === editingId} class:dragging={drag?.id === r.id}
    class:drop-before={drag?.tgt?.id === r.id && !drag.tgt.after} class:drop-after={drag?.tgt?.id === r.id && drag.tgt.after}
    data-rid={r.id} style:transform={drag?.id === r.id ? `translateY(${drag.dy}px)` : null}
  >
    {#if !arch}
      <button
        type="button" class="grip" aria-label="Reorder {r.name}. Drag, or use Arrow Up and Arrow Down."
        onpointerdown={(e) => down(e, r.id)} onpointermove={move} onpointerup={() => up(true)} onpointercancel={() => up(false)} onlostpointercapture={() => up(false)}
        onkeydown={(e) => gripKey(e, r.id)}
      ><Icon name="grip" size={20} /></button>
    {/if}
    <div class="n">
      <div class="rt">{r.name}{#if arch}<span class="chip">Archived</span>{/if}</div>
      <div class="m"><span class="mono">{r.time}</span><span class="fq">{freqLabel(r)}</span></div>
      <div class="dcs" aria-hidden="true">{#each DW as _, d}<span class="dc" class:on={r.days.includes(d)}>{'SMTWTFS'.charAt(d)}</span>{/each}</div>
    </div>
    <div class="ra">
      {#if !arch}<button type="button" class="btn sm" aria-label="Edit routine {r.name}" onclick={() => startEdit(r)}>Edit</button>{/if}
      <button type="button" class="btn sm" aria-label="{arch ? 'Unarchive' : 'Archive'} {r.name}" onclick={() => toggleArchive(r)}>{arch ? 'Unarchive' : 'Archive'}</button>
      <button type="button" class="btn sm danger" aria-label="Delete routine {r.name}" onclick={() => removeRoutine(r)}>Delete</button>
    </div>
  </li>
{/snippet}

<section class="view" id="view-routines" role="tabpanel" aria-labelledby="t-routines">
  <div class="card">
    <div class="f hd"><h2>{editingId ? 'Edit routine' : 'New routine'}</h2>{#if editingId}<span class="chip warn">Editing</span>{/if}</div>
    {#if editingId}<p class="empty">Editing keeps history: existing completions stay linked to this routine.</p>{/if}
    <div class="f gap"><input type="text" id="routine-name" bind:this={nameEl} bind:value={name} maxlength="120" placeholder="Routine name" aria-label="Routine name" onkeydown={(e) => { if (e.key === 'Enter') submit(); }} /><input type="time" bind:value={time} aria-label="Time" /></div>
    <div class="f gap" role="group" aria-label="Days">
      {#each DW as dn, i}<button type="button" class="dayb" aria-pressed={days.includes(i)} aria-label={dn} onclick={() => toggleDay(i)}>{'SMTWTFS'.charAt(i)}</button>{/each}
    </div>
    <div class="f gap" role="radiogroup" aria-label="Accent color" onkeydown={accKey}>
      {#each accents as c}
        <button type="button" role="radio" class="sw {c ? 'a-' + c : ''}" aria-checked={accent === c} tabindex={accent === c ? 0 : -1} aria-label={cap(c)} onclick={() => (accent = c)}>
          {#if c}<i></i>{:else}A{/if}
        </button>
      {/each}
    </div>
    <div class="f gap">
      <button type="button" class="btn pri" onclick={submit}>{editingId ? 'Save changes' : 'Add routine'}</button>
      {#if editingId}<button type="button" class="btn" onclick={() => { reset(); msg = ''; }}>Cancel</button>{/if}
      <button type="button" class="btn" onclick={loadStarter}>Reset to Default Schedule</button>
      <span class="empty" role="status">{msg}</span>
    </div>
  </div>

  <div class="card">
    <div class="f hd"><h2>Routines</h2><span class="chip">{lists.active.length} routine{lists.active.length === 1 ? '' : 's'}{lists.archived.length ? ` · ${lists.archived.length} archived` : ''}</span></div>
    <ul class="rl" bind:this={listEl}>
      {#if !lists.active.length}<li class="empty">No routines yet.</li>{/if}
      {#each lists.active as r (r.id)}{@render card(r, false)}{/each}
    </ul>
  </div>

  <div class="card" id="rest-card">
    <h2>Rest period</h2>
    <p class="empty">For sickness, injury or an emergency. Scheduled routine sessions in the range are excused: they don't count as missed and don't break your streak. Anything already done stays done. Up to {REST_MAX_DAYS} days.</p>
    <div class="f gap">
      <label class="lbl">From<input type="date" bind:value={restFrom} min="1900-01-01" max="2100-12-31" /></label>
      <label class="lbl">To<input type="date" bind:value={restTo} min="1900-01-01" max="2100-12-31" /></label>
      <button type="button" class="btn pri" onclick={() => excuseRange(restFrom, restTo)}>Excuse routines</button>
    </div>
  </div>

  {#if lists.archived.length}
    <div class="card" id="archived-card">
      <h2>Archived</h2>
      <ul class="rl">{#each lists.archived as r (r.id)}{@render card(r, true)}{/each}</ul>
    </div>
  {/if}
</section>

<style>
  .hd { margin-bottom: var(--sp-2); }
  .lbl { display: grid; gap: var(--sp-1); font-size: 13px; color: var(--tx2); }
  .lbl input { min-width: 160px; }
  .gap { margin-top: var(--sp-3); }
  .f input[type='text'] { flex: 1; min-width: 140px; }
  .dayb { width: 40px; height: 40px; border-radius: var(--r-sm); border: 1px solid var(--line-ctl); background: none; font: 500 14px var(--font-mono); transition: background .15s, transform .1s; }
  .dayb[aria-pressed='true'] { background: var(--accent); border-color: transparent; color: var(--on-accent); font-weight: 700; }
  .dayb:active { transform: scale(.94); }
  .sw { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--line-ctl); background: none; display: grid; place-items: center; font: 600 13px var(--font-mono); color: var(--tx2); }
  .sw i { width: 20px; height: 20px; border-radius: 50%; background: var(--ac); }
  .sw[aria-checked='true'] { border: 2px solid var(--tx); color: var(--tx); }
  .rl { list-style: none; margin: var(--sp-3) 0 0; padding: 0; display: grid; gap: var(--sp-2); }
  .ri { display: flex; align-items: center; gap: var(--sp-3); padding: var(--sp-2) var(--sp-3); border-radius: var(--r-sm); border: 1px solid var(--line); border-left: 3px solid var(--ac, var(--line-2)); background: var(--surface); transition: box-shadow .15s; }
  .ri.arch { border-style: dashed; border-left-style: dashed; opacity: .65; }
  .ri.editing { border-color: color-mix(in srgb, var(--warn) 60%, transparent); background: color-mix(in srgb, var(--warn) 8%, var(--surface)); }
  .ri.dragging { position: relative; z-index: 3; border-color: var(--line-2); box-shadow: var(--shadow); }
  .ri.drop-before { box-shadow: inset 0 2px 0 var(--accent); } .ri.drop-after { box-shadow: inset 0 -2px 0 var(--accent); }
  .n { flex: 1; min-width: 0; }
  .rt { font-weight: 600; display: flex; gap: var(--sp-2); align-items: center; flex-wrap: wrap; }
  .m { display: flex; gap: var(--sp-3); font-size: 13px; color: var(--tx2); }
  .dcs { display: flex; gap: var(--sp-1); margin-top: var(--sp-1); }
  .dc { width: 20px; height: 20px; border-radius: 6px; display: grid; place-items: center; font: 500 11px var(--font-mono); color: var(--tx2); border: 1px solid var(--line); }
  .dc.on { background: color-mix(in srgb, var(--ac, var(--tx2)) 22%, transparent); border-color: var(--ac, var(--line-2)); color: var(--tx); }
  .ra { display: flex; gap: var(--sp-2); flex-wrap: wrap; justify-content: flex-end; }
  .grip { width: 44px; height: 44px; flex: none; border: 0; background: none; color: var(--tx2); cursor: grab; touch-action: none; border-radius: var(--r-sm); display: grid; place-items: center; }
  .grip:hover { color: var(--tx); } .dragging .grip { cursor: grabbing; }
  @media (max-width: 700px) { .dayb, .sw { width: 44px; height: 44px; } .ri { flex-wrap: wrap; } .n { flex: 1 1 140px; } .ra { flex: 1 1 100%; justify-content: flex-start; } }
</style>
