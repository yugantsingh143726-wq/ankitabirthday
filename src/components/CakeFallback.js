"use client";
import { site } from "../content/site";

const L = site.letter;
const COLORS = ["#d4af37", "#f6ecd6", "#ff8a8a", "#6b5a8e", "#7fc8a9", "#f2c9a0"];

// 2D cake, candles, confetti and letter (used when WebGL is unavailable)
export default function CakeFallback({ phase, typed, done }) {
  const out = phase !== "wish";
  const n = site.candles.count;
  return (
    <div className="cake-fb">
      {phase !== "letter" && (
        <div className="fb-cake" role="img" aria-label="Birthday cake with candles">
          <div className="fb-candles">
            {Array.from({ length: n }, (_, i) => (
              <span
                key={i}
                className={`fb-flame ${out ? "out" : ""}`}
                style={{ transitionDelay: `${i * 0.04}s` }}
              />
            ))}
          </div>
          <div className="fb-tier t2" />
          <div className="fb-tier t1" />
          <div className="fb-plate" />
        </div>
      )}

      {out && (
        <div className="fb-confetti" aria-hidden="true">
          {Array.from({ length: 40 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 53) % 100}%`,
                animationDelay: `${(i % 10) * 0.15}s`,
                background: COLORS[i % COLORS.length],
              }}
            />
          ))}
        </div>
      )}

      {phase === "letter" && (
        <div className="letter-card fb-letter" aria-hidden="true">
          <h2>{L.title}</h2>
          <p className="letter-text">
            {L.text.slice(0, typed)}
            {!done && <span className="caret">|</span>}
          </p>
          {done && <p className="letter-sign">{L.signoff}</p>}
        </div>
      )}
    </div>
  );
}