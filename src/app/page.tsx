import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getFeaturedProducts } from "@/data/products";
import { FlaskIcon, ShieldCheckIcon, DnaIcon } from "@/components/icons";

export default function Home() {
  const featured = getFeaturedProducts();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-brand-line bg-white">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-brand-blue">
              EcoPeps
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-brand-navy sm:text-5xl">
              Lot-verified research peptides.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-brand-slate">
              High-purity reference compounds for laboratory use, with public
              lot records, HPLC/MS documentation, and a catalog built for
              procurement — not lifestyle merchandising.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/certificates" className="btn-primary">
                Verify a Lot
              </Link>
              <Link href="/shop" className="btn-secondary">
                Browse Catalog
              </Link>
            </div>
            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-brand-slate-light">
              Research use only · Not for human or animal consumption
            </p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
            <div className="absolute inset-0 rounded-sm bg-brand-ice" />
            <Image
              src="/products/bpc-157-front.png"
              alt="EcoPeps research peptide vial"
              fill
              priority
              sizes="(min-width: 1024px) 480px, 90vw"
              className="object-contain p-10 sm:p-14"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-bold text-brand-navy">Evidence before checkout</h2>
          <p className="mt-2 text-brand-slate-light">
            Verification stays public. Purchaser qualification applies at
            ordering — not before you can evaluate documentation.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <FeatureItem
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            title="Searchable lot records"
            description="Find purity, methods, test date, and COA by product or lot number — no login wall."
          />
          <FeatureItem
            icon={<FlaskIcon className="h-6 w-6" />}
            title="Identity and purity testing"
            description="Each released lot is confirmed by HPLC and mass spectrometry before it enters inventory."
          />
          <FeatureItem
            icon={<DnaIcon className="h-6 w-6" />}
            title="Research designation only"
            description="Catalog language stays on compound identity and documentation — never dosing, stacks, or outcomes."
          />
        </div>
      </section>

      <section className="border-t border-brand-line bg-brand-ice/50">
        <div className="container-page py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-navy">Featured compounds</h2>
              <p className="mt-1 text-brand-slate-light">
                Current research catalog with vial photography and lot documentation.
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden text-sm font-semibold text-brand-blue hover:underline sm:inline"
            >
              View all products →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-line">
        <div className="container-page py-14 text-center">
          <h2 className="mb-3 text-2xl font-bold text-brand-navy">
            For laboratory &amp; research use only
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-brand-slate-light">
            All products offered by EcoPeps are intended strictly for in-vitro
            laboratory research and are not drugs, supplements, cosmetics, or
            foods. They are not for human or animal consumption, and are not
            evaluated by the FDA to diagnose, treat, cure, or prevent any
            disease. Read our{" "}
            <Link href="/legal/ruo-policy" className="text-brand-blue underline">
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
    <div>
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-brand-ice text-brand-navy">
        {icon}
      </span>
      <h3 className="mb-2 font-semibold text-brand-navy">{title}</h3>
      <p className="text-sm leading-relaxed text-brand-slate-light">{description}</p>
    </div>
  );
}
