import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { getAllProducts, getCategories } from "@/data/products";
import { isSoldOut } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Shop Research Peptides",
  description: "Browse the full EcoPeps catalog of COA-verified research peptides and compounds.",
};

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;
  const products = getAllProducts();
  const categoryParam = searchParams.category;
  const category = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;
  const filtered = category ? products.filter((p) => p.category === category) : products;
  const categories = getCategories();
  const inStockCount = products.filter((p) => !isSoldOut(p)).length;

  return (
    <div className="container-page py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-brand-navy">Research Catalog</h1>
        <p className="text-brand-slate-light mt-2 max-w-2xl">
          {inStockCount} products in stock now, each with third-party
          certificates of analysis for its current batch
          {products.length > inStockCount &&
            `, and ${products.length - inStockCount} coming soon`}
          .
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
