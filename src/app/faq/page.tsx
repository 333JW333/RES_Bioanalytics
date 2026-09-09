import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about ordering, payment, shipping, and research-use compliance.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Who can purchase from RES Bioanalytics?",
    a: "Our products are sold exclusively to qualified researchers, laboratories, and institutions for laboratory, analytical, and non-clinical research purposes. At checkout you must confirm you are purchasing for permitted research use only.",
  },
  {
    q: "Are these products approved for human or animal use?",
    a: "No. All products are labeled and sold strictly for research use only (RUO). They are not drugs, dietary supplements, cosmetics, or foods, and are not evaluated or approved by the FDA or any regulatory body for human or animal consumption, diagnosis, treatment, or prevention of disease.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We currently accept cryptocurrency (via Coinbase Commerce, supporting BTC, ETH, USDC, and more) and ACH bank transfers (via Plaid + Dwolla). Credit card and PayPal support are planned as we grow.",
  },
  {
    q: "Do you provide certificates of analysis?",
    a: (
      <>
        Yes. Every batch is tested by HPLC/MS and ships with a
        lot-specific certificate of analysis. See our{" "}
        <Link href="/quality" className="text-brand-teal-dark underline">
          Quality &amp; COAs
        </Link>{" "}
        page for details.
      </>
    ),
  },
  {
    q: "How is my order shipped and stored?",
    a: "Products are shipped in sealed, labeled containers appropriate for laboratory reagents. Most compounds are lyophilized powders that should be stored at -20°C until reconstitution. See individual product pages for compound-specific storage guidance.",
  },
  {
    q: "How long does an ACH payment take to process?",
    a: "ACH bank transfers typically settle within 1-3 business days. Orders ship once payment has cleared.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-page py-16">
      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl font-bold text-brand-navy mb-3">Frequently Asked Questions</h1>
        <p className="text-brand-slate-light">
          Can&apos;t find what you&apos;re looking for?{" "}
          <Link href="/contact" className="text-brand-teal-dark underline">Contact our team</Link>.
        </p>
      </div>
      <div className="space-y-4 max-w-3xl">
        {FAQS.map((item) => (
          <details key={item.q} className="card p-5 group">
            <summary className="cursor-pointer list-none font-semibold text-brand-navy flex items-center justify-between">
              {item.q}
              <span className="text-brand-teal-dark group-open:rotate-45 transition-transform text-xl leading-none">+</span>
            </summary>
            <p className="mt-3 text-sm text-brand-slate leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
