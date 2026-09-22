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

// Faint Flower of Life texture for the light gate/enquiry pages. Place inside
// a `relative` container and give the page content `relative`.
export default function SacredGeometryBackground() {
  const patternId = `flower-of-life-${useId().replace(/:/g, "")}`;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
    >
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
              stroke="#0d8f81"
              strokeWidth={0.75}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
