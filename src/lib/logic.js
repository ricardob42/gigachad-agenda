// Pure data + date logic. No DOM, no framework: everything here is unit-testable.

export const KEY = 'routine_cal_data_v1';
export const PREFS_KEY = 'gigachad-agenda-prefs-v1';
export const NUDGE_KEY = 'gigachad-agenda-backup-nudge-v1';
export const BG_CACHE = 'gigachad-agenda-backgrounds-v1';
export const SHARE_CACHE = 'gigachad-agenda-share-inbox-v1';
export const SHARE_PATH = '/__gigachad-agenda-share__/pending';
export const BG_MAX = 12 * 1024 * 1024;
export const BACKUP_MAX = 5 * 1024 * 1024;
export const NUDGE_DAYS = 14;
export const DAY_MS = 86400000;

export const ISO = /^\d{4}-\d{2}-\d{2}$/;
export const TM = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const ACC = ['blue', 'emerald', 'amber', 'rose', 'violet', 'cyan'];
export const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MS = MON.map((m) => m.slice(0, 3));
export const DW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// [slug, name, time, weekday]
export const STARTER = [
  ['sun-reflection', 'Weekly Reflection', '09:00', 0], ['sun-academic', 'Academic Prep', '11:00', 0], ['sun-planning', 'Routine Planning', '17:00', 0],
  ['mon-gym', 'Gym — Push', '06:30', 1], ['mon-study', 'Academic Study Block', '09:00', 1], ['mon-coursework', 'Focused Coursework', '14:00', 1],
  ['tue-gym', 'Gym — Upper Body', '06:30', 2], ['tue-study', 'Academic Study Block', '09:00', 2], ['tue-technical', 'Technical Study', '15:00', 2],
  ['wed-gym', 'Gym — Legs', '06:30', 3], ['wed-math', 'Math III', '10:00', 3], ['wed-projects', 'Engineering Projects', '15:00', 3],
  ['thu-gym', 'Gym — Conditioning', '06:30', 4], ['thu-math', 'Math III', '10:00', 4], ['thu-projects', 'Engineering Projects', '15:00', 4],
  ['fri-gym', 'Full-Body Training', '06:30', 5], ['fri-review', 'Academic Review', '10:00', 5], ['fri-planning', 'Weekly Planning', '16:00', 5],
  ['sat-recovery', 'Active Recovery', '09:00', 6], ['sat-web', 'Web Projects', '11:00', 6], ['sat-portfolio', 'Portfolio Development', '15:00', 6],
];

/** Labels for the three task states, used in aria-labels. */
export const STATE_TEXT = { open: 'not done', done: 'done', excused: 'excused, not counted as missed' };

export const THEMES = [
  { id: 'ink', name: 'Ink', color: '#0c0d10', accent: '#d7f25c' },
  { id: 'aurora', name: 'Aurora', color: '#071017', accent: '#5eead4' },
  { id: 'ember', name: 'Ember', color: '#120b0b', accent: '#ff8a5b' },
  { id: 'paper', name: 'Paper', color: '#f3eee4', accent: '#2a6b4f' },
];

/* ---------- dates ---------- */
export const p2 = (n) => (n < 10 ? '0' : '') + n;
export const key = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const parse = (k) => { const a = k.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); };
export const validDate = (k) => typeof k === 'string' && ISO.test(k) && key(parse(k)) === k;
export const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const weekStart = (d) => addD(d, -d.getDay());
export const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const dimM = (y, m) => new Date(y, m + 1, 0).getDate();
export const clampYear = (y) => Math.min(2100, Math.max(1900, y));
export const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export function weekLabel(st) {
  const en = addD(st, 6);
  if (st.getFullYear() !== en.getFullYear()) return `${MS[st.getMonth()]} ${st.getDate()}, ${st.getFullYear()} – ${MS[en.getMonth()]} ${en.getDate()}, ${en.getFullYear()}`;
  if (st.getMonth() !== en.getMonth()) return `${MS[st.getMonth()]} ${st.getDate()} – ${MS[en.getMonth()]} ${en.getDate()}, ${en.getFullYear()}`;
  return `${MON[st.getMonth()]} ${st.getDate()} – ${en.getDate()}, ${en.getFullYear()}`;
}
export const dayLabel = (k) => { const d = parse(k); return `${DW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; };

/* ---------- helpers ---------- */
export const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
export function own(o, f) { Object.keys(o).forEach((k) => { if (k !== '__proto__') f(k, o[k]); }); }
export function cid() {
  const c = globalThis.crypto, p = 'gch-' + Date.now().toString(36) + '-';
  if (c && c.randomUUID) return p + c.randomUUID();
  if (c && c.getRandomValues) return p + Array.prototype.join.call(c.getRandomValues(new Uint32Array(2)), '');
  return p + Math.random().toString(36).slice(2);
}
/** Returns o[k], creating it first. Re-reads after assigning so callers get the reactive proxy, not the raw object. */
export function slot(o, k) { if (!o[k]) o[k] = {}; return o[k]; }
export const blank = () => ({ customTasks: {}, completions: {}, excused: {}, routines: [], notes: {} });
const cleanDays = (a) => { const days = []; (Array.isArray(a) ? a : []).forEach((d) => { if (Number.isInteger(d) && d >= 0 && d <= 6 && !days.includes(d)) days.push(d); }); return days; };

/** Validates and normalises untrusted data (localStorage, imports). */
export function clean(o) {
  const s = blank();
  if (!isObj(o)) return s;
  (Array.isArray(o.routines) ? o.routines : []).forEach((r) => {
    if (!isObj(r) || typeof r.id !== 'string' || !r.id || r.id.length > 80 || typeof r.name !== 'string' || typeof r.time !== 'string' || !TM.test(r.time)) return;
    const name = r.name.trim().slice(0, 120), days = cleanDays(r.days);
    if (!name || !days.length) return;
    const x = { id: r.id, name, time: r.time, days };
    if (ACC.includes(r.accent)) x.accent = r.accent;
    if (r.archived === true) x.archived = true;
    s.routines.push(x);
  });
  if (isObj(o.customTasks)) own(o.customTasks, (k, v) => {
    if (!validDate(k) || !isObj(v)) return;
    own(v, (id, t) => {
      if (id.length > 120 || !isObj(t) || typeof t.title !== 'string' || typeof t.time !== 'string' || !TM.test(t.time)) return;
      const title = t.title.trim().slice(0, 120);
      if (title) slot(s.customTasks, k)[id] = { time: t.time, title };
    });
  });
  if (isObj(o.completions)) own(o.completions, (k, v) => {
    if (!validDate(k) || !isObj(v)) return;
    own(v, (id, b) => { if (b === true && id.length <= 160) slot(s.completions, k)[id] = true; });
  });
  if (isObj(o.excused)) own(o.excused, (k, v) => {
    if (!validDate(k) || !isObj(v)) return;
    own(v, (id, b) => { if (b === true && id.length <= 160) slot(s.excused, k)[id] = true; });
  });
  // A task is either done or excused, never both. Excused wins.
  own(s.excused, (k, v) => own(v, (id) => { if (s.completions[k]) delete s.completions[k][id]; }));
  own(s.completions, (k) => tidyDay(s, k));
  own(s.excused, (k) => tidyDay(s, k));
  if (isObj(o.notes)) own(o.notes, (k, v) => { if (validDate(k) && typeof v === 'string' && v) s.notes[k] = v.slice(0, 500); });
  return s;
}
export const hasMeaningfulData = (s) => s.routines.length > 0 || Object.keys(s.customTasks).length > 0 || Object.keys(s.completions).length > 0 || Object.keys(s.notes).length > 0 || Object.keys(s.excused).length > 0;

/* ---------- routines ---------- */
export const freqLabel = (r) => `${r.days.length} ${r.days.length === 1 ? 'day' : 'days'}/wk`;
export const splitRoutines = (l) => ({ active: l.filter((r) => r.archived !== true), archived: l.filter((r) => r.archived === true) });

export function moveRel(list, id, tid, after) {
  if (id === tid) return list.slice();
  const item = list.find((r) => r.id === id);
  if (!item) return list.slice();
  const rest = list.filter((r) => r.id !== id), ti = rest.findIndex((r) => r.id === tid);
  if (ti < 0) return list.slice();
  rest.splice(after ? ti + 1 : ti, 0, item);
  return rest;
}
export function moveStep(list, id, dir) {
  const act = list.filter((r) => r.archived !== true), i = act.findIndex((r) => r.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= act.length) return { moved: false, list, pos: i + 1, total: act.length };
  return { moved: true, list: moveRel(list, id, act[j].id, dir > 0), pos: j + 1, total: act.length };
}
export function applyEdit(r, p) {
  const name = String(p.name || '').trim().slice(0, 120), days = cleanDays(p.days).sort();
  if (!name || typeof p.time !== 'string' || !TM.test(p.time) || !days.length) return false;
  r.name = name; r.time = p.time; r.days = days;
  if (ACC.includes(p.accent)) r.accent = p.accent; else delete r.accent;
  return true;
}
export function delRoutine(s, id) {
  const idx = s.routines.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const rt = s.routines.splice(idx, 1)[0], pf = `routine:${id}:`;
  return { r: rt, i: idx, co: pluck(s.completions, pf), ex: pluck(s.excused, pf) };
}
export function restoreRoutine(s, sn) {
  s.routines.splice(Math.min(sn.i, s.routines.length), 0, sn.r);
  putBack(s.completions, sn.co);
  putBack(s.excused, sn.ex);
}
/** Moves every mark whose id starts with `pf` out of map `m` and returns them. */
function pluck(m, pf) {
  const out = {};
  own(m, (k, v) => {
    own(v, (cd) => { if (cd.indexOf(pf) === 0) { slot(out, k)[cd] = true; delete v[cd]; } });
    if (!Object.keys(v).length) delete m[k];
  });
  return out;
}
function putBack(m, src) { own(src, (k, v) => own(v, (cd) => { slot(m, k)[cd] = true; })); }
/** Drops routine marks whose routine is not in `keep` (a map of "routine:<id>:" prefixes). */
function dropOrphans(m, keep) {
  own(m, (k, v) => {
    own(v, (id) => { if (id.indexOf('routine:') === 0 && !keep[id.slice(0, id.lastIndexOf(':') + 1)]) delete v[id]; });
    if (!Object.keys(v).length) delete m[k];
  });
}
/** Replaces routines with the starter schedule, pruning marks of routines that no longer exist. */
export function applyStarter(s) {
  const keep = {};
  s.routines = STARTER.map((r) => { keep[`routine:gch-default-${r[0]}:`] = 1; return { id: 'gch-default-' + r[0], name: r[1], time: r[2], days: [r[3]] }; });
  dropOrphans(s.completions, keep);
  dropOrphans(s.excused, keep);
}

/* ---------- task states: open, done, excused ---------- */
export const REST_MAX_DAYS = 120;
export function stateOf(s, k, id) {
  if (s.excused[k] && s.excused[k][id]) return 'excused';
  if (s.completions[k] && s.completions[k][id]) return 'done';
  return 'open';
}
/** Removes empty per-day objects from both maps. */
export function tidyDay(s, k) { dropEmpty(s.completions, k); dropEmpty(s.excused, k); }
/** Tap cycle: open -> done -> excused -> open. Returns the state before the tap. */
export function nextTaskState(s, k, id) {
  const st = stateOf(s, k, id);
  if (st === 'open') slot(s.completions, k)[id] = true;
  else if (st === 'done') { delete s.completions[k][id]; slot(s.excused, k)[id] = true; }
  else delete s.excused[k][id];
  tidyDay(s, k);
  return st;
}
/** Excuses open routine sessions in [from, to] (inclusive). Done sessions are kept.
 *  Returns the marks added, or null when the range is invalid or longer than REST_MAX_DAYS. */
export function restRange(s, from, to) {
  if (!validDate(from) || !validDate(to) || from > to) return null;
  const a = parse(from), span = Math.round((parse(to) - a) / DAY_MS) + 1;
  if (span > REST_MAX_DAYS) return null;
  const added = [];
  for (let i = 0; i < span; i++) {
    const d = addD(a, i), k = key(d);
    s.routines.forEach((r) => {
      if (r.archived || !r.days.includes(d.getDay())) return;
      const id = `routine:${r.id}:${k}`;
      if (stateOf(s, k, id) === 'open') { slot(s.excused, k)[id] = true; added.push([k, id]); }
    });
  }
  return added;
}
/** Reverses restRange. Removes only the marks that restRange added. */
export function undoRest(s, added) {
  added.forEach(([k, id]) => { if (s.excused[k]) { delete s.excused[k][id]; tidyDay(s, k); } });
}

/* ---------- tasks ---------- */
export function autoTag(title, w) {
  const t = String(title);
  if (/math/i.test(t)) return 'math';
  if (/study|academic|coursework|review|prep|learn|read|lecture|exam/i.test(t)) return 'study';
  return w === 0 || w === 6 ? 'weekend' : '';
}
export function tasksFor(s, d) {
  const k = key(d), w = d.getDay(), c = s.customTasks[k] || {}, a = [];
  s.routines.forEach((r) => { if (!r.archived && r.days.includes(w)) a.push({ id: `routine:${r.id}:${k}`, time: r.time, title: r.name, custom: false, acc: r.accent, tag: autoTag(r.name, w) }); });
  Object.keys(c).forEach((id) => a.push({ id, time: c[id].time, title: c[id].title, custom: true, tag: autoTag(c[id].title, w) }));
  return a.sort((x, y) => (x.time < y.time ? -1 : x.time > y.time ? 1 : 0));
}
export function dayStat(s, d) {
  const k = key(d), c = s.completions[k] || {}, e = s.excused[k] || {};
  const t = tasksFor(s, d).map((x) => ({ ...x, ex: !!e[x.id], state: e[x.id] ? 'excused' : c[x.id] ? 'done' : 'open' }));
  const ex = t.filter((x) => x.ex).length;
  return { t, c, e, ex, n: t.filter((x) => x.state === 'done').length, active: t.length - ex };
}
/** Done / total for a day. Excused tasks are removed from the total. */
export function dayRatio(s, d) {
  const k = key(d), c = s.completions[k] || {}, e = s.excused[k] || {}, custom = Object.keys(s.customTasks[k] || {}), w = d.getDay();
  let n = 0, t = 0;
  const one = (id) => { if (e[id]) return; t++; if (c[id]) n++; };
  s.routines.forEach((r) => { if (!r.archived && r.days.includes(w)) one(`routine:${r.id}:${k}`); });
  custom.forEach((id) => one(id));
  return { n, t };
}
const dropEmpty = (o, k) => { if (o[k] && !Object.keys(o[k]).length) delete o[k]; };
export function moveTask(s, a, id, b) {
  if (a === b || !s.customTasks[a] || !s.customTasks[a][id]) return false;
  const t = s.customTasks[a][id], st = stateOf(s, a, id);
  delete s.customTasks[a][id]; dropEmpty(s.customTasks, a);
  if (s.completions[a]) delete s.completions[a][id];
  if (s.excused[a]) delete s.excused[a][id];
  tidyDay(s, a);
  slot(s.customTasks, b)[id] = t;
  if (st === 'done') slot(s.completions, b)[id] = true;
  if (st === 'excused') slot(s.excused, b)[id] = true;
  return true;
}
export function copyDay(s, a, b, gen) {
  const src = s.customTasks[a] || {}, added = [];
  let skipped = 0;
  Object.keys(src).forEach((id) => {
    const t = src[id], dst = s.customTasks[b] || {};
    if (Object.keys(dst).some((i) => dst[i].time === t.time && dst[i].title === t.title)) { skipped++; return; }
    const n = gen();
    slot(s.customTasks, b)[n] = { time: t.time, title: t.title };
    added.push(n);
  });
  return { added, skipped };
}
export function removeTask(s, k, id) {
  delete s.customTasks[k][id]; dropEmpty(s.customTasks, k);
  if (s.completions[k]) delete s.completions[k][id];
  if (s.excused[k]) delete s.excused[k][id];
  tidyDay(s, k);
}

/* ---------- stats ---------- */
export function streaks(s, today) {
  let cur = 0, best = 0, run = 0, i, r;
  for (i = 0; i < 1000; i++) {
    r = dayRatio(s, addD(today, -i));
    if (r.t === 0) continue;
    if (r.n === r.t) cur++; else if (i === 0) continue; else break;
  }
  for (i = 364; i >= 0; i--) {
    r = dayRatio(s, addD(today, -i));
    if (r.t === 0) continue;
    if (r.n === r.t) { run++; if (run > best) best = run; } else if (i === 0) continue; else run = 0;
  }
  return { cur, best };
}
export function heatLevel(n, t) { if (!t) return -1; if (!n) return 0; const q = n / t; return q < 0.34 ? 1 : q < 0.67 ? 2 : q < 1 ? 3 : 4; }
export function monthTotals(s, y, m) {
  let n = 0, t = 0;
  for (let i = 1; i <= dimM(y, m); i++) { const r = dayRatio(s, new Date(y, m, i)); n += r.n; t += r.t; }
  return { n, t };
}
export const allTime = (s) => Object.keys(s.completions).reduce((c, k) => c + Object.keys(s.completions[k]).length, 0);
export function activeLoad(s) {
  let active = 0, week = 0, archived = 0;
  s.routines.forEach((r) => { if (r.archived === true) archived++; else { active++; week += r.days.length; } });
  return { active, week, archived };
}
export function breakdown(s, today) {
  const rows = s.routines.filter((r) => r.archived !== true).map((r) => {
    const pf = `routine:${r.id}:`;
    let done = 0, exp = 0, all = 0;
    for (let i = 0; i < 30; i++) {
      const d = addD(today, -i), k = key(d);
      if (r.days.includes(d.getDay()) && !(s.excused[k] && s.excused[k][pf + k])) { exp++; if (s.completions[k] && s.completions[k][pf + k]) done++; }
    }
    Object.keys(s.completions).forEach((k) => Object.keys(s.completions[k]).forEach((id) => { if (id.indexOf(pf) === 0) all++; }));
    return { r, done, exp, all, pct: exp ? Math.round((done / exp) * 100) : 0 };
  });
  return rows.sort((a, b) => b.done - a.done || b.all - a.all);
}

/* ---------- focus timer ---------- */
export const fmtMMSS = (ms) => { const q = Math.max(0, Math.ceil(ms / 1000)); return p2(Math.floor(q / 60)) + ':' + p2(q % 60); };
export const fRem = (f, now) => (f.status === 'running' ? Math.max(0, f.endAt - now) : f.left);
export function fStart(f, now) { if (f.status === 'running') return f; if (f.status === 'done' || f.left <= 0) f.left = f.dur * 60000; f.status = 'running'; f.endAt = now + f.left; return f; }
export function fPause(f, now) { if (f.status !== 'running') return f; f.left = Math.max(0, f.endAt - now); f.status = 'paused'; return f; }
export function fReset(f, dur) { f.dur = dur; f.left = dur * 60000; f.status = 'idle'; f.endAt = 0; return f; }
export function fTick(f, now) { if (f.status === 'running' && now >= f.endAt) { f.status = 'done'; f.left = 0; return true; } return false; }

/* ---------- command palette ---------- */
export function fuzzy(q, t) {
  q = q.toLowerCase(); t = t.toLowerCase();
  let qi = 0, sc = 0, prev = -2;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t.charAt(i) === q.charAt(qi)) {
      sc += 1;
      if (prev === i - 1) sc += 2;
      if (i === 0 || ' -·/'.indexOf(t.charAt(i - 1)) >= 0) sc += 3;
      prev = i; qi++;
    }
  }
  return qi === q.length ? sc : -1;
}
export function cmdScore(q, c) {
  const a = fuzzy(q, c.label || ''), b = fuzzy(q, c.kw || ''), h = fuzzy(q, c.hint || '');
  let best = -1;
  if (a >= 0) best = Math.max(best, a * 2);
  if (b >= 0) best = Math.max(best, b);
  if (h >= 0) best = Math.max(best, h * 0.8);
  return best;
}
export function rankCmds(q, list) {
  q = String(q).trim();
  if (!q) return list.slice();
  return list.map((c, i) => ({ c, i, s: cmdScore(q, c) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.c);
}
const yOK = (y) => y >= 1900 && y <= 2100;
export function parseDateQuery(q, ry, rm) {
  q = String(q).trim().toLowerCase();
  const out = [];
  let m;
  if (!q) return out;
  if ((m = /^(\d{4})$/.exec(q))) { if (yOK(+m[1])) out.push({ kind: 'month', y: +m[1], m: rm }); return out; }
  if ((m = /^(\d{4})[-/ ](\d{1,2})$/.exec(q))) { const y = +m[1], mo = +m[2]; if (yOK(y) && mo >= 1 && mo <= 12) out.push({ kind: 'month', y, m: mo - 1 }); return out; }
  if ((m = /^(\d{4})[-/ ](\d{1,2})[-/ ](\d{1,2})$/.exec(q))) { const y = +m[1], mo = +m[2], d = +m[3]; if (yOK(y) && mo >= 1 && mo <= 12 && d >= 1 && d <= dimM(y, mo - 1)) out.push({ kind: 'day', y, m: mo - 1, d }); return out; }
  if ((m = /^([a-z]{3,})(?:[ \-/.]+(\d{1,4}))?(?:[ \-/.]+(\d{1,4}))?$/.exec(q))) {
    const name = m[1], a = m[2], b = m[3];
    MON.forEach((n, i) => {
      if (n.toLowerCase().indexOf(name) !== 0) return;
      if (a === undefined) { out.push({ kind: 'month', y: ry, m: i }); return; }
      if (b === undefined) {
        const v = +a;
        if (a.length <= 2 && v >= 1 && v <= dimM(ry, i)) out.push({ kind: 'day', y: ry, m: i, d: v });
        else if (a.length === 4 && yOK(v)) out.push({ kind: 'month', y: v, m: i });
        return;
      }
      const dd = +a, yy = +b;
      if (a.length <= 2 && b.length === 4 && yOK(yy) && dd >= 1 && dd <= dimM(yy, i)) out.push({ kind: 'day', y: yy, m: i, d: dd });
    });
  }
  return out;
}
/** "+ 14:30 Dentist" -> {time:'14:30', title:'Dentist'}; time optional (defaults 09:00). */
export function parseQuickAdd(q) {
  const m = /^\+\s*(?:(\d{1,2})[:.](\d{2})\s+)?(.+)$/.exec(String(q).trim());
  if (!m) return null;
  const time = m[1] === undefined ? '09:00' : `${p2(+m[1])}:${m[2]}`, title = m[3].trim().slice(0, 120);
  return TM.test(time) && title ? { time, title } : null;
}
/** Searches custom task titles and day notes, most recent first. */
export function searchEntries(s, q, limit = 8) {
  q = String(q).trim().toLowerCase();
  if (q.length < 2) return [];
  const out = [];
  Object.keys(s.customTasks).forEach((k) => Object.keys(s.customTasks[k]).forEach((id) => {
    const t = s.customTasks[k][id];
    if (t.title.toLowerCase().includes(q)) out.push({ kind: 'task', k, text: t.title, time: t.time });
  }));
  Object.keys(s.notes).forEach((k) => { if (s.notes[k].toLowerCase().includes(q)) out.push({ kind: 'note', k, text: s.notes[k].replace(/\s+/g, ' ').slice(0, 70) }); });
  return out.sort((a, b) => (a.k < b.k ? 1 : a.k > b.k ? -1 : 0)).slice(0, limit);
}

/* ---------- backups, nudge, misc ---------- */
export function buildBackup(s, now = new Date()) {
  const o = { format: 'gigachad-agenda-backup', version: 1, app: 'Gigachad Agenda', storageKey: KEY, exportedAt: now.toISOString(), routines: s.routines, customTasks: s.customTasks, completions: s.completions, excused: s.excused, notes: s.notes };
  return { json: JSON.stringify(o, null, 2), name: `gigachad-agenda-backup-${key(now)}.json` };
}
/** Returns {error} or {data} (already cleaned). */
export function parseBackup(text, size) {
  if (size > BACKUP_MAX) return { error: 'File exceeds 5 MB.' };
  let o;
  try { o = JSON.parse(text); } catch { return { error: 'Not valid JSON.' }; }
  if (!isObj(o) || o.format !== 'gigachad-agenda-backup' || o.version !== 1 || o.storageKey !== KEY || !Array.isArray(o.routines) || !isObj(o.customTasks) || !isObj(o.completions) || (o.notes !== undefined && !isObj(o.notes)) || (o.excused !== undefined && !isObj(o.excused))) return { error: 'Invalid backup file.' };
  return { data: clean(o) };
}
export function nudgeClean(raw) {
  const r = { firstSeen: null, lastExport: null, lastDismiss: null };
  let o = null;
  try { o = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { /* ignore */ }
  if (!isObj(o)) return r;
  ['firstSeen', 'lastExport', 'lastDismiss'].forEach((k) => { const v = o[k]; if (typeof v === 'number' && isFinite(v) && v > 0) r[k] = v; });
  return r;
}
export function nudgeDue(n, now, has) {
  const ref = Math.max(n.lastExport || 0, n.lastDismiss || 0) || n.firstSeen || 0;
  return !!has && !!ref && now - ref >= NUDGE_DAYS * DAY_MS;
}
export function nudgeText(n, now) {
  let t;
  if (n.lastExport) { const d = Math.max(0, Math.floor((now - n.lastExport) / DAY_MS)); t = `Your last backup was ${d} day${d === 1 ? '' : 's'} ago.`; } else t = 'You have not exported a backup yet.';
  return t + ' Download a copy so your routines and history stay safe.';
}
export const bgFileOK = (f) => !!f && typeof f.size === 'number' && f.size > 0 && f.size <= BG_MAX && (typeof f.type !== 'string' || f.type === '' || f.type.indexOf('image/') === 0);
export const swipeDir = (dx, dy) => (Math.abs(dx) > 60 && Math.abs(dy) < 50 ? (dx < 0 ? 1 : -1) : 0);
