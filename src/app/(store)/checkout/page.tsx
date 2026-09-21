"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatUSD } from "@/lib/format";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";

export default function CheckoutPage() {
  const { items, subtotal, isHydrated } = useCart();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [agreed, setAgreed] = useState(false);

  if (isHydrated && items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-brand-navy mb-3">Nothing to check out</h1>
        <p className="text-brand-slate-light mb-8">Your cart is currently empty.</p>
        <Link href="/shop" className="btn-primary">Browse Catalog</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-bold text-brand-navy mb-8">Checkout</h1>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-brand-navy">Contact &amp; Billing Info</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  required
                />
              </Field>
              <Field label="Last Name">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                  required
                />
              </Field>
            </div>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </Field>
          </div>

          <div className="card p-6">
            <label className="flex items-start gap-3 text-sm text-brand-navy cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-brand-line accent-teal-600"
              />
              <span>
                I certify that I am purchasing these products solely for
                laboratory, analytical, or research use by a qualified
                individual or institution, and not for human or animal
                consumption. I have read and agree to the{" "}
                <Link href="/legal/ruo-policy" className="text-brand-teal-dark underline">
                  RUO Policy
                </Link>{" "}
                and{" "}
                <Link href="/legal/terms" className="text-brand-teal-dark underline">
                  Terms of Sale
                </Link>
                .
              </span>
            </label>
          </div>

          {agreed ? (
            <PaymentMethodSelector contact={{ email, firstName, lastName }} />
          ) : (
            <div className="card p-6 text-sm text-brand-slate-light">
              Please confirm the research-use attestation above to reveal
              payment options.
            </div>
          )}
        </div>

        <div className="card p-6 h-fit space-y-4">
          <h2 className="font-semibold text-brand-navy">Order Summary</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.sku} className="flex justify-between text-sm text-brand-slate">
                <span>
                  {item.qty}× {item.name} ({item.sizeLabel})
                </span>
                <span className="font-medium text-brand-navy">
                  {formatUSD(item.unitPrice * item.qty)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-brand-line pt-4 flex justify-between text-sm">
            <span className="text-brand-slate">Subtotal</span>
            <span className="font-semibold text-brand-navy">{formatUSD(subtotal)}</span>
          </div>
          <p className="text-[11px] text-brand-slate-light">
            Shipping calculated separately after order confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-brand-slate-light mb-1">{label}</span>
      {children}
    </label>
  );
}
