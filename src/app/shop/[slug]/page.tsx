import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getAllProducts, getProductBySlug } from "@/data/products";
import AddToCartPanel from "@/components/AddToCartPanel";
import { VialIcon, ShieldCheckIcon } from "@/components/icons";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/shop/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductPage(props: PageProps<"/shop/[slug]">) {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="container-page py-14">
      <nav className="text-sm text-brand-slate-light mb-8">
        <Link href="/shop" className="hover:text-brand-teal-dark">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-brand-navy">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-brand-navy-2 py-24">
          <VialIcon className="h-32 w-32" />
        </div>

        <div>
          <span className="badge-ruo mb-4">Research Use Only</span>
          <h1 className="text-3xl font-bold text-brand-navy mb-1">{product.name}</h1>
          {product.synonym && (
            <p className="text-brand-slate-light mb-4">{product.synonym}</p>
          )}
          <p className="text-brand-slate leading-relaxed mb-6">{product.description}</p>

          <dl className="grid grid-cols-2 gap-4 text-sm mb-8">
            <SpecItem label="Purity" value={product.purity} />
            <SpecItem label="Form" value={product.form} />
            {product.casNumber && <SpecItem label="CAS Number" value={product.casNumber} />}
            {product.sequenceOrFormula && (
              <SpecItem label="Sequence / Formula" value={product.sequenceOrFormula} mono />
            )}
          </dl>

          <div className="mb-8">
            <AddToCartPanel product={product} />
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-brand-line bg-brand-ice p-4">
            <ShieldCheckIcon className="h-5 w-5 shrink-0 text-brand-teal-dark mt-0.5" />
            <p className="text-xs text-brand-slate-light leading-relaxed">
              Each lot ships with a certificate of analysis confirming
              identity and purity by HPLC/MS.{" "}
              <Link href="/quality" className="text-brand-teal-dark underline">
                View sample COAs
              </Link>
              . Storage: {product.storage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-brand-slate-light text-xs uppercase tracking-wide mb-1">{label}</dt>
      <dd className={`text-brand-navy font-medium break-words ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
