<script>
  import { app } from '../lib/store.svelte.js';
  import Toast from './Toast.svelte';
</script>

<div class="toasts" role="status" aria-live="polite">
  {#each app.toasts as t (t.id)}<Toast {t} />{/each}
</div>

<style>
  .toasts {
    position: fixed; left: 0; right: 0; z-index: 60; display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); padding: 0 var(--sp-3); pointer-events: none;
    bottom: calc(var(--sp-4) + var(--nav-h));
  }
</style>
