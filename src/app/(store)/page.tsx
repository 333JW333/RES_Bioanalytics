import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import UsFlag from "@/components/UsFlag";
import { getFeaturedProducts, getProductBySlug } from "@/data/products";
import { DnaIcon, FlaskIcon, ShieldCheckIcon } from "@/components/icons";
import { formatUSD } from "@/lib/format";
import { isSoldOut, startingPrice } from "@/lib/pricing";

// Title and social cards fall back to the root layout's defaults.
export const metadata: Metadata = {
  description:
    "Veteran owned and operated in the USA. EcoPeps supplies research peptides with third-party HPLC purity testing and a published certificate of analysis for every batch.",
};

// EP-GLP3-R, our lead product, fronts the hero.
const HERO_PRODUCT_SLUG = "retatrutide";

export default function Home() {
  // Only what customers can buy today; sold-out products wait in the shop
  // with their Notify Me buttons.
  const featured = getFeaturedProducts().filter((p) => !isSoldOut(p));
  // Four across when the cards fill whole rows of four, so none is left
  // on its own. Tailwind needs literal class names.
  const featuredCols = featured.length % 4 === 0 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  const heroProduct = getProductBySlug(HERO_PRODUCT_SLUG);

  return (
    <div>
      <section className="bg-brand-navy text-white">
        <div className="container-page grid items-center gap-10 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <span className="badge-ruo mb-6">Research Use Only</span>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              High-purity reference peptides, built for the lab.
            </h1>
            <p className="mt-5 max-w-xl text-white/70 text-lg leading-relaxed">
              EcoPeps supplies COA-verified peptides and research
              compounds to laboratories and qualified researchers. Rigorous
              purity standards, transparent documentation, fast dispatch.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/shop" className="btn-primary">
                Browse Catalog
              </Link>
              <Link href="/quality" className="btn-secondary !bg-transparent !text-white !border-white/30 hover:!border-brand-teal">
                View COAs
              </Link>
            </div>
          </div>
          {heroProduct?.images?.front && (
            <Link
              href={`/shop/${heroProduct.slug}`}
              className="group w-full max-w-sm overflow-hidden rounded-2xl bg-white text-brand-navy shadow-2xl lg:w-[22rem] xl:w-[26rem] xl:max-w-none"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={heroProduct.images.front}
                  alt={`${heroProduct.name} vial`}
                  fill
                  preload
                  sizes="(min-width: 1280px) 416px, (min-width: 1024px) 352px, 384px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-teal-dark">
                    Featured
                  </p>
                  <p className="mt-1 text-lg font-semibold">{heroProduct.name}</p>
                  <p className="text-xs text-brand-slate-light">{heroProduct.synonym}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">
                    From {formatUSD(startingPrice(heroProduct))}
                  </p>
                  <p className="mt-1 text-xs font-medium text-brand-teal-dark">
                    {heroProduct.purity}
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <FeatureItem
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            title="COA-Verified Purity"
            description="Every batch is tested by third-party HPLC/MS analysis, with a certificate of analysis available for each one."
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
        <div className={`grid gap-6 sm:grid-cols-2 ${featuredCols}`}>
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-brand-ice border-t border-brand-line">
        <div className="container-page flex flex-col items-center py-14 text-center">
          <UsFlag className="mb-5 h-8 w-auto shadow-sm" />
          <h2 className="text-2xl font-bold text-brand-navy mb-3">
            Veteran Owned &amp; Operated
          </h2>
          <p className="max-w-2xl text-brand-slate-light leading-relaxed">
            EcoPeps is veteran owned and operated in the United States of
            America. Every batch is tested by an independent lab before
            release, and every result is published for you to verify.
          </p>
          <Link
            href="/about"
            className="mt-5 text-sm font-semibold text-brand-teal-dark hover:underline"
          >
            About EcoPeps →
          </Link>
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
