<script>
  import { tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import { app, goView, goMonth, goDay, goToday, stepNav, thisMonth, thisWeek, setTheme, addTask, todayKey, toast, downloadBackup, loadStarter } from '../lib/store.svelte.js';
  import { modal } from '../lib/actions.js';
  import { MON, MS, THEMES, dayLabel, parse, rankCmds, parseDateQuery, parseQuickAdd, searchEntries } from '../lib/logic.js';

  const after = async (fn) => { await tick(); fn(); };
  const byId = (id) => document.getElementById(id);

  const CMDS = [
    { icon: 'calendar', label: 'Go to Calendar', kw: 'calendar month view', run: () => goView('calendar') },
    { icon: 'week', label: 'Go to Week', kw: 'agenda week view', run: () => goView('week') },
    { icon: 'routines', label: 'Go to Routines', kw: 'schedule recurring', run: () => goView('routines') },
    { icon: 'look', label: 'Go to Look', kw: 'appearance background image wallpaper theme palette', run: () => goView('look') },
    { icon: 'backup', label: 'Go to Backup', kw: 'export import restore', run: () => goView('backup') },
    { icon: 'stats', label: 'Go to Stats', kw: 'streak heatmap statistics', run: () => goView('stats') },
    { icon: 'check', label: "Open today's schedule", kw: 'day modal tasks', run: goToday },
    { icon: 'focus', label: 'Jump to today', hint: 'T', kw: 'current month week', run: () => { if (app.tab === 'week') thisWeek(); else { goView('calendar'); thisMonth(); } } },
    { icon: 'left', label: 'Previous month / week', hint: '←', kw: 'back earlier', run: () => stepNav(-1) },
    { icon: 'right', label: 'Next month / week', hint: '→', kw: 'forward later', run: () => stepNav(1) },
    { icon: 'plus', label: 'New routine', kw: 'create add form', run: () => { goView('routines'); after(() => { const el = byId('routine-name'); el?.scrollIntoView({ block: 'center' }); el?.focus(); }); } },
    { icon: 'backup', label: 'Export backup', kw: 'download save json', run: downloadBackup },
    { icon: 'backup', label: 'Import backup', kw: 'restore upload json', run: () => { goView('backup'); after(() => byId('backup-file')?.click()); } },
    { icon: 'routines', label: 'Reset to default schedule', kw: 'defaults 21 routines starter', run: () => { goView('routines'); loadStarter(); } },
    { icon: 'routines', label: 'Show archived routines', kw: 'archive hidden', run: () => { goView('routines'); after(() => { const el = byId('archived-card'); if (el) el.scrollIntoView({ block: 'start' }); else toast('No archived routines.', 'info'); }); } },
    { icon: 'focus', label: 'Start a focus timer', kw: 'pomodoro focus', run: () => { goToday(); toast('Press the timer button on a task to start a focus session.', 'info'); } },
    { icon: 'look', label: "Write today's note", kw: 'journal note diary', run: () => { goToday(); after(() => byId('day-note')?.focus()); } },
    ...THEMES.map((t) => ({ icon: 'look', label: `Theme: ${t.name}`, kw: 'palette color appearance', run: () => setTheme(t.id) })),
  ];

  let query = $state(''), idx = $state(0), listEl;

  const items = $derived.by(() => {
    const q = query, out = [];
    const quick = parseQuickAdd(q);
    if (quick) out.push({ icon: 'plus', label: `Add “${quick.title}” to today`, hint: quick.time, run: () => { addTask(todayKey(), quick.time, quick.title); toast('Task added to today.', 'success'); } });
    parseDateQuery(q, app.month.getFullYear(), app.month.getMonth()).forEach((r) => {
      out.push(r.kind === 'month'
        ? { icon: 'calendar', label: `Go to ${MON[r.m]} ${r.y}`, hint: 'Date', run: () => goMonth(r.y, r.m) }
        : { icon: 'check', label: `Open ${MS[r.m]} ${r.d}, ${r.y}`, hint: 'Date', run: () => goDay(r.y, r.m, r.d) });
    });
    out.push(...rankCmds(q, CMDS));
    if (!q.trim().startsWith('+')) searchEntries(app.data, q).forEach((e) => {
      const d = parse(e.k);
      out.push({ icon: 'search', label: e.text, hint: `${e.kind === 'note' ? 'Note · ' : ''}${dayLabel(e.k)}`, run: () => goDay(d.getFullYear(), d.getMonth(), d.getDate()) });
    });
    return out;
  });

  function close() { app.palette = false; }
  async function run(i) {
    const c = items[i];
    if (!c) return;
    close();
    await tick();
    c.run();
  }
  function mark() { tick().then(() => listEl?.children[idx]?.scrollIntoView?.({ block: 'nearest' })); }
  function onkeydown(e) {
    const n = items.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (n) { idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; mark(); } }
    else if ((e.key === 'Home' || e.key === 'End') && e.target.tagName === 'INPUT' && n) { e.preventDefault(); idx = e.key === 'Home' ? 0 : n - 1; mark(); }
    else if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); run(idx); }
  }
</script>

<div class="pal" transition:fade|global={{ duration: 120 }} onmousedown={(e) => { if (e.target === e.currentTarget) close(); }} role="presentation">
  <div class="pbox" role="dialog" aria-modal="true" aria-label="Command palette" use:modal {onkeydown}>
    <div class="prow">
      <input type="text" role="combobox" aria-expanded="true" aria-controls="plist" aria-autocomplete="list" aria-label="Command" aria-activedescendant={items.length ? 'pit' + idx : undefined}
        placeholder="Type a command, a date, or + to add a task" autocomplete="off" spellcheck="false" bind:value={query} oninput={() => (idx = 0)} />
      <button class="btn sm esc" type="button" aria-label="Close command palette" onclick={close}><kbd>Esc</kbd></button>
    </div>
    <ul class="plist" id="plist" role="listbox" aria-label="Commands" bind:this={listEl}>
      {#if !items.length}<li class="pempty" role="presentation">No matching commands.</li>{/if}
      {#each items as c, i}
        <li id="pit{i}" class="pit" class:sel={i === idx} role="option" aria-selected={i === idx} onmousemove={() => { if (idx !== i) idx = i; }} onclick={() => run(i)}>
          <span class="pic"><Icon name={c.icon} size={16} /></span>
          <span class="plb">{c.label}</span>
          {#if c.hint}<span class="phn">{c.hint}</span>{/if}
        </li>
      {/each}
    </ul>
    <div class="pft"><span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> run</span><span><kbd>Esc</kbd> close</span></div>
  </div>
</div>

<style>
  .pal { position: fixed; inset: 0; z-index: 50; display: flex; align-items: flex-start; justify-content: center; padding: calc(var(--sp-6) * 2 + env(safe-area-inset-top, 0px)) var(--sp-4) var(--sp-4); background: var(--scrim); }
  .pbox { width: 100%; max-width: 580px; max-height: calc(100dvh - 120px); display: flex; flex-direction: column; overflow: hidden; border-radius: var(--r-xl); border: 1px solid var(--line-2); background: var(--panel-strong); backdrop-filter: blur(20px) saturate(160%); -webkit-backdrop-filter: blur(20px) saturate(160%); box-shadow: var(--shadow); animation: pin .2s var(--ease); }
  @keyframes pin { from { opacity: 0; transform: translateY(-10px) scale(.97); } }
  .prow { display: flex; gap: var(--sp-2); padding: var(--sp-3); border-bottom: 1px solid var(--line); }
  .prow input { flex: 1; min-width: 0; }
  .plist { list-style: none; margin: 0; padding: var(--sp-2); overflow: auto; display: grid; gap: 2px; }
  .pit { display: flex; align-items: center; gap: var(--sp-3); min-height: 44px; padding: 0 var(--sp-3); border-radius: var(--r-sm); cursor: pointer; }
  .pit.sel { background: var(--surface-3); box-shadow: inset 3px 0 0 var(--accent); }
  .pic { width: 20px; display: grid; place-items: center; color: var(--tx2); }
  .plb { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .phn { font: 12px var(--font-mono); color: var(--tx2); }
  .pempty { padding: var(--sp-5); text-align: center; color: var(--tx2); }
  .pft { display: flex; gap: var(--sp-4); padding: var(--sp-2) var(--sp-3); border-top: 1px solid var(--line); font-size: 12px; color: var(--tx2); }
  @media (max-width: 700px) { .esc, .pft { display: none; } .pal { padding-top: calc(var(--sp-4) + env(safe-area-inset-top, 0px)); } }
</style>
