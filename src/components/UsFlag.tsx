// Official proportions (hoist 1 : fly 1.9), drawn at a hoist of 100. Inline
// SVG rather than the 🇺🇸 emoji, which Windows renders as the letters "US".
const FLY = 190;
const HOIST = 100;
const STRIPE = HOIST / 13;
const CANTON_W = FLY * 0.4;
const CANTON_H = STRIPE * 7;
const STAR_R = 3.08;

// 50 stars in 9 staggered rows (6 and 5 across), all merged into one path.
const STARS_PATH = (() => {
  const inner = STAR_R * 0.382;
  const star = (cx: number, cy: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 === 0 ? STAR_R : inner;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      return `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
    }).join("") + "Z";

  let d = "";
  for (let row = 1; row <= 9; row++) {
    for (let col = row % 2 === 1 ? 1 : 2; col <= 11; col += 2) {
      d += star((col * CANTON_W) / 12, (row * CANTON_H) / 10);
    }
  }
  return d;
})();

export default function UsFlag({
  className = "h-4 w-auto",
  label,
}: {
  className?: string;
  /** Accessible name; omit when adjacent text already says "United States". */
  label?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${FLY} ${HOIST}`}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect width={FLY} height={HOIST} fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={i * STRIPE} width={FLY} height={STRIPE} fill="#FFFFFF" />
      ))}
      <rect width={CANTON_W} height={CANTON_H} fill="#3C3B6E" />
      <path d={STARS_PATH} fill="#FFFFFF" />
    </svg>
  );
}
