import type { Metadata } from "next";
import { DnaIcon, FlaskIcon, ShieldCheckIcon } from "@/components/icons";
import UsFlag from "@/components/UsFlag";
import { getAllProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "About Us",
  description: "EcoPeps is a veteran-owned company operating in the United States, supplying high-purity research peptides and compounds to laboratories and qualified researchers.",
};

export default function AboutPage() {
  const productCount = getAllProducts().length;

  return (
    <div className="container-page py-16">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-brand-navy mb-5">About EcoPeps</h1>
        <p className="mb-5 inline-flex items-center gap-2.5 rounded-lg border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-brand-navy">
          <UsFlag className="h-3.5 w-auto shrink-0 shadow-sm" />
          Veteran owned &amp; operated in the United States of America
        </p>
        <p className="text-brand-slate leading-relaxed mb-4">
          EcoPeps was founded to give laboratories and research
          institutions reliable access to high-purity reference peptides and
          research compounds, backed by transparent, batch-level quality
          documentation. We started with a focused catalog of core research
          peptides and are building toward a full research reagent line of
          30+ products as we grow.
        </p>
        <p className="text-brand-slate leading-relaxed mb-4">
          Every compound we offer is sourced, batch-tested by an independent
          lab, and released for laboratory, analytical, and non-clinical
          research use. We work exclusively with qualified researchers,
          laboratories, and institutions.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3 mt-12">
        <ValueCard
          icon={<ShieldCheckIcon className="h-6 w-6" />}
          title="Quality First"
          body="Independent HPLC/MS testing and certificates of analysis for every batch we release."
        />
        <ValueCard
          icon={<FlaskIcon className="h-6 w-6" />}
          title="Built for Labs"
          body="Packaging, documentation, and support designed around real laboratory workflows."
        />
        <ValueCard
          icon={<DnaIcon className="h-6 w-6" />}
          title="Growing Catalog"
          body={`Launching with ${productCount} core peptides, expanding toward a comprehensive 30+ SKU research line.`}
        />
      </div>
    </div>
  );
}

function ValueCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal-dark mb-4">
        {icon}
      </span>
      <h3 className="font-semibold text-brand-navy mb-2">{title}</h3>
      <p className="text-sm text-brand-slate-light leading-relaxed">{body}</p>
    </div>
  );
}
