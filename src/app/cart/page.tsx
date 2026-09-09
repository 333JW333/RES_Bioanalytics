"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatUSD } from "@/lib/format";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, isHydrated } = useCart();

  if (isHydrated && items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-brand-navy mb-3">Your cart is empty</h1>
        <p className="text-brand-slate-light mb-8">Browse the catalog to add research compounds.</p>
        <Link href="/shop" className="btn-primary">Browse Catalog</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-bold text-brand-navy mb-8">Your Cart</h1>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.sku} className="card flex items-center gap-4 p-4">
              <div className="flex-1">
                <Link href={`/shop/${item.slug}`} className="font-semibold text-brand-navy hover:text-brand-teal-dark">
                  {item.name}
                </Link>
                <p className="text-sm text-brand-slate-light">
                  {item.sizeLabel} · SKU {item.sku}
                </p>
              </div>
              <div className="inline-flex items-center rounded-lg border border-brand-line">
                <button
                  type="button"
                  onClick={() => updateQty(item.sku, item.qty - 1)}
                  className="h-9 w-9 text-brand-slate hover:text-brand-teal-dark"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  −
                </button>
                <span className="w-9 text-center text-sm font-semibold text-brand-navy">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.sku, item.qty + 1)}
                  className="h-9 w-9 text-brand-slate hover:text-brand-teal-dark"
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  +
                </button>
              </div>
              <span className="w-20 text-right font-semibold text-brand-navy">
                {formatUSD(item.unitPrice * item.qty)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.sku)}
                className="text-brand-slate-light hover:text-red-500 text-sm"
                aria-label={`Remove ${item.name} from cart`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="card p-6 h-fit space-y-4">
          <div className="flex items-center justify-between text-sm text-brand-slate">
            <span>Subtotal</span>
            <span className="font-semibold text-brand-navy">{formatUSD(subtotal)}</span>
          </div>
          <p className="text-xs text-brand-slate-light">
            Shipping and any applicable fees are calculated at checkout.
          </p>
          <Link href="/checkout" className="btn-primary w-full">
            Proceed to Checkout
          </Link>
          <Link href="/shop" className="block text-center text-sm text-brand-teal-dark hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
