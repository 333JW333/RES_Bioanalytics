import { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { getAllProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop Research Peptides",
  description: "Browse the full RES Bioanalytics catalog of COA-verified research peptides and compounds.",
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;
  const products = getAllProducts();
  const categoryParam = searchParams?.category;
  const category = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;
  const filtered = category ? products.filter((p) => p.category === category) : products;
  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="container-page py-14">
      <div className="mb-10">
        <span className="badge-ruo mb-4">Research Use Only</span>
        <h1 className="text-3xl font-bold text-brand-navy">Research Catalog</h1>
        <p className="text-brand-slate-light mt-2 max-w-2xl">
          {products.length} products currently available. Every listing
          includes purity data and a certificate of analysis for the
          matching lot.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <FilterPill href="/shop" active={!category} label="All" />
        {categories.map((c) => (
          <FilterPill key={c} href={`/shop?category=${encodeURIComponent(c)}`} active={category === c} label={c} />
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-brand-slate-light">No products found in this category yet.</p>
      )}
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-teal bg-brand-teal/10 text-brand-teal-dark"
          : "border-brand-line text-brand-slate hover:border-brand-teal"
      }`}
    >
      {label}
    </a>
  );
}
