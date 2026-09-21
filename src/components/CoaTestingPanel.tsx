/**
 * Illustrative “latest high-purity COA” panel for the Enter gate.
 * Visual language inspired by Peptide Crafters’ testing readout —
 * not a live instrument feed. Swap sampleLot for real lot data later.
 */
const sampleLot = {
  productName: "BPC-157",
  lotNumber: "EP-BPC-2402",
  method: "RP-HPLC, UV 214 nm",
  runTimeMin: "12.00",
  peakMin: "8.42",
  purity: "99.76%",
  msMz: "1419.55",
  endotoxinSpec: "≤ 5.0 EU/mL",
  sterilitySpec: "No growth",
};

export default function CoaTestingPanel() {
  return (
    <aside className="overflow-hidden border border-brand-line bg-white">
      {/* Trust pillars — stack on phones, 3-up from sm */}
      <div className="relative grid grid-cols-1 divide-y divide-brand-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {/* Full-width accent across all three columns on desktop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-0.5 bg-[#f5c542] sm:block"
        />
        <Pillar
          step="01"
          title="HPLC Analysis"
          body="Verified: purity, identity, mass"
          accent
        />
        <Pillar
          step="02"
          title="Micro Testing"
          body="Endotoxin & sterility tested"
        />
        <Pillar
          step="03"
          title="Manufacture"
          body="Lyophilized for research use"
        />
      </div>

      <div className="bg-[#1c2a38] px-3.5 py-5 text-white sm:px-6 sm:py-7">
        {/* Lot meta */}
        <div className="flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-wide text-white/50 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:text-[11px]">
          <p className="leading-relaxed break-words">
            <span className="text-white/80">{sampleLot.productName}</span>
            <span className="text-white/25"> · </span>
            Lot {sampleLot.lotNumber}
            <span className="text-white/25"> · </span>
            {sampleLot.method}
          </p>
          <p className="inline-flex items-center gap-2 text-emerald-400">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
            Run complete · {sampleLot.runTimeMin} min
          </p>
        </div>

        {/* Instrument graph */}
        <div className="mt-3 overflow-hidden rounded border border-cyan-400/20 bg-[#1a2634] p-2.5 sm:mt-4 sm:p-4">
          <Chromatogram
            peakLabel={`${sampleLot.peakMin} min`}
            runTimeMin={sampleLot.runTimeMin}
            purity={sampleLot.purity}
          />
        </div>

        {/* Key metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-6">
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-emerald-400 sm:text-4xl">
              {sampleLot.purity}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-white/40 sm:text-[10px]">
              Purity, area %
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              {sampleLot.msMz}
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-white/40 sm:text-[10px]">
              MS, m/z observed
            </p>
          </div>
        </div>

        {/* Assay results */}
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4 sm:mt-5 sm:space-y-2">
          <ResultRow
            label="Endotoxin USP <85>"
            spec={sampleLot.endotoxinSpec}
            result="PASS"
          />
          <ResultRow
            label="Sterility USP <71>"
            spec={sampleLot.sterilitySpec}
            result="PASS"
          />
        </div>
      </div>
    </aside>
  );
}

function Pillar({
  step,
  title,
  body,
  accent = false,
}: {
  step: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative px-3.5 py-3.5 sm:px-5 sm:py-5 ${
        accent
          ? "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-[#f5c542] sm:before:hidden"
          : ""
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-slate-light">
        {step} — {title}
      </p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-brand-navy">
        {body}
      </p>
    </div>
  );
}

function ResultRow({
  label,
  spec,
  result,
}: {
  label: string;
  spec: string;
  result: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 font-mono text-[10px] sm:items-baseline sm:text-[11px]">
      <div className="min-w-0 leading-relaxed">
        <p className="font-medium text-white">{label}</p>
        <p className="mt-0.5 text-white/45">{spec}</p>
      </div>
      <p className="shrink-0 pt-0.5 text-right sm:pt-0">
        <span className="text-white/45">Result </span>
        <span className="font-semibold text-emerald-400">{result}</span>
      </p>
    </div>
  );
}

function Chromatogram({
  peakLabel,
  runTimeMin,
  purity,
}: {
  peakLabel: string;
  runTimeMin: string;
  purity: string;
}) {
  const peakX = 270;
  const baseline = 168;
  const peakTop = 22;

  return (
    <div className="relative">
      <div className="mb-2 flex flex-col gap-1 font-mono text-[9px] uppercase tracking-wider text-cyan-300/70 sm:flex-row sm:items-center sm:justify-between sm:text-[10px]">
        <span>CH1 · UV 214 nm · Abs</span>
        <span>RT window 0–{runTimeMin} min</span>
      </div>

      {/* Peak readout in HTML so labels stay legible when the SVG scales down */}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded border border-amber-400/40 bg-[#0a1622]/80 px-2.5 py-1.5 font-mono text-[10px] sm:text-[11px]">
        <span className="text-amber-300">PEAK {peakLabel}</span>
        <span className="text-cyan-300/80">AREA {purity}</span>
      </div>

      <svg
        viewBox="0 0 640 210"
        className="h-36 w-full sm:h-48"
        role="img"
        aria-label={`HPLC chromatogram with primary peak at ${peakLabel}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="coaPeakFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="55%" stopColor="#14b8a6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="coaTraceStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="45%" stopColor="#f5c542" />
            <stop offset="55%" stopColor="#f5c542" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
          <filter id="coaTraceGlow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern
            id="coaScanGrid"
            width="32"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M32 0H0V20"
              fill="none"
              stroke="rgba(103,232,249,0.06)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <path
          d="M8 28V8H28"
          fill="none"
          stroke="rgba(103,232,249,0.45)"
          strokeWidth="1.2"
        />
        <path
          d="M632 28V8H612"
          fill="none"
          stroke="rgba(103,232,249,0.45)"
          strokeWidth="1.2"
        />
        <path
          d="M8 182V202H28"
          fill="none"
          stroke="rgba(103,232,249,0.45)"
          strokeWidth="1.2"
        />
        <path
          d="M632 182V202H612"
          fill="none"
          stroke="rgba(103,232,249,0.45)"
          strokeWidth="1.2"
        />

        <rect x="8" y="8" width="624" height="194" fill="url(#coaScanGrid)" />

        {[40, 80, 120, 160].map((y, i) => (
          <g key={y}>
            <line
              x1="48"
              x2="620"
              y1={y}
              y2={y}
              stroke="rgba(103,232,249,0.1)"
              strokeWidth="1"
              strokeDasharray={i === 3 ? "0" : "2 4"}
            />
            <text
              x="42"
              y={y + 3}
              fill="rgba(103,232,249,0.4)"
              fontSize="9"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              textAnchor="end"
            >
              {(1 - i * 0.25).toFixed(2)}
            </text>
          </g>
        ))}

        {/* Fewer time ticks — every 3 min keeps labels readable when scaled */}
        {[0, 3, 6, 9, 12].map((min) => {
          const x = 48 + (min / 12) * 572;
          return (
            <g key={min}>
              <line
                x1={x}
                x2={x}
                y1="28"
                y2={baseline}
                stroke="rgba(103,232,249,0.07)"
                strokeWidth="1"
              />
              <line
                x1={x}
                x2={x}
                y1={baseline}
                y2={baseline + 5}
                stroke="rgba(103,232,249,0.35)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={baseline + 16}
                fill="rgba(103,232,249,0.45)"
                fontSize="9"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                textAnchor="middle"
              >
                {min}
              </text>
            </g>
          );
        })}

        <text
          x="334"
          y="205"
          fill="rgba(103,232,249,0.5)"
          fontSize="9"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor="middle"
        >
          Retention time (min)
        </text>
        <text
          x="16"
          y="105"
          fill="rgba(103,232,249,0.5)"
          fontSize="9"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          textAnchor="middle"
          transform="rotate(-90 16 105)"
        >
          AU
        </text>

        <path
          d={`M48 ${baseline}
             C78 166, 108 164, 138 162
             C168 160, 188 158, 208 152
             C228 140, 243 100, 258 50
             C266 28, 264 ${peakTop}, ${peakX} ${peakTop}
             C276 ${peakTop}, 282 28, 290 50
             C305 100, 320 140, 340 152
             C360 158, 390 162, 430 164
             C480 166, 540 167, 620 ${baseline}
             L48 ${baseline} Z`}
          fill="url(#coaPeakFill)"
        />

        <path
          d={`M48 ${baseline}
             C78 166, 108 164, 138 162
             C168 160, 188 158, 208 152
             C228 140, 243 100, 258 50
             C266 28, 264 ${peakTop}, ${peakX} ${peakTop}
             C276 ${peakTop}, 282 28, 290 50
             C305 100, 320 140, 340 152
             C360 158, 390 162, 430 164
             C480 166, 540 167, 620 ${baseline}`}
          fill="none"
          stroke="url(#coaTraceStroke)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#coaTraceGlow)"
        />

        <line
          x1={peakX}
          x2={peakX}
          y1={peakTop}
          y2={baseline}
          stroke="rgba(245,197,66,0.55)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle
          cx={peakX}
          cy={peakTop}
          r="3.5"
          fill="#0a1622"
          stroke="#f5c542"
          strokeWidth="1.5"
        />
        <circle cx={peakX} cy={peakTop} r="1.2" fill="#f5c542">
          <animate
            attributeName="opacity"
            values="1;0.35;1"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>

        <rect x="48" y="28" width="2" height="140" fill="rgba(103,232,249,0.15)">
          <animate
            attributeName="x"
            values="48;620;48"
            dur="6s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  );
}
