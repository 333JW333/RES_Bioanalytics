import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getFeaturedProducts } from "@/data/products";
import { DnaIcon, FlaskIcon, ShieldCheckIcon } from "@/components/icons";

export default function Home() {
  const featured = getFeaturedProducts();

  return (
    <div>
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <DnaIcon className="absolute -right-10 top-0 h-96 w-96 text-brand-teal" />
        </div>
        <div className="container-page relative py-20 sm:py-28">
          <span className="badge-ruo mb-6">Research Use Only</span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            High-purity reference peptides, built for the lab.
          </h1>
          <p className="mt-5 max-w-xl text-white/70 text-lg leading-relaxed">
            RES Bioanalytics supplies COA-verified peptides and research
            compounds to laboratories and qualified researchers. Rigorous
            purity standards, transparent documentation, fast dispatch.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/shop" className="btn-primary">
              Browse Catalog
            </Link>
            <Link href="/quality" className="btn-secondary !bg-transparent !text-white !border-white/30 hover:!border-brand-teal">
              View Sample COAs
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <FeatureItem
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            title="COA-Verified Purity"
            description="Every batch is tested by third-party HPLC/MS analysis, with certificates of analysis available for every lot."
          />
          <FeatureItem
            icon={<FlaskIcon className="h-6 w-6" />}
            title="Built for Researchers"
            description="Sourced and packaged specifically for laboratory, analytical, and non-clinical research applications."
          />
          <FeatureItem
            icon={<DnaIcon className="h-6 w-6" />}
            title="Expanding Catalog"
            description="Launching with core research peptides and growing toward 30+ SKUs across peptide classes and formats."
          />
        </div>
      </section>

      <section className="container-page py-8 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy">Featured Compounds</h2>
            <p className="text-brand-slate-light mt-1">A snapshot of our current research catalog.</p>
          </div>
          <Link href="/shop" className="hidden sm:inline text-sm font-semibold text-brand-teal-dark hover:underline">
            View all products →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-brand-ice border-t border-brand-line">
        <div className="container-page py-14 text-center">
          <h2 className="text-2xl font-bold text-brand-navy mb-3">
            For Laboratory &amp; Research Use Only
          </h2>
          <p className="max-w-2xl mx-auto text-brand-slate-light text-sm leading-relaxed">
            All products offered by RES Bioanalytics are intended strictly
            for in-vitro laboratory research and are not drugs, supplements,
            cosmetics, or foods. They are not for human or animal
            consumption, and are not evaluated by the FDA to diagnose,
            treat, cure, or prevent any disease. By purchasing, you certify
            you are a qualified researcher or institution acquiring these
            materials solely for permitted research purposes. Read our{" "}
            <Link href="/legal/ruo-policy" className="text-brand-teal-dark underline">
              full RUO Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal-dark mb-4">
        {icon}
      </span>
      <h3 className="font-semibold text-brand-navy mb-2">{title}</h3>
      <p className="text-sm text-brand-slate-light leading-relaxed">{description}</p>
    </div>
  );
}
