<script>
  import Icon from './Icon.svelte';
  import { app, backupDue, snoozeNudge, downloadBackup, shareBackup, importFile } from '../lib/store.svelte.js';
  import { nudgeText } from '../lib/logic.js';

  const due = $derived(backupDue());
</script>

<section class="view" id="view-backup" role="tabpanel" aria-labelledby="t-backup">
  {#if due}
    <div class="nudge" role="status">
      <Icon name="clock" size={22} />
      <div class="nt"><b>Time for a backup?</b><span>{nudgeText(app.nudge, Date.now())}</span></div>
      <div class="f">
        <button type="button" class="btn pri sm" onclick={downloadBackup}>Export now</button>
        <button type="button" class="btn sm" onclick={snoozeNudge}>Dismiss</button>
      </div>
    </div>
  {/if}

  <div class="card">
    <h2>Export</h2>
    <ul class="blist"><li>Routines</li><li>Custom tasks</li><li>Completion history</li><li>Day notes</li></ul>
    <div class="f">
      <button type="button" class="btn pri" onclick={downloadBackup}>Download backup</button>
      <button type="button" class="btn" onclick={shareBackup}>Share backup</button>
    </div>
  </div>

  <div class="card">
    <h2>Import</h2>
    <p class="empty">Replaces current data after confirmation. Maximum 5 MB.</p>
    <div class="f imp">
      <label class="btn pick">
        Choose file
        <input type="file" id="backup-file" accept="application/json,.json" onchange={(e) => { const f = e.currentTarget.files?.[0]; e.currentTarget.value = ''; importFile(f); }} />
      </label>
      <span class="empty" role="status">{app.backupMsg}</span>
    </div>
  </div>
</section>

<style>
  .nudge { display: flex; align-items: center; gap: var(--sp-3); flex-wrap: wrap; margin-top: var(--sp-4); padding: var(--sp-4); border-radius: var(--r-lg); border: 1px solid color-mix(in srgb, var(--warn) 55%, transparent); background: color-mix(in srgb, var(--warn) 9%, var(--panel)); }
  .nudge :global(svg) { color: var(--warn); flex: none; }
  .nt { flex: 1; min-width: 200px; } .nt b { display: block; font-weight: 600; } .nt span { color: var(--tx2); font-size: 14px; }
  .blist { margin: var(--sp-2) 0 var(--sp-3); padding-left: var(--sp-5); color: var(--tx2); }
  .imp { margin-top: var(--sp-3); }
  .pick { position: relative; display: inline-flex; align-items: center; overflow: hidden; }
  .pick input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .pick:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
