<script>
  import { fade } from 'svelte/transition';
  import { app, answer } from '../lib/store.svelte.js';
  import { modal } from '../lib/actions.js';
</script>

<div class="ov" transition:fade|global={{ duration: 140 }} onmousedown={(e) => { if (e.target === e.currentTarget) answer(false); }} role="presentation">
  <div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="cf-t" aria-describedby="cf-b" use:modal={{ initial: '.pri' }}>
    <h2 id="cf-t">{app.confirm.title}</h2>
    <p id="cf-b" class="empty">{app.confirm.body}</p>
    <div class="f acts">
      <button type="button" class="btn" onclick={() => answer(false)}>Cancel</button>
      <button type="button" class="btn pri" onclick={() => answer(true)}>{app.confirm.ok || 'Confirm'}</button>
    </div>
  </div>
</div>

<style>
  .ov { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: var(--sp-4); background: var(--scrim); }
  .dlg { width: 100%; max-width: 400px; padding: var(--sp-5); border-radius: var(--r-xl); border: 1px solid var(--line-2); background: var(--panel-strong); box-shadow: var(--shadow); animation: up .3s var(--ease); }
  h2 { font-size: 22px; margin-bottom: var(--sp-2); }
  .acts { justify-content: flex-end; margin-top: var(--sp-5); }
  @keyframes up { from { opacity: 0; transform: translateY(12px) scale(.98); } }
</style>
