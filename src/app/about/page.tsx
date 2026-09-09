import { Metadata } from "next";
import { DnaIcon, FlaskIcon, ShieldCheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About Us",
  description: "RES Bioanalytics supplies high-purity research peptides and compounds to laboratories and qualified researchers.",
};

export default function AboutPage() {
  return (
    <div className="container-page py-16">
      <div className="max-w-3xl">
        <span className="badge-ruo mb-4">Research Use Only</span>
        <h1 className="text-3xl font-bold text-brand-navy mb-5">About RES Bioanalytics</h1>
        <p className="text-brand-slate leading-relaxed mb-4">
          RES Bioanalytics was founded to give laboratories and research
          institutions reliable access to high-purity reference peptides and
          research compounds, backed by transparent, batch-level quality
          documentation. We started with a focused catalog of core research
          peptides and are building toward a full research reagent line of
          30+ products as we grow.
        </p>
        <p className="text-brand-slate leading-relaxed mb-4">
          Every compound we offer is manufactured and tested for laboratory,
          analytical, and non-clinical research use only. We work
          exclusively with qualified researchers, laboratories, and
          institutions, and we do not market, promote, or sell our products
          for human or animal consumption, diagnostic use, or any clinical
          application.
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
          body="Launching with 5 core peptides, expanding toward a comprehensive 30+ SKU research line."
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
