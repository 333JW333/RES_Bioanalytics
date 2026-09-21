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

// Any test result whose full text is one of these reads as a pass and
// renders in brand-teal. Add new equivalents here (e.g. "CONFORMS") as
// new test types are added, whatever standard they cite (USP <61>,
// USP <71>, ...) in the label.
const POSITIVE_RESULTS = new Set(["PASS", "CONFIRMED"]);

function isPositiveResult(result: string): boolean {
  return POSITIVE_RESULTS.has(result.trim().toUpperCase());
}

export default function CoaDashboard({ coa }: { coa: CoaPanel }) {
  const sign = coa.massVariancePercent > 0 ? "+" : "";

  return (
    <div className="rounded-2xl border border-brand-line bg-gradient-to-br from-slate-50 via-white to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-brand-navy">Certificate of Analysis</h3>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-brand-slate-light">
            Most Recent Lab Test
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            coa.sampleData
              ? "border-brand-warn-border bg-brand-warn-bg text-brand-warn-text"
              : "border-brand-teal/30 bg-white text-brand-teal-dark"
          }`}
        >
          {coa.sampleData ? "Sample Data" : coa.labName}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-brand-line bg-white p-4">
        <div>
          <p className="text-2xl font-bold text-brand-teal-dark">{coa.purityPercent}%</p>
          <p className="mt-1 text-xs text-brand-slate-light">Purity</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-brand-navy">{coa.testedMassMg} mg</p>
          <p className="mt-1 text-xs text-brand-slate-light">
            Quantity {sign}
            {coa.massVariancePercent}%
          </p>
        </div>
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-brand-slate-light">
        Test Panel
      </p>
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {coa.tests.map((t) => (
          <div
            key={t.label}
            className="flex items-start gap-2 rounded-lg border border-brand-line bg-white px-3 py-2.5 text-xs"
          >
            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-teal-dark" />
            <div className="min-w-0">
              <p className="leading-snug text-brand-navy">{t.label}</p>
              <p
                className={
                  isPositiveResult(t.result)
                    ? "font-semibold text-brand-teal-dark"
                    : "text-brand-slate-light"
                }
              >
                {t.result}
              </p>
            </div>
          </div>
        ))}
      </div>

      <a
        href={coa.reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary mt-5 w-full text-sm"
      >
        View Full COA
      </a>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {coa.verifyLinks.map((v) => (
          <a
            key={v.label}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            Verify COA: {v.label} <ExternalLinkIcon className="h-3 w-3" />
          </a>
        ))}
      </div>
    </div>
  );
}
