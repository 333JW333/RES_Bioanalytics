import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatUSD } from "@/lib/format";
import { isSoldOut, startingPrice } from "@/lib/pricing";
import { VialIcon } from "@/components/icons";
import NotifyMeButton from "@/components/NotifyMeButton";

export default function ProductCard({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);

  // The product name's link is stretched over the whole card (after:inset-0)
  // so the card still opens the product anywhere it's clicked, while the
  // Notify Me button sits above it (z-10) and takes its own clicks. A button
  // can't go inside the link itself.
  return (
    <div className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-brand-ice">
        {product.images?.front ? (
          <Image
            src={product.images.front}
            alt={`${product.name} vial`}
            fill
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 90vw"
            className="object-contain p-8 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-navy to-brand-navy-2">
            <VialIcon className="h-16 w-16 transition-transform group-hover:scale-105" />
          </div>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-navy px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Coming Soon
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-teal-dark">
          {product.category}
        </span>
        <h3 className="text-base font-semibold text-brand-navy">
          <Link
            href={`/shop/${product.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-brand-slate-light line-clamp-2">
          {product.shortDescription}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          {soldOut ? (
            <span className="text-sm font-semibold text-brand-slate-light">Coming soon</span>
          ) : (
            <span className="text-sm font-semibold text-brand-navy">
              From {formatUSD(startingPrice(product))}
            </span>
          )}
          <span className="text-xs font-medium text-brand-teal-dark">
            {product.purity}
          </span>
        </div>
        {soldOut && (
          <div className="relative z-10 pt-2">
            <NotifyMeButton slug={product.slug} name={product.name} />
          </div>
        )}
      </div>
    </div>
  );
}
