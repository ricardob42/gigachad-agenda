import {
  KEY, PREFS_KEY, NUDGE_KEY, SHARE_CACHE, SHARE_PATH, THEMES, TM,
  blank, clean, isObj, cid, slot, key, addD, weekStart, monthStart, startOfToday, dayLabel,
  moveTask, copyDay, removeTask, delRoutine, restoreRoutine, applyEdit, applyStarter, moveStep,
  stateOf, nextTaskState, restRange, undoRest, tidyDay, REST_MAX_DAYS,
  hasMeaningfulData, nudgeClean, nudgeDue, buildBackup, parseBackup, bgFileOK, own,
} from './logic.js';
import { bgAvailable, bgLoad, bgSave, bgDelete, bgDecodes } from './backgrounds.js';

const today0 = startOfToday();

/** Single source of truth. Components read it; the actions below mutate it. */
export const app = $state({
  data: blank(),
  tab: 'calendar',
  today: today0,
  month: monthStart(today0),
  week: weekStart(today0),
  day: null,
  palette: false,
  monthPop: false,
  confirm: null,
  toasts: [],
  prefs: { theme: 'ink', dim: 26 },
  vw: 1024,
  bg: { desktop: null, mobile: null, available: true },
  nudge: { firstSeen: null, lastExport: null, lastDismiss: null },
  backupMsg: '',
  focus: null,
  focusOpen: false,
  focusDur: 25,
  now: Date.now(),
});

/* ---------- toasts & confirm ---------- */
let toastId = 0;
export function toast(msg, type = 'info', act) {
  const a = typeof act === 'function' ? { label: 'Undo', run: act } : act;
  app.toasts.push({ id: ++toastId, msg, type, act: a });
  while (app.toasts.length > 4) app.toasts.shift();
}
export function dismiss(id) {
  const i = app.toasts.findIndex((t) => t.id === id);
  if (i >= 0) app.toasts.splice(i, 1);
}
const restored = () => toast('Restored — nothing was lost.', 'success');

let resolver = null;
/** Promise-based in-app confirm. */
export function ask(opts) {
  if (resolver) answer(false);
  return new Promise((res) => { resolver = res; app.confirm = opts; });
}
export function answer(v) {
  const r = resolver;
  resolver = null;
  app.confirm = null;
  if (r) r(v);
}

/* ---------- persistence ---------- */
let timer = 0, dirty = false, saveWarned = false;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(app.data));
    saveWarned = false; dirty = false;
  } catch {
    if (!saveWarned) { saveWarned = true; toast('Could not save changes: browser storage is full or blocked. Export a backup now.', 'error'); }
  }
}
export function persist() {
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(save, 500);
  touchNudge();
}
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { return; }
  if (raw == null) return;
  let o = null;
  try { o = JSON.parse(raw); } catch { /* handled below */ }
  if (!isObj(o)) {
    // Never destroy unreadable data silently: keep a copy before starting fresh.
    try { localStorage.setItem(KEY + '_corrupt', raw); } catch { /* ignore */ }
    app.data = blank(); save();
    return;
  }
  app.data = clean(o);
}
function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(app.prefs)); } catch { /* ignore */ } }
function loadPrefs() {
  try {
    const o = JSON.parse(localStorage.getItem(PREFS_KEY));
    if (isObj(o)) {
      if (THEMES.some((t) => t.id === o.theme)) app.prefs.theme = o.theme;
      if (Number.isFinite(o.dim)) app.prefs.dim = Math.min(60, Math.max(0, Math.round(o.dim)));
    }
  } catch { /* defaults */ }
}
export function setTheme(id) { app.prefs.theme = id; savePrefs(); }
export function setDim(v) { app.prefs.dim = v; savePrefs(); }

/* ---------- navigation ---------- */
export const todayKey = () => key(app.today);
export function setTab(n) { app.tab = n; app.monthPop = false; }
export function shiftMonth(n) { app.month = new Date(app.month.getFullYear(), app.month.getMonth() + n, 1); }
export function shiftWeek(n) { app.week = addD(app.week, 7 * n); }
export function thisMonth() { app.month = monthStart(app.today); }
export function thisWeek() { app.week = weekStart(app.today); }
export function openDay(k) { app.day = k; }
export function closeDay() { app.day = null; }
export function goView(n) { app.day = null; app.monthPop = false; app.tab = n; }
export function goMonth(y, m) { app.day = null; app.month = new Date(y, m, 1); app.tab = 'calendar'; app.monthPop = false; }
export function goDay(y, m, d) { goMonth(y, m); app.day = key(new Date(y, m, d)); }
export function goToday() { const t = app.today; goDay(t.getFullYear(), t.getMonth(), t.getDate()); }
export function stepNav(d) {
  if (app.tab === 'week') shiftWeek(d);
  else { if (app.tab !== 'calendar') goView('calendar'); shiftMonth(d); }
}

/** Closes the topmost layer. Returns true if something was closed. */
export function closeTop() {
  if (app.palette) { app.palette = false; return true; }
  if (app.confirm) { answer(false); return true; }
  if (app.focusOpen) { closeFocusHook(); return true; }
  if (app.monthPop) { app.monthPop = false; return true; }
  if (app.day) { app.day = null; return true; }
  return false;
}
let closeFocusHook = () => { app.focusOpen = false; };
export function onCloseFocus(fn) { closeFocusHook = fn; }

/* ---------- tasks ---------- */
/** Tap cycle for a task: open -> done -> excused -> open. */
export function cycleTask(k, id) {
  const was = nextTaskState(app.data, k, id);
  persist();
  if (was === 'done') toast('Excused. It does not count as missed and keeps your streak.', 'info');
}
export function markDone(k, id) {
  if (app.data.excused[k]) delete app.data.excused[k][id];
  slot(app.data.completions, k)[id] = true;
  tidyDay(app.data, k);
  persist();
}
export function addTask(k, time, title) {
  const t = String(title).trim().slice(0, 120);
  if (!TM.test(time) || !t) return false;
  slot(app.data.customTasks, k)[cid()] = { time, title: t };
  persist();
  return true;
}
export function deleteTask(k, id) {
  const t = app.data.customTasks[k]?.[id];
  if (!t) return;
  const snap = { ...t }, st = stateOf(app.data, k, id);
  removeTask(app.data, k, id);
  persist();
  toast('Task deleted.', 'success', () => {
    slot(app.data.customTasks, k)[id] = snap;
    if (st === 'done') slot(app.data.completions, k)[id] = true;
    if (st === 'excused') slot(app.data.excused, k)[id] = true;
    persist(); restored();
  });
}
export function clearDay(k) {
  const d = app.data;
  const snap = {
    c: d.customTasks[k] ? JSON.parse(JSON.stringify(d.customTasks[k])) : null,
    m: d.completions[k] ? { ...d.completions[k] } : null,
    e: d.excused[k] ? { ...d.excused[k] } : null,
    n: d.notes[k] ?? null,
  };
  if (!snap.c && !snap.m && !snap.e && snap.n === null) { toast('Nothing to clear for this day.', 'info'); return false; }
  delete d.customTasks[k]; delete d.completions[k]; delete d.excused[k]; delete d.notes[k];
  persist();
  toast('Day cleared.', 'success', () => {
    if (snap.c) d.customTasks[k] = snap.c;
    if (snap.m) d.completions[k] = snap.m;
    if (snap.e) d.excused[k] = snap.e;
    if (snap.n !== null) d.notes[k] = snap.n;
    persist(); restored();
  });
  return true;
}
export function setNote(k, v) {
  if (v) app.data.notes[k] = v.slice(0, 500); else delete app.data.notes[k];
  persist();
}
export function moveTo(a, id, b) {
  if (!moveTask(app.data, a, id, b)) return false;
  persist();
  toast(`Task moved to ${dayLabel(b)}.`, 'success', () => { moveTask(app.data, b, id, a); persist(); restored(); });
  return true;
}
export function copyTasks(a, b) {
  const r = copyDay(app.data, a, b, cid);
  if (!r.added.length) { toast("All of that day's tasks already exist here.", 'info'); return; }
  persist();
  toast(`Copied ${r.added.length} task${r.added.length === 1 ? '' : 's'} to ${dayLabel(b)}.`, 'success', () => {
    r.added.forEach((id) => { if (app.data.customTasks[b]) delete app.data.customTasks[b][id]; });
    if (app.data.customTasks[b] && !Object.keys(app.data.customTasks[b]).length) delete app.data.customTasks[b];
    persist(); restored();
  });
}

/* ---------- routines ---------- */
/** Returns an error string, or '' on success. `editingId` null = create. */
export function submitRoutine(editingId, f) {
  const name = f.name.trim().slice(0, 120);
  if (!name || !TM.test(f.time) || !f.days.length) return 'Enter a name, a time and at least one day.';
  if (editingId) {
    const r = app.data.routines.find((x) => x.id === editingId);
    if (!r || !applyEdit(r, f)) return 'That routine no longer exists.';
    persist(); toast('Routine updated.', 'success');
    return '';
  }
  const o = { id: cid(), name, time: f.time, days: [...f.days].sort() };
  if (f.accent) o.accent = f.accent;
  app.data.routines.push(o);
  persist();
  return '';
}
export function removeRoutine(r) {
  const sn = delRoutine(app.data, r.id);
  if (!sn) return;
  persist();
  toast('Routine deleted.', 'success', () => { restoreRoutine(app.data, sn); persist(); toast('Restored — nothing was lost.', 'info'); });
}
export function toggleArchive(r) {
  const was = r.archived === true;
  if (was) delete r.archived; else r.archived = true;
  persist();
  if (was) toast('Routine returned to the schedule.', 'info');
  else toast('Routine archived.', 'success', () => { delete r.archived; persist(); toast('Restored — nothing was lost.', 'info'); });
}
/** Excuses open routine sessions in [from, to]. Undo removes only what this call added. */
export function excuseRange(from, to) {
  const added = restRange(app.data, from, to);
  if (added === null) { toast(`Choose a valid range of up to ${REST_MAX_DAYS} days.`, 'error'); return 0; }
  if (!added.length) { toast('No open routine sessions in that range.', 'info'); return 0; }
  persist();
  const n = added.length;
  toast(`${n} session${n === 1 ? '' : 's'} excused. Streaks are kept.`, 'success', () => { undoRest(app.data, added); persist(); restored(); });
  return n;
}
export function reorderRoutines(list) { app.data.routines = list; persist(); }
export function stepRoutine(id, dir) {
  const r = moveStep(app.data.routines, id, dir);
  if (!r.moved) return null;
  reorderRoutines(r.list);
  return r;
}
export async function loadStarter() {
  const ok = await ask({ title: 'Replace routines?', body: 'All routines will be replaced with the default schedule. Custom tasks are kept.', ok: 'Replace' });
  if (!ok) return;
  applyStarter(app.data);
  persist();
  toast('Default schedule restored.', 'success');
}

/* ---------- backup ---------- */
function touchNudge() {
  if (!app.nudge.firstSeen && hasMeaningfulData(app.data)) { app.nudge.firstSeen = Date.now(); saveNudge(); }
}
function saveNudge() { try { localStorage.setItem(NUDGE_KEY, JSON.stringify(app.nudge)); } catch { /* ignore */ } }
export const backupDue = () => nudgeDue(app.nudge, Date.now(), hasMeaningfulData(app.data));
function markExport() { app.nudge.lastExport = Date.now(); saveNudge(); }
export function snoozeNudge() { app.nudge.lastDismiss = Date.now(); saveNudge(); toast('Reminder snoozed for 14 days.', 'info'); }

export function downloadBackup() {
  const b = buildBackup(app.data), u = URL.createObjectURL(new Blob([b.json], { type: 'application/json' })), a = document.createElement('a');
  a.href = u; a.download = b.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
  markExport();
  toast('Backup downloaded.', 'success');
}
export async function shareBackup() {
  if (!navigator.share) { downloadBackup(); app.backupMsg = 'Sharing is not available here. The backup was downloaded instead.'; return; }
  const b = buildBackup(app.data), file = new File([b.json], b.name, { type: 'application/json' });
  const data = { title: 'Gigachad Agenda backup' };
  if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file]; else data.text = b.json;
  try {
    await navigator.share(data);
    markExport(); toast('Backup shared.', 'success');
  } catch (err) {
    if (err && err.name === 'AbortError') { toast('Share cancelled.', 'info'); return; }
    downloadBackup();
  }
}
export async function importText(text, size) {
  const r = parseBackup(text, size);
  if (r.error) { app.backupMsg = r.error; return; }
  const ok = await ask({ title: 'Replace current data?', body: `This backup contains ${r.data.routines.length} routines. Your current data will be replaced.`, ok: 'Replace' });
  if (!ok) return;
  app.data = r.data;
  save();
  let ct = 0;
  own(r.data.customTasks, (k, v) => { ct += Object.keys(v).length; });
  app.backupMsg = 'Backup restored.';
  toast(`Backup restored: ${r.data.routines.length} routines, ${ct} custom tasks, ${Object.keys(r.data.notes).length} day notes.`, 'success');
}
export function importFile(f) {
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => importText(String(rd.result), f.size);
  rd.readAsText(f);
}
async function handleShared() {
  const q = location.search;
  if (q.indexOf('shared=') < 0) return;
  history.replaceState(null, '', location.pathname);
  app.tab = 'backup';
  if (q.indexOf('shared=1') < 0 || !window.caches) { app.backupMsg = 'Shared file could not be read.'; return; }
  try {
    const c = await caches.open(SHARE_CACHE), r = await c.match(SHARE_PATH);
    await c.delete(SHARE_PATH);
    const t = r ? await r.text() : '';
    if (t) importText(t, t.length); else app.backupMsg = 'No shared file found.';
  } catch { app.backupMsg = 'Shared file could not be read.'; }
}

/* ---------- backgrounds ---------- */
const bgName = (k) => (k === 'mobile' ? 'Mobile' : 'Desktop');
async function refreshBg(kind) {
  const blob = await bgLoad(kind);
  if (app.bg[kind]) URL.revokeObjectURL(app.bg[kind]);
  app.bg[kind] = blob ? URL.createObjectURL(blob) : null;
}
export async function pickBg(kind, f) {
  if (!f) return;
  if (f.size > 12 * 1024 * 1024) { toast('Image is larger than 12 MB.', 'error'); return; }
  if (!bgFileOK(f)) { toast('Choose an image file.', 'error'); return; }
  try { await bgDecodes(f); } catch { toast('That file is not a readable image.', 'error'); return; }
  try { await bgSave(kind, f); await refreshBg(kind); toast(`${bgName(kind)} background saved.`, 'success'); }
  catch { toast('Could not save the background in this browser.', 'error'); }
}
export async function clearBg(kind) {
  try { await bgDelete(kind); await refreshBg(kind); toast(`${bgName(kind)} background cleared.`, 'info'); }
  catch { toast('Could not clear the background.', 'error'); }
}

/* ---------- lifecycle ---------- */
function refreshToday() {
  const n = startOfToday();
  if (+n !== +app.today) app.today = n;
}

export function init() {
  load();
  loadPrefs();
  app.nudge = nudgeClean((() => { try { return localStorage.getItem(NUDGE_KEY); } catch { return null; } })());
  touchNudge();
  app.vw = window.innerWidth;

  addEventListener('pagehide', () => { clearTimeout(timer); if (dirty) save(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearTimeout(timer); if (dirty) save(); } else refreshToday();
  });
  // Cross-tab sync: adopt changes written by another tab unless we have unsaved edits.
  addEventListener('storage', (e) => {
    if ((e.key !== null && e.key !== KEY) || dirty) return;
    let o = null;
    try { const raw = localStorage.getItem(KEY); o = raw == null ? null : JSON.parse(raw); } catch { return; }
    app.data = isObj(o) ? clean(o) : blank();
  });
  setInterval(refreshToday, 60000);

  app.bg.available = bgAvailable();
  if (app.bg.available) { refreshBg('desktop'); refreshBg('mobile'); }
  handleShared();
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) toast('A new version is ready.', 'info', { label: 'Reload', run: () => location.reload() });
  });
}
