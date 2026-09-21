"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LotRecord, LotStatus, getAllLots, searchLots } from "@/data/lots";

const STATUS_LABEL: Record<LotStatus, string> = {
  in_stock: "In stock",
  limited: "Limited",
  depleted: "Depleted",
};

export default function CertificateLibrary({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(
    () => (query.trim() ? searchLots(query) : getAllLots()),
    [query]
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <label htmlFor="lot-search" className="mb-2 block text-sm font-medium text-brand-graphite">
            Search by product, lot number, size, or laboratory
          </label>
          <input
            id="lot-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. BPC-157, EP-BPC-2401, HPLC"
            className="input max-w-md"
            autoComplete="off"
          />
        </div>
        <p className="text-sm text-brand-slate-light">
          {results.length} lot{results.length === 1 ? "" : "s"} shown
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-brand-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Lot</th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Size</th>
              <th className="px-4 py-3 font-semibold">Purity</th>
              <th className="px-4 py-3 font-semibold">Test date</th>
              <th className="px-4 py-3 font-semibold">Methods</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">COA</th>
            </tr>
          </thead>
          <tbody>
            {results.map((lot, index) => (
              <LotRow key={lot.id} lot={lot} striped={index % 2 === 1} />
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-brand-slate-light">
                  No lots match that search. Try a product name or lot prefix like{" "}
                  <span className="font-mono text-xs">EP-</span>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LotRow({ lot, striped }: { lot: LotRecord; striped: boolean }) {
  return (
    <tr className={striped ? "bg-brand-ice/80" : "bg-white"}>
      <td className="px-4 py-3 font-mono text-xs text-brand-navy">{lot.lotNumber}</td>
      <td className="px-4 py-3">
        <Link href={`/shop/${lot.productSlug}`} className="font-medium text-brand-navy hover:underline">
          {lot.productName}
        </Link>
      </td>
      <td className="px-4 py-3 text-brand-slate">{lot.sizeLabel}</td>
      <td className="px-4 py-3 font-medium text-brand-graphite">{lot.purity}</td>
      <td className="px-4 py-3 text-brand-slate">{lot.testDate}</td>
      <td className="px-4 py-3 text-brand-slate">{lot.methods.join(" / ")}</td>
      <td className="px-4 py-3">
        <StatusPill status={lot.status} />
      </td>
      <td className="px-4 py-3">
        <a
          href={lot.coaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-blue hover:underline"
        >
          View
        </a>
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: LotStatus }) {
  const styles =
    status === "in_stock"
      ? "bg-brand-teal/10 text-brand-teal-dark"
      : status === "limited"
        ? "bg-brand-warn-bg text-brand-warn-text"
        : "bg-brand-ice text-brand-slate-light";

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${styles}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
