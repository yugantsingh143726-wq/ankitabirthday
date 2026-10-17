import { isSoundOn } from "./sound";

export function playChime() {
  if (!isSoundOn()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      const t = now + i * 0.12;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 1.7);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch (e) {
    // audio not available: ignore
  }
}