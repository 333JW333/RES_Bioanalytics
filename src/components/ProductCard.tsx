import Link from "next/link";
import { Product } from "@/types/product";
import { formatUSD } from "@/lib/format";
import { VialIcon } from "@/components/icons";

export default function ProductCard({ product }: { product: Product }) {
  const lowestPrice = Math.min(...product.sizes.map((s) => s.price));

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
    >
      <div className="flex items-center justify-center bg-gradient-to-br from-brand-navy to-brand-navy-2 py-10">
        <VialIcon className="h-16 w-16 transition-transform group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-teal-dark">
          {product.category}
        </span>
        <h3 className="text-base font-semibold text-brand-navy">{product.name}</h3>
        <p className="text-sm text-brand-slate-light line-clamp-2">
          {product.shortDescription}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-semibold text-brand-navy">
            From {formatUSD(lowestPrice)}
          </span>
          <span className="text-xs font-medium text-brand-teal-dark">
            {product.purity}
          </span>
        </div>
      </div>
    </Link>
  );
}
