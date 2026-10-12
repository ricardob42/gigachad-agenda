import { app, toast, markDone, onCloseFocus } from './store.svelte.js';
import { fStart, fPause, fReset, fTick, tasksFor, parse } from './logic.js';
import { chime, primeAudio } from './audio.js';

let timer = 0;
const stop = () => { clearInterval(timer); timer = 0; };

function tick() {
  const f = app.focus;
  if (!f) { stop(); return; }
  app.now = Date.now();
  if (fTick(f, app.now)) { stop(); chime(); toast('Focus session complete.', 'success'); }
  if (f.status !== 'running') stop();
}
document.addEventListener('visibilitychange', () => { if (app.focus && app.focus.status === 'running') tick(); });

export function openFocus(k, id, title) {
  const f = app.focus;
  if (f && (f.k !== k || f.id !== id) && f.status !== 'idle') {
    app.focusOpen = true;
    toast('A focus session is already active. Reset or finish it first.', 'info');
    return;
  }
  if (!f || f.k !== k || f.id !== id) app.focus = fReset({ k, id, title, status: 'idle', endAt: 0, left: 0, dur: app.focusDur }, app.focusDur);
  app.now = Date.now();
  app.focusOpen = true;
}
export function showFocus() { app.now = Date.now(); app.focusOpen = true; }
export function closeFocus() {
  if (app.focus && app.focus.status !== 'running') { app.focus = null; stop(); }
  app.focusOpen = false;
}
onCloseFocus(closeFocus);

export function toggleFocus() {
  const f = app.focus;
  if (!f) return;
  const now = Date.now();
  primeAudio();
  if (f.status === 'running') { fPause(f, now); stop(); }
  else { fStart(f, now); if (!timer) timer = setInterval(tick, 250); }
  app.now = now;
}
export function resetFocus() {
  if (!app.focus) return;
  stop(); fReset(app.focus, app.focus.dur); app.now = Date.now();
}
export function setFocusDuration(m) {
  app.focusDur = m;
  if (app.focus) { stop(); fReset(app.focus, m); app.now = Date.now(); }
}
export const focusTaskExists = () => !!app.focus && tasksFor(app.data, parse(app.focus.k)).some((t) => t.id === app.focus.id);
export const focusTaskDone = () => !!(app.focus && app.data.completions[app.focus.k]?.[app.focus.id]);
export function completeFocusTask() {
  const f = app.focus;
  if (!f || !focusTaskExists() || focusTaskDone()) return;
  markDone(f.k, f.id);
  toast('Task marked complete.', 'success');
}
