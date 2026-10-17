"use client";
import { toggleSound, useSound } from "../lib/sound";
import { site } from "../content/site";

export default function SoundToggle() {
  const on = useSound();
  return (
    <button
      className="sound-toggle"
      aria-pressed={on}
      aria-label={on ? site.ui.soundOff : site.ui.soundOn}
      onClick={toggleSound}
    >
      <span aria-hidden="true">{on ? "🔊" : "🔇"}</span>
    </button>
  );
}