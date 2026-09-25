"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductSize } from "@/types/product";
import { useCart } from "@/lib/cart-context";
import { formatUSD } from "@/lib/format";
import { discountedPrice, isSoldOut } from "@/lib/pricing";
import NotifyMeButton from "@/components/NotifyMeButton";

export default function AddToCartPanel({ product }: { product: Product }) {
  const defaultSizeIndex = Math.max(
    0,
    product.sizes.findIndex((s) => s.inStock !== false)
  );
  const [sizeIndex, setSizeIndex] = useState(defaultSizeIndex);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  const size = product.sizes[sizeIndex];
  const tiers = product.volumeTiers ?? [];
  const activeTier = [...tiers].reverse().find((t) => qty >= t.minQty);
  const discountPercent = activeTier?.discountPercent ?? 0;
  const unitPrice = discountedPrice(size.price, discountPercent);
  const quickPicks = Array.from(new Set([1, ...tiers.map((t) => t.minQty)])).sort(
    (a, b) => a - b
  );

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        sizeLabel: size.label,
        sku: size.sku,
      },
      qty
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  function handleBuyNow() {
    handleAdd();
    router.push("/cart");
  }

  if (isSoldOut(product)) {
    return (
      <div className="card p-6 space-y-5">
        <div>
          <span className="text-3xl font-bold text-brand-navy">Out of Stock</span>
          <p className="mt-1 text-sm text-brand-slate-light">
            Back once the next batch passes third-party COA testing.
          </p>
        </div>
        <SizeOptions sizes={product.sizes} selected={sizeIndex} onSelect={setSizeIndex} />
        <NotifyMeButton slug={product.slug} name={product.name} />
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-5">
      <div>
        {discountPercent > 0 ? (
          <>
            <span className="text-3xl font-bold text-brand-navy">{formatUSD(unitPrice)}</span>
            <span className="ml-2 text-base font-medium text-brand-slate-light line-through">
              {formatUSD(size.price)}
            </span>
            <span className="ml-2 rounded-full bg-brand-teal/10 px-2 py-0.5 text-xs font-semibold text-brand-teal-dark">
              {discountPercent}% off
            </span>
          </>
        ) : (
          <span className="text-3xl font-bold text-brand-navy">{formatUSD(size.price)}</span>
        )}
        <span className="ml-2 text-sm text-brand-slate-light">/ {size.label}</span>
      </div>

      <SizeOptions sizes={product.sizes} selected={sizeIndex} onSelect={setSizeIndex} />

      <div>
        <p className="text-sm font-semibold text-brand-navy mb-2">Quantity</p>
        <div className="inline-flex items-center rounded-lg border border-brand-line">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-10 w-10 text-lg text-brand-slate hover:text-brand-teal-dark"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold text-brand-navy">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="h-10 w-10 text-lg text-brand-slate hover:text-brand-teal-dark"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {quickPicks.length > 1 && (
        <div>
          <p className="text-sm font-semibold text-brand-navy mb-2">Quick Pick</p>
          <div className="flex flex-wrap gap-2">
            {quickPicks.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQty(q)}
                className={`h-9 w-9 rounded-full border text-sm font-medium transition-colors ${
                  q === qty
                    ? "border-brand-teal bg-brand-teal/10 text-brand-teal-dark"
                    : "border-brand-line text-brand-slate hover:border-brand-teal"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <button type="button" onClick={handleBuyNow} className="btn-primary w-full">
          Buy Now
        </button>
        <button type="button" onClick={handleAdd} className="btn-secondary w-full">
          {justAdded ? "Added ✓" : "Add to Cart"}
        </button>
      </div>

      {tiers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-brand-line">
          <div className="bg-brand-ice px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-brand-slate-light">
            Volume Pricing
          </div>
          <div className="divide-y divide-brand-line">
            {tiers.map((tier) => {
              const tierUnitPrice = discountedPrice(size.price, tier.discountPercent);
              const isActive = activeTier?.label === tier.label;
              return (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => setQty(tier.minQty)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${
                    isActive ? "bg-brand-teal/5" : "hover:bg-brand-ice"
                  }`}
                >
                  <span className={isActive ? "font-semibold text-brand-teal-dark" : "text-brand-slate"}>
                    {tier.label}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-brand-navy">
                      {formatUSD(tierUnitPrice)} ea
                    </span>
                    <span className="text-xs font-semibold text-brand-teal-dark">
                      {tier.discountPercent}% off
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[11px] text-brand-slate-light leading-relaxed border-t border-brand-line pt-4">
        For laboratory research use only. Not for human or
        animal consumption. By adding this item to your cart you confirm
        acceptance of our{" "}
        <a href="/legal/ruo-policy" className="underline">RUO Policy</a>.
      </p>
    </div>
  );
}

function SizeOptions({
  sizes,
  selected,
  onSelect,
}: {
  sizes: ProductSize[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-navy mb-2">Size</p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s, i) => {
          const outOfStock = s.inStock === false;
          return (
            <button
              key={s.sku}
              type="button"
              disabled={outOfStock}
              onClick={() => !outOfStock && onSelect(i)}
              title={outOfStock ? `${s.label} — awaiting batch-specific COA verification` : undefined}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                outOfStock
                  ? "cursor-not-allowed border-brand-line text-brand-slate-light/60 bg-brand-ice"
                  : i === selected
                    ? "border-brand-teal bg-brand-teal/10 text-brand-teal-dark"
                    : "border-brand-line text-brand-slate hover:border-brand-teal"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {sizes.some((s) => s.inStock === false) && (
        <p className="mt-2 text-xs text-brand-slate-light">
          *Restock quantities are waiting on COA verifications
        </p>
      )}
    </div>
  );
}
