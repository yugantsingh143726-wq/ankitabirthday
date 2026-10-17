"use client";

// Pastel party backdrop for the opening screens only (passcode + YES/NO).
// Pure CSS: soft blurred colour washes, bunting, bobbing balloons, and a few
// slow confetti rectangles (plain rectangles only, no stars/hearts/dust).
const BALLOONS = [
  { left: "4%", top: "26%", c1: "#ffb3b3", c2: "#ff7a7a", d: "0s" },
  { left: "11%", top: "52%", c1: "#f3dd8a", c2: "#d4af37", d: "1.2s" },
  { left: "88%", top: "24%", c1: "#c9bdf0", c2: "#9b8fc4", d: "0.6s" },
  { left: "93%", top: "50%", c1: "#b9e3d2", c2: "#6fbf9f", d: "1.8s" },
  { left: "80%", top: "62%", c1: "#ffd0b0", c2: "#f0a070", d: "2.4s" },
];
const COLORS = ["#d4af37", "#ff9a9a", "#9b8fc4", "#7fc8a9", "#f2c9a0", "#ffffff"];
const FLAGS = ["#ff9a9a", "#f3dd8a", "#c9bdf0", "#b9e3d2", "#ffd0b0"];

export default function OpeningBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg className="bd-bunting" viewBox="0 0 1000 90" preserveAspectRatio="none">
        <path d="M0 6 Q 500 70 1000 6" fill="none" stroke="#8a6a14" strokeWidth="2" />
        {Array.from({ length: 16 }, (_, i) => {
          const x = 30 + i * 62;
          const t = (x / 1000) * 2 - 1; // -1..1
          const y = 6 + (1 - t * t) * 32; // follow the curve
          return (
            <polygon
              key={i}
              points={`${x - 20},${y} ${x + 20},${y} ${x},${y + 42}`}
              fill={FLAGS[i % FLAGS.length]}
              opacity="0.95"
            />
          );
        })}
      </svg>

      {BALLOONS.map((b, i) => (
        <div
          key={i}
          className="bd-balloon"
          style={{
            left: b.left,
            top: b.top,
            animationDelay: b.d,
            background: `radial-gradient(circle at 32% 28%, ${b.c1}, ${b.c2})`,
          }}
        />
      ))}

      <div className="bd-confetti">
        {Array.from({ length: 22 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 47) % 100}%`,
              background: COLORS[i % COLORS.length],
              animationDuration: `${16 + (i % 7) * 2.5}s`,
              animationDelay: `-${(i * 3.1) % 18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}