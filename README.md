# Gigachad Agenda

Local-first routine calendar PWA. Month and week views, recurring routines, per-day tasks and notes, focus timer, streak stats, command palette, backups, custom backgrounds. Everything stays in the browser; it works offline.

Built with **Svelte 5 + Vite** (plain SPA, no SvelteKit). Deploys to Vercel as a static site.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/
npm run preview    # serves dist/ (the service worker is active only in the production build)
```

## Deploy to Vercel

Import the repository. Vercel detects Vite; no settings to change (build `vite build`, output `dist`). Headers are in `vercel.json`.

## Structure

```
public/            manifest, icons, sw.js (stamped at build with the asset list)
src/lib/logic.js   pure date/data logic (validation, streaks, search, backups)
src/lib/store.svelte.js   reactive state + every action that changes data
src/lib/focus.svelte.js   focus timer
src/components/    one file per view/dialog
src/app.css        design tokens, four palettes, shared primitives
vite.config.js     includes the small plugin that builds the SW precache list
```

## Data compatibility

Storage keys, backup format (`version: 1`), background cache and share-target are unchanged from v20. Deploying over an existing install keeps routines, history, notes, backgrounds and old backup files.

## Changes since v20

- Svelte 5 components replace the 737-line `index.html`; state is reactive instead of redrawn by hand.
- New typography (Fraunces, Bricolage Grotesque, JetBrains Mono), self-hosted and precached.
- Four palettes (Ink, Aurora, Ember, Paper) in a new **Look** tab, plus background dimming. Palettes are CSS variables only.
- Mobile: bottom tab bar, bottom-sheet day dialog.
- Streak runs are now drawn on the calendar; the legend was already promising it.
- Command palette: `+ 14:30 Dentist` adds a task to today; typing searches custom tasks and notes.
- Progress bar per day in the week view; heatmap shows 26 weeks on wide screens.
- In-app confirm dialog replaces `confirm()`; "today" rolls over at midnight without a reload.
- Unreadable stored data is copied to `routine_cal_data_v1_corrupt` before being reset, instead of overwritten.
- Service worker precaches hashed assets and shows a "new version ready" toast.
