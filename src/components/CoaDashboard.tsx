import { CoaPanel } from "@/types/product";
import { ExternalLinkIcon } from "@/components/icons";

function CheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CoaDashboard({ coa }: { coa: CoaPanel }) {
  const sign = coa.massVariancePercent > 0 ? "+" : "";

  return (
    <div className="rounded-2xl bg-brand-navy p-6 text-white shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Certificate of Analysis</h3>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Most Recent Lab Test
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            coa.sampleData
              ? "bg-brand-warn-bg text-brand-warn-text"
              : "bg-white/10 text-brand-teal"
          }`}
        >
          {coa.sampleData ? "Sample Data" : coa.labName}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-4">
        <div>
          <p className="text-2xl font-bold text-brand-teal">{coa.purityPercent}%</p>
          <p className="mt-1 text-xs text-white/60">Purity</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{coa.testedMassMg} mg</p>
          <p className="mt-1 text-xs text-white/60">
            Quantity · {coa.labeledMassMg} mg labeled · {sign}
            {coa.massVariancePercent}%
          </p>
        </div>
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
        Test Panel
      </p>
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {coa.tests.map((t) => (
          <div
            key={t.label}
            className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-xs"
          >
            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-teal" />
            <div className="min-w-0">
              <p className="leading-snug text-white/90">{t.label}</p>
              <p className="text-white/60">{t.result}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <a
          href={coa.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/40"
        >
          View Full COA
        </a>
        <a
          href={coa.verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-semibold text-[#04211d] transition-colors hover:bg-brand-teal-dark hover:text-white"
        >
          Verify COA <ExternalLinkIcon className="h-3 w-3" />
        </a>
      </div>

      <p className="mt-4 text-[11px] text-white/40">
        Lot {coa.lot} · Search code {coa.searchCode}
      </p>
    </div>
  );
}
