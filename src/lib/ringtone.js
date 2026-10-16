// PLACEHOLDER ringtone: synthesized in the browser (no external files).
// Replace with a self-hosted audio file later if you want a real ringtone.
export function startRingtone() {
  let ctx = null;
  let timer = null;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume();

    const beep = (freq, start, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.02);
      g.gain.setValueAtTime(0.16, t + dur - 0.05);
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.05);
    };

    const ring = () => {
      // two quick double-beeps, then a pause
      [0, 0.25, 0.9, 1.15].forEach((off) => {
        beep(659.25, off, 0.18);
        beep(783.99, off, 0.18);
      });
    };

    ring();
    timer = setInterval(ring, 3000);
  } catch (e) {
    // audio not available: ignore
  }

  return function stop() {
    if (timer) clearInterval(timer);
    try {
      if (ctx) ctx.close();
    } catch (e) {
      // ignore
    }
  };
}