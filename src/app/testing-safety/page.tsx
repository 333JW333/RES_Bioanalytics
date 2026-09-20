import { Metadata } from "next";
import Link from "next/link";
import Disclosure from "@/components/Disclosure";
import {
  ShieldCheckIcon,
  FlaskIcon,
  DnaIcon,
  FileIcon,
  ExternalLinkIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Peptide Testing & Safety",
  description:
    "How EcoPeps verifies every research peptide lot with third-party HPLC and mass spectrometry testing, and the laboratory safety practices we recommend for handling research compounds.",
};

const TESTING_STEPS = [
  {
    title: "Raw Material Verification",
    body: "Incoming raw materials and precursor amino acids are checked against supplier documentation and identity specs before synthesis begins.",
  },
  {
    title: "Synthesis & Lyophilization",
    body: "Peptides are synthesized and lyophilized under controlled conditions to minimize degradation, moisture uptake, and cross-contamination between lots.",
  },
  {
    title: "Third-Party HPLC Purity Analysis",
    body: "An independent laboratory runs high-performance liquid chromatography (HPLC) on a sample from every production lot to quantify purity, typically ≥98–99% depending on the compound.",
  },
  {
    title: "Mass Spectrometry Identity Confirmation",
    body: "Mass spectrometry (MS) confirms the molecular weight and sequence identity of the peptide, verifying it matches the intended compound rather than a structural analog or degradation product.",
  },
  {
    title: "Lot-Specific Certificate of Analysis",
    body: "Results are compiled into a certificate of analysis (COA) tied to that specific lot number. Nothing ships without a completed COA on file.",
  },
];

const METHODS = [
  {
    title: "What does HPLC testing measure?",
    body: "High-performance liquid chromatography separates the components of a sample as they pass through a column, producing a chromatogram. The area under the main peak, relative to any side peaks, indicates the purity of the peptide — for example, a result of ≥99% means less than 1% of the sample consists of synthesis byproducts, truncated sequences, or degradation products.",
  },
  {
    title: "What does mass spectrometry confirm?",
    body: "Mass spectrometry ionizes a sample and measures the mass-to-charge ratio of the resulting ions. For peptides, this confirms the molecular weight matches the expected sequence, which is the primary way to verify identity — distinguishing, for instance, a correct peptide from a similar-sounding but structurally different compound.",
  },
  {
    title: "Why isn't sterility or endotoxin testing listed?",
    body: "Our compounds are sold strictly for laboratory, analytical, and non-clinical research use — not for injection, ingestion, or any in-vivo human or animal application. Sterility and endotoxin testing are relevant to clinical or in-vivo use cases outside the scope of what we sell for, and their absence here does not change that these products are not intended for such use.",
  },
];

const SAFETY_GUIDELINES = [
  {
    title: "Personal Protective Equipment",
    body: "Handle all research compounds in a properly ventilated lab environment. Use nitrile gloves, safety glasses, and a lab coat when weighing, reconstituting, or transferring material, consistent with standard chemical hygiene practice for laboratory reagents.",
  },
  {
    title: "Reconstitution & Handling",
    body: "Reconstitute lyophilized powders with an appropriate sterile diluent using aseptic technique, and work over a clean, dedicated surface. Avoid cross-contaminating vials, and label any reconstituted solution with the compound, lot number, and date.",
  },
  {
    title: "Storage",
    body: "Store lyophilized powders at -20°C in their original sealed, labeled container, protected from light and moisture. Once reconstituted, most peptides should be kept refrigerated (2–8°C) and used within the timeframe noted on the product page — see individual product pages for compound-specific guidance.",
  },
  {
    title: "Disposal",
    body: "Dispose of unused material, contaminated consumables, and sharps according to your institution's chemical waste protocols and applicable local, state, and federal regulations. Do not dispose of research compounds down household drains.",
  },
  {
    title: "Not for Human or Animal Use",
    body: "These products are supplied exclusively for in-vitro laboratory and analytical research by qualified personnel. They are not drugs, dietary supplements, cosmetics, or foods, are not evaluated by the FDA or any regulatory body, and must never be administered to humans or animals, ingested, or used for self-experimentation.",
  },
];

const COA_FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I find the COA for my order?",
    a: (
      <>
        Each shipment includes a certificate of analysis for the specific lot
        you received. Sample COAs for every product are also available on our{" "}
        <Link href="/quality" className="text-brand-teal-dark underline">
          Quality &amp; COAs
        </Link>{" "}
        page, and you can request the exact lot document for your order at
        any time.
      </>
    ),
  },
  {
    q: "What should I check on a COA before use?",
    a: "Confirm the lot number on the COA matches the label on your vial, and check the reported purity (HPLC) and identity confirmation (MS) against the compound you ordered. Contact us immediately if anything doesn't match.",
  },
  {
    q: "Who performs your testing?",
    a: "Testing is performed by independent third-party laboratories separate from our synthesis and fulfillment process, so purity and identity results are not self-reported by the same party selling the product.",
  },
  {
    q: "What if a batch doesn't meet spec?",
    a: "Any lot that fails to meet our identity or purity thresholds is not released for sale. Only lots with a passing COA on file are made available to order.",
  },
];

export default function TestingSafetyPage() {
  return (
    <div className="container-page py-16">
      <div className="max-w-3xl mb-14">
        <span className="badge-ruo mb-4">Research Use Only</span>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-navy mb-5">
          Peptide Testing &amp; Safety
        </h1>
        <p className="text-brand-slate leading-relaxed mb-4">
          Every peptide we sell is manufactured under controlled conditions
          and independently verified before it ever reaches a lab bench.
          This page explains how our testing process works, how to read the
          results, and the handling practices we recommend for anyone
          working with research compounds.
        </p>
        <p className="text-brand-slate leading-relaxed">
          All products remain strictly for laboratory, analytical, and
          non-clinical research use. Nothing on this page is guidance for
          human or animal use — see our{" "}
          <Link href="/legal/ruo-policy" className="text-brand-teal-dark underline">
            Research Use Only Policy
          </Link>{" "}
          for full terms.
        </p>
      </div>

      {/* Testing process */}
      <section className="mb-16">
        <div className="flex items-center gap-2.5 mb-6">
          <FlaskIcon className="h-6 w-6 text-brand-teal-dark" />
          <h2 className="text-2xl font-bold text-brand-navy">Our Testing Process</h2>
        </div>
        <p className="text-brand-slate leading-relaxed mb-8 max-w-3xl">
          Every production lot moves through the same five-step verification
          process before it is released for sale. No lot ships without a
          completed certificate of analysis on file.
        </p>
        <ol className="grid gap-4 sm:grid-cols-2">
          {TESTING_STEPS.map((step, i) => (
            <li key={step.title} className="card p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-teal/15 text-xs font-bold text-brand-teal-dark">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-brand-navy mb-1">{step.title}</p>
                  <p className="text-sm text-brand-slate leading-relaxed">{step.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Testing methods explained */}
      <section className="mb-16">
        <div className="flex items-center gap-2.5 mb-6">
          <DnaIcon className="h-6 w-6 text-brand-teal-dark" />
          <h2 className="text-2xl font-bold text-brand-navy">Testing Methods Explained</h2>
        </div>
        <div className="space-y-4 max-w-3xl">
          {METHODS.map((item, i) => (
            <Disclosure key={item.title} title={item.title} defaultOpen={i === 0}>
              <p className="text-sm text-brand-slate leading-relaxed">{item.body}</p>
            </Disclosure>
          ))}
        </div>
      </section>

      {/* Reading your COA */}
      <section className="mb-16">
        <div className="flex items-center gap-2.5 mb-6">
          <FileIcon className="h-6 w-6 text-brand-teal-dark" />
          <h2 className="text-2xl font-bold text-brand-navy">Reading &amp; Verifying Your COA</h2>
        </div>
        <div className="space-y-4 max-w-3xl">
          {COA_FAQS.map((item) => (
            <details key={item.q} className="card p-5 group">
              <summary className="cursor-pointer list-none font-semibold text-brand-navy flex items-center justify-between gap-4">
                {item.q}
                <span className="text-brand-teal-dark group-open:rotate-45 transition-transform text-xl leading-none shrink-0">+</span>
              </summary>
              <p className="mt-3 text-sm text-brand-slate leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
        <Link
          href="/quality"
          className="btn-secondary mt-6 inline-flex"
        >
          View sample COAs
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* Safety guidelines */}
      <section className="mb-16">
        <div className="flex items-center gap-2.5 mb-6">
          <ShieldCheckIcon className="h-6 w-6 text-brand-teal-dark" />
          <h2 className="text-2xl font-bold text-brand-navy">Laboratory Safety Guidelines</h2>
        </div>
        <p className="text-brand-slate leading-relaxed mb-8 max-w-3xl">
          These are general handling practices for research compounds and do
          not replace your institution&apos;s chemical hygiene plan, safety
          data sheets, or applicable regulations — always defer to your
          lab&apos;s own protocols.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {SAFETY_GUIDELINES.map((item) => (
            <div key={item.title} className="card p-5">
              <p className="font-semibold text-brand-navy mb-1.5">{item.title}</p>
              <p className="text-sm text-brand-slate leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="rounded-xl border border-brand-warn-border bg-brand-warn-bg p-5 text-sm text-brand-warn-text leading-relaxed max-w-3xl">
        <strong>Research Use Only.</strong> All products sold by EcoPeps are
        intended strictly for laboratory, analytical, and in-vitro research
        use by qualified professionals and institutions. They are not drugs,
        biologics, dietary supplements, cosmetics, or foods, are not
        approved by the FDA or any regulatory body for human or animal use,
        and are not intended to diagnose, treat, cure, or prevent any
        disease. Not for human or animal consumption, injection, or
        self-experimentation. See our{" "}
        <Link href="/legal/ruo-policy" className="underline hover:text-brand-navy">
          Research Use Only Policy
        </Link>{" "}
        for full terms.
      </div>

      <p className="text-sm text-brand-slate-light mt-8 max-w-3xl">
        Questions about a specific lot, a COA, or our testing process?{" "}
        <Link href="/contact" className="text-brand-teal-dark underline">
          Contact our team
        </Link>
        .
      </p>
    </div>
  );
}
