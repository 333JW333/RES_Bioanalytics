"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { useCart } from "@/lib/cart-context";
import { formatUSD } from "@/lib/format";

export default function AddToCartPanel({ product }: { product: Product }) {
  const [sizeIndex, setSizeIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  const size = product.sizes[sizeIndex];

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        sizeLabel: size.label,
        sku: size.sku,
        unitPrice: size.price,
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

  return (
    <div className="card p-6 space-y-5">
      <div>
        <span className="text-3xl font-bold text-brand-navy">{formatUSD(size.price)}</span>
        <span className="ml-2 text-sm text-brand-slate-light">/ {size.label}</span>
      </div>

      <div>
        <p className="text-sm font-semibold text-brand-navy mb-2">Size</p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s, i) => (
            <button
              key={s.sku}
              type="button"
              onClick={() => setSizeIndex(i)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                i === sizeIndex
                  ? "border-brand-teal bg-brand-teal/10 text-brand-teal-dark"
                  : "border-brand-line text-brand-slate hover:border-brand-teal"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

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

      <div className="flex flex-col gap-3 pt-2">
        <button type="button" onClick={handleBuyNow} className="btn-primary w-full">
          Buy Now
        </button>
        <button type="button" onClick={handleAdd} className="btn-secondary w-full">
          {justAdded ? "Added ✓" : "Add to Cart"}
        </button>
      </div>

      <p className="text-[11px] text-brand-slate-light leading-relaxed border-t border-brand-line pt-4">
        SKU: {size.sku} · For laboratory research use only. Not for human or
        animal consumption. By adding this item to your cart you confirm
        acceptance of our{" "}
        <a href="/legal/ruo-policy" className="underline">RUO Policy</a>.
      </p>
    </div>
  );
}
