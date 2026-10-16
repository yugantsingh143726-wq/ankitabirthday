"use client";
import { useEffect, useState } from "react";
import { site } from "../content/site";

export default function MemoryLoader({ onDone }) {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const L = site.loader;

  useEffect(() => {
    const start = performance.now();
    let raf;
    function tick(now) {
      const p = Math.min((now - start) / L.minDurationMs, 1);
      setCount(Math.round(p * L.finalCount));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setLeaving(true);
        setTimeout(onDone, 1000);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [L.minDurationMs, L.finalCount, onDone]);

  const progress = count / L.finalCount;
  const caption =
    progress >= 1 ? L.captions[2] : progress >= 0.6 ? L.captions[1] : L.captions[0];
  const blur = (1 - progress) * 14;

  return (
    <div className={`loader ${leaving ? "leaving" : ""}`} role="status" aria-live="polite">
      <div className="polaroid-wrap">
        <div className="polaroid">
          <div className="polaroid-photo" style={{ filter: `blur(${blur}px)`, opacity: 0.35 + progress * 0.65 }} />
          <div className="polaroid-strip" />
        </div>
      </div>
      <div className="loader-count">{String(count).padStart(2, "0")}</div>
      <div className="loader-caption">{caption}</div>
    </div>
  );
}