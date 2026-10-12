const FOCUSABLE = 'button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[href]';

/** Svelte action for dialogs: focuses inside, traps Tab, restores focus on close. */
export function modal(node, opts = {}) {
  const prev = document.activeElement;
  const items = () => [...node.querySelectorAll(FOCUSABLE)].filter((e) => e.offsetParent !== null);
  function onKey(e) {
    if (e.key !== 'Tab') return;
    const f = items();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  node.addEventListener('keydown', onKey);
  ((opts.initial && node.querySelector(opts.initial)) || items()[0])?.focus();
  return {
    destroy() {
      node.removeEventListener('keydown', onKey);
      if (prev && prev.isConnected && prev !== document.body) prev.focus();
    },
  };
}
