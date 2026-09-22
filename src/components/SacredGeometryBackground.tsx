import { useId } from "react";

// Flower of Life: circles of radius R centred on a triangular lattice with
// spacing R. The lattice repeats every R horizontally and R·√3 vertically, so
// one tile of that size, drawn with every circle that can reach into it,
// repeats seamlessly.
const R = 38;
const TILE_W = R;
const TILE_H = R * Math.sqrt(3);
const ROW_H = TILE_H / 2;

const CIRCLES: [number, number][] = [];
for (let row = -2; row <= 4; row++) {
  for (let col = -2; col <= 2; col++) {
    CIRCLES.push([col * R + (row % 2 ? R / 2 : 0), row * ROW_H]);
  }
}

// Fade the pattern out behind the form so it never competes with text.
const FADE =
  "radial-gradient(ellipse 70% 60% at 50% 38%, transparent 30%, black 85%)";

// Decorative background for the dark gate/enquiry pages. Place inside a
// `relative` container with the navy gradient and give the page content
// `relative z-10`. The pattern is pinned to the viewport and clipped to the
// container, so it also works on pages that sit between the store header and
// footer. It turns slowly unless the visitor prefers reduced motion.
export default function SacredGeometryBackground() {
  const patternId = `flower-of-life-${useId().replace(/:/g, "")}`;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 [clip-path:inset(0)]"
    >
      <div
        className="fixed inset-0"
        style={{ maskImage: FADE, WebkitMaskImage: FADE }}
      >
        {/* Square larger than the viewport diagonal so corners never show while it turns. */}
        <svg className="absolute top-1/2 left-1/2 size-[150vmax] -translate-x-1/2 -translate-y-1/2 opacity-40 motion-safe:animate-[spin_240s_linear_infinite]">
          <defs>
            <pattern
              id={patternId}
              width={TILE_W}
              height={TILE_H}
              patternUnits="userSpaceOnUse"
            >
              {CIRCLES.map(([cx, cy]) => (
                <circle
                  key={`${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={R}
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth={0.8}
                />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      </div>

      <div className="fixed -top-28 -left-28 h-80 w-80 rounded-full bg-brand-teal/35 blur-[70px]" />
      <div className="fixed -right-28 -bottom-28 h-80 w-80 rounded-full bg-brand-teal/25 blur-[70px]" />
    </div>
  );
}
