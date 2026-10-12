<script>
  import { onMount } from 'svelte';
  import { dismiss } from '../lib/store.svelte.js';

  let { t } = $props();
  const total = t.act ? 6000 : 3500;
  let left = total, start = Date.now(), tid = 0;
  let hold = $state(false), out = $state(false);

  function kill() {
    if (out) return;
    out = true;
    clearTimeout(tid);
    setTimeout(() => dismiss(t.id), 200);
  }
  function enter() { clearTimeout(tid); left -= Date.now() - start; hold = true; }
  function leave() { start = Date.now(); tid = setTimeout(kill, left); hold = false; }
  function act() { if (out) return; kill(); t.act.run(); }

  onMount(() => { tid = setTimeout(kill, left); return () => clearTimeout(tid); });
</script>

<div class="toast {t.type}" class:out class:hold onmouseenter={enter} onmouseleave={leave} role="presentation">
  <span class="ti">{t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'i'}</span>
  <span class="msg">{t.msg}</span>
  {#if t.act}<button type="button" class="btn sm" onclick={act}>{t.act.label}</button>{/if}
  {#if t.act}<i class="bar" style:animation-duration="{total}ms"></i>{/if}
</div>

<style>
  .toast {
    pointer-events: auto; position: relative; overflow: hidden; display: flex; align-items: center; gap: var(--sp-3);
    max-width: min(440px, 100%); padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md);
    border: 1px solid var(--line-2); background: var(--panel-strong); box-shadow: var(--shadow); font-size: 14px;
    animation: tin .3s var(--ease) both; transition: opacity .2s;
  }
  .toast.out { pointer-events: none; opacity: 0; }
  .ti { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; flex: none; font: 700 12px var(--font-mono); background: var(--surface-3); }
  .success .ti { background: var(--accent); color: var(--on-accent); }
  .error .ti { background: color-mix(in srgb, var(--warn) 25%, transparent); color: var(--warn); }
  .msg { flex: 1; min-width: 0; }
  .btn { color: var(--accent); font-weight: 600; }
  .bar { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; background: var(--accent); opacity: .6; transform-origin: left; animation: tbar linear forwards; }
  .hold .bar { animation-play-state: paused; }
  @keyframes tin { from { opacity: 0; transform: translateY(10px) scale(.97); } }
  @keyframes tbar { to { transform: scaleX(0); } }
</style>
