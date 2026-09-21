import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { formatUSD } from "@/lib/format";
import { VialIcon } from "@/components/icons";

export default function ProductCard({ product }: { product: Product }) {
  const lowestPrice = Math.min(...product.sizes.map((s) => s.price));

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-sm border border-brand-line bg-white transition-colors hover:border-brand-navy/40"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-ice">
        {product.images ? (
          <Image
            src={product.images.front}
            alt={`${product.name} vial`}
            fill
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 90vw"
            className="object-contain p-8 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-navy">
            <VialIcon className="h-16 w-16 transition-transform group-hover:scale-105" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-blue">
          {product.category}
        </span>
        <h3 className="text-base font-semibold text-brand-navy">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-brand-slate-light">
          {product.shortDescription}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-semibold text-brand-navy">
            From {formatUSD(lowestPrice)}
          </span>
          <span className="badge-verified !px-2 !py-0.5 text-[10px]">{product.purity}</span>
        </div>
      </div>
    </Link>
  );
}
