"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { useCart } from "@/lib/cart-context";
import { CoinIcon, BankIcon, CardIcon } from "@/components/icons";

type Method = "crypto" | "ach" | "card" | "paypal";

const GENERIC_ERROR =
  "We couldn't complete that. Please try again, or contact us if it keeps happening.";

interface ContactInfo {
  email: string;
  firstName: string;
  lastName: string;
}

export default function PaymentMethodSelector({ contact }: { contact: ContactInfo }) {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<Method>("crypto");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only SKUs and quantities are sent; the server prices the order.
  const orderItems = useMemo(
    () => items.map((i) => ({ sku: i.sku, qty: i.qty })),
    [items]
  );

  const contactComplete = Boolean(contact.email && contact.firstName && contact.lastName);

  // Crypto (Coinbase Commerce) and card (PayRam) both create a hosted
  // payment page server-side and redirect the browser to it.
  async function startHostedCheckout(endpoint: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contact.email,
          items: orderItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed.");
      clearCart();
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : GENERIC_ERROR);
      setBusy(false);
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-navy mb-3">Payment Method</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MethodTab
            active={method === "crypto"}
            onClick={() => setMethod("crypto")}
            icon={<CoinIcon className="h-5 w-5" />}
            label="Crypto"
          />
          <MethodTab
            active={method === "ach"}
            onClick={() => setMethod("ach")}
            icon={<BankIcon className="h-5 w-5" />}
            label="ACH Bank"
          />
          <MethodTab
            active={method === "card"}
            onClick={() => setMethod("card")}
            icon={<CardIcon className="h-5 w-5" />}
            label="Card"
          />
          <MethodTab disabled icon={<CardIcon className="h-5 w-5" />} label="PayPal" />
        </div>
      </div>

      {!contactComplete && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Please complete your contact information above before paying.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {method === "crypto" && (
        <div className="space-y-3">
          <p className="text-sm text-brand-slate-light leading-relaxed">
            You&apos;ll be redirected to a secure Coinbase Commerce checkout
            to complete payment using BTC, ETH, USDC, and other supported
            assets.
          </p>
          <button
            type="button"
            className="btn-primary w-full disabled:opacity-40"
            disabled={!contactComplete || items.length === 0 || busy}
            onClick={() => startHostedCheckout("/api/checkout/crypto")}
          >
            {busy ? "Redirecting…" : "Pay with Crypto"}
          </button>
        </div>
      )}

      {method === "ach" && (
        <AchFlow
          contact={contact}
          contactComplete={contactComplete}
          orderItems={orderItems}
          onError={setError}
          onSuccess={(orderId, demo) => {
            clearCart();
            router.push(`/checkout/success?method=ach&order=${orderId}${demo ? "&demo=1" : ""}`);
          }}
        />
      )}

      {method === "card" && (
        <div className="space-y-3">
          <p className="text-sm text-brand-slate-light leading-relaxed">
            You&apos;ll be redirected to a secure PayRam checkout to complete
            payment with Visa or Mastercard.
          </p>
          <button
            type="button"
            className="btn-primary w-full disabled:opacity-40"
            disabled={!contactComplete || items.length === 0 || busy}
            onClick={() => startHostedCheckout("/api/checkout/card-payram")}
          >
            {busy ? "Redirecting…" : "Pay with Card"}
          </button>
        </div>
      )}
    </div>
  );
}

function MethodTab({
  active,
  disabled,
  onClick,
  icon,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors ${
        active
          ? "border-brand-teal bg-brand-teal/10 text-brand-teal-dark"
          : disabled
          ? "cursor-not-allowed border-brand-line text-brand-slate-light/50"
          : "border-brand-line text-brand-slate hover:border-brand-teal"
      }`}
    >
      {icon}
      {label}
      {disabled && <span className="text-[10px]">Coming soon</span>}
    </button>
  );
}

function AchFlow({
  contact,
  contactComplete,
  orderItems,
  onError,
  onSuccess,
}: {
  contact: ContactInfo;
  contactComplete: boolean;
  orderItems: { sku: string; qty: number }[];
  onError: (msg: string | null) => void;
  onSuccess: (orderId: string, demo: boolean) => void;
}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    if (!contactComplete || linkToken) return;
    fetch("/api/checkout/ach/link-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: contact.email }),
    })
      .then((r) => r.json())
      .then((data) => setLinkToken(data.linkToken))
      .catch(() => onError("Unable to initialize bank connection."));
  }, [contactComplete, contact.email, linkToken, onError]);

  const onPlaidSuccess = useCallback(
    async (publicToken: string | null, metadata: { accounts: { id: string }[] }) => {
      if (!publicToken) {
        onError("Bank connection did not complete. Please try again.");
        return;
      }
      setBusy(true);
      onError(null);
      try {
        const accountId = metadata.accounts[0]?.id ?? "demo-account";
        const exchangeRes = await fetch("/api/checkout/ach/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken,
            accountId,
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
          }),
        });
        const exchangeData = await exchangeRes.json();
        if (!exchangeRes.ok) throw new Error(exchangeData.error ?? "Bank link failed.");
        setLinked(true);

        const transferRes = await fetch("/api/checkout/ach/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fundingSourceUrl: exchangeData.fundingSourceUrl,
            items: orderItems,
          }),
        });
        const transferData = await transferRes.json();
        if (!transferRes.ok) throw new Error(transferData.error ?? "Transfer failed.");

        onSuccess(transferData.orderId, Boolean(exchangeData.demo || transferData.demo));
      } catch (e) {
        onError(e instanceof Error ? e.message : GENERIC_ERROR);
      } finally {
        setBusy(false);
      }
    },
    [orderItems, contact, onError, onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-slate-light leading-relaxed">
        Securely connect your bank account via Plaid, then confirm to send
        an ACH bank transfer via Dwolla. ACH transfers typically settle in
        1–3 business days.
      </p>
      <button
        type="button"
        className="btn-primary w-full disabled:opacity-40"
        disabled={!contactComplete || !ready || orderItems.length === 0 || busy}
        onClick={() => open()}
      >
        {busy ? "Processing…" : linked ? "Bank Linked — Processing…" : "Connect Bank & Pay"}
      </button>
    </div>
  );
}
