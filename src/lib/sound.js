import { useSyncExternalStore } from "react";

// Global sound on/off state shared by chime, ringtone, reel and effects
let on = true;
const subs = new Set();

export function isSoundOn() {
  return on;
}
export function setSoundOn(v) {
  on = v;
  subs.forEach((f) => f());
}
export function toggleSound() {
  setSoundOn(!on);
}
function subscribe(f) {
  subs.add(f);
  return () => subs.delete(f);
}
export function useSound() {
  return useSyncExternalStore(subscribe, () => on, () => true);
}

// Short synthesized noise burst (no audio files, no network)
function burst(dur, f0, f1, peak) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const c = new Ctx();
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 0.8;
    f.frequency.setValueAtTime(f0, c.currentTime);
    f.frequency.exponentialRampToValueAtTime(f1, c.currentTime + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(peak, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start();
    setTimeout(() => {
      try {
        c.close();
      } catch (e) {
        // ignore
      }
    }, dur * 1000 + 300);
  } catch (e) {
    // audio not available: ignore
  }
}

export function playFlip() {
  if (on) burst(0.12, 2800, 900, 0.25);
}
export function playBlow() {
  if (on) burst(0.8, 500, 2000, 0.5);
}