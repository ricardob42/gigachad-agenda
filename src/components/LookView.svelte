<script>
  import Icon from './Icon.svelte';
  import { app, setTheme, setDim, pickBg, clearBg } from '../lib/store.svelte.js';
  import { THEMES } from '../lib/logic.js';

  const KINDS = [['desktop', 'Desktop', 'Screens wider than 700px.'], ['mobile', 'Mobile', 'Screens 700px wide or narrower.']];
  const hasBg = $derived(!!(app.bg.desktop || app.bg.mobile));
</script>

<section class="view" id="view-look" role="tabpanel" aria-labelledby="t-look">
  <div class="card">
    <h2>Palette</h2>
    <div class="themes" role="radiogroup" aria-label="Color palette">
      {#each THEMES as t}
        <button type="button" role="radio" class="theme" aria-checked={app.prefs.theme === t.id} onclick={() => setTheme(t.id)}>
          <span class="chipv" style:background={t.color}><i style:background={t.accent}></i><i class="b" style:background={t.accent}></i></span>
          <b>{t.name}</b>
        </button>
      {/each}
    </div>
  </div>

  <div class="bgcards">
    {#each KINDS as [kind, label, hint]}
      <div class="card">
        <h2>{label} background</h2>
        <p class="empty">{hint}</p>
        <div class="prev {kind}" style:background-image={app.bg[kind] ? `url("${app.bg[kind]}")` : null}>{#if !app.bg[kind]}No image set{/if}</div>
        <div class="f">
          <label class="btn pri pick" class:disabled={!app.bg.available}>
            Choose image
            <input type="file" accept="image/*" disabled={!app.bg.available} onchange={(e) => { const f = e.currentTarget.files?.[0]; e.currentTarget.value = ''; pickBg(kind, f); }} />
          </label>
          <button type="button" class="btn" disabled={!app.bg[kind] || !app.bg.available} onclick={() => clearBg(kind)}>Clear</button>
        </div>
      </div>
    {/each}
  </div>

  <div class="card">
    <h2>Image dimming</h2>
    <div class="f dim">
      <input type="range" min="0" max="60" step="2" value={app.prefs.dim} disabled={!hasBg} aria-label="Background image opacity" oninput={(e) => setDim(+e.currentTarget.value)} />
      <span class="mono">{app.prefs.dim}%</span>
    </div>
    <p class="empty">{hasBg ? 'How strongly the background image shows through.' : 'Choose a background image to adjust this.'}</p>
  </div>

  {#if !app.bg.available}<p class="empty warn" role="status">Cache Storage is unavailable in this browser. Backgrounds cannot be saved here, but the app keeps working.</p>{/if}
  <p class="empty lock"><Icon name="lock" size={16} />Stored locally in your browser only — never uploaded to any server.</p>
</section>

<style>
  .themes { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sp-3); }
  .theme { display: grid; gap: var(--sp-2); padding: var(--sp-2); border-radius: var(--r-md); border: 1px solid var(--line); background: var(--surface); text-align: left; transition: border-color .2s, transform .2s var(--ease); }
  .theme:hover { transform: translateY(-2px); }
  .theme[aria-checked='true'] { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent); }
  .theme b { font: 600 14px var(--font-display); padding: 0 var(--sp-1) var(--sp-1); }
  .chipv { height: 64px; border-radius: var(--r-sm); border: 1px solid var(--line-2); display: flex; align-items: flex-end; gap: var(--sp-2); padding: var(--sp-2); }
  .chipv i { width: 26px; height: 8px; border-radius: 4px; } .chipv i.b { width: 14px; opacity: .5; }
  .bgcards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-4); }
  .bgcards .card { margin-top: var(--sp-4); }
  .prev { aspect-ratio: 16 / 9; margin: var(--sp-3) 0; border-radius: var(--r-md); border: 1px solid var(--line); background: var(--surface) center / cover no-repeat; display: grid; place-items: center; color: var(--tx2); font-size: 13px; }
  .prev.mobile { aspect-ratio: 9 / 16; max-height: 320px; margin-inline: auto; }
  .pick { position: relative; display: inline-flex; align-items: center; overflow: hidden; }
  .pick input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .pick.disabled { opacity: .45; } .pick.disabled input { cursor: not-allowed; }
  .pick:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
  .dim { gap: var(--sp-3); } .dim input { flex: 1; min-width: 160px; accent-color: var(--accent); }
  .lock { display: flex; gap: var(--sp-2); align-items: center; margin-top: var(--sp-4); }
  .warn { color: var(--warn); margin-top: var(--sp-4); }
  @media (max-width: 700px) { .bgcards { grid-template-columns: 1fr; } .themes { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
