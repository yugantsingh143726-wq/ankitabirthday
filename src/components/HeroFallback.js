"use client";
import { site } from "../content/site";
import PhotoImg from "./PhotoImg";

const COUNT = site.hero.photoCount;
const rot = (i) => ((i * 37) % 11) - 5; // fixed tilt between -5 and +5 degrees

// 2D version of the hero + gallery (used when WebGL is unavailable)
export default function HeroFallback({ sel, ignited, onSelect }) {
  return (
    <div
      className="fb-hero"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      {ignited && (
        <div className="fb-gold" aria-hidden="true">
          {site.candles.count}
        </div>
      )}
      <div className={`fb-grid ${sel !== null ? "dim" : ""}`}>
        {Array.from({ length: COUNT }, (_, i) => (
          <button
            key={i}
            className={`fb-card ${sel === i ? "sel" : ""}`}
            style={{ "--r": rot(i) + "deg" }}
            tabIndex={ignited ? 0 : -1}
            aria-label={`Photo ${i + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              if (ignited) onSelect(i);
            }}
          >
            <PhotoImg index={i} alt={`Memory ${i + 1}`} />
          </button>
        ))}
      </div>
    </div>
  );
}