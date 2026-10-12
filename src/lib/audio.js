let ctx = null;

function audio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

/** Call from a user gesture so the chime is allowed to play later. */
export const primeAudio = audio;

export function chime() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  [[880, 0], [1175, 0.22]].forEach(([freq, delay]) => {
    const o = c.createOscillator(), g = c.createGain(), a = t + delay;
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, a);
    g.gain.exponentialRampToValueAtTime(0.18, a + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, a + 0.4);
    o.connect(g); g.connect(c.destination);
    o.start(a); o.stop(a + 0.45);
  });
}
