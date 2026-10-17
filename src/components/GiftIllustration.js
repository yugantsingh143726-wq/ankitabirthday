// Cartoon illustration for the left side of the passcode card
export default function GiftIllustration() {
  return (
    <svg viewBox="0 0 240 240" role="img" aria-label="A gift box with balloons">
      <defs>
        <linearGradient id="gi-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5d86a" />
          <stop offset="1" stopColor="#c9a227" />
        </linearGradient>
        <radialGradient id="gi-b1" cx="0.32" cy="0.28" r="0.8">
          <stop offset="0" stopColor="#ffc4c4" />
          <stop offset="1" stopColor="#ff7a7a" />
        </radialGradient>
        <radialGradient id="gi-b2" cx="0.32" cy="0.28" r="0.8">
          <stop offset="0" stopColor="#f6e9a0" />
          <stop offset="1" stopColor="#d4af37" />
        </radialGradient>
        <radialGradient id="gi-b3" cx="0.32" cy="0.28" r="0.8">
          <stop offset="0" stopColor="#d9cff5" />
          <stop offset="1" stopColor="#9b8fc4" />
        </radialGradient>
      </defs>

      {/* balloon strings */}
      <path d="M70 92 Q 90 140 112 150" fill="none" stroke="#7a6a90" strokeWidth="1.5" />
      <path d="M120 70 Q 118 110 120 138" fill="none" stroke="#7a6a90" strokeWidth="1.5" />
      <path d="M172 90 Q 150 130 130 148" fill="none" stroke="#7a6a90" strokeWidth="1.5" />

      {/* balloons */}
      <ellipse cx="70" cy="66" rx="26" ry="31" fill="url(#gi-b1)" />
      <ellipse cx="120" cy="44" rx="26" ry="31" fill="url(#gi-b2)" />
      <ellipse cx="172" cy="66" rx="26" ry="31" fill="url(#gi-b3)" />

      {/* gift box */}
      <rect x="62" y="160" width="116" height="64" rx="6" fill="url(#gi-gold)" />
      <rect x="54" y="142" width="132" height="24" rx="6" fill="#e6c55a" />
      <rect x="112" y="142" width="16" height="82" fill="#e0457b" />
      <rect x="54" y="148" width="132" height="10" fill="#e0457b" opacity="0.9" />
      {/* bow */}
      <ellipse cx="100" cy="134" rx="20" ry="11" transform="rotate(-18 100 134)" fill="#e0457b" />
      <ellipse cx="140" cy="134" rx="20" ry="11" transform="rotate(18 140 134)" fill="#e0457b" />
      <circle cx="120" cy="138" r="8" fill="#c2336a" />

      {/* confetti rectangles */}
      <rect x="22" y="120" width="8" height="14" fill="#ff9a9a" transform="rotate(25 26 127)" />
      <rect x="206" y="118" width="8" height="14" fill="#7fc8a9" transform="rotate(-20 210 125)" />
      <rect x="30" y="190" width="8" height="14" fill="#9b8fc4" transform="rotate(-30 34 197)" />
      <rect x="200" y="186" width="8" height="14" fill="#f2c9a0" transform="rotate(35 204 193)" />
      <rect x="14" y="60" width="7" height="12" fill="#d4af37" transform="rotate(40 17 66)" />
      <rect x="218" y="64" width="7" height="12" fill="#ff9a9a" transform="rotate(-35 221 70)" />
    </svg>
  );
}