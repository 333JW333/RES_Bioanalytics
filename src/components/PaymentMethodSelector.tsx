"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";
import { useCart } from "@/lib/cart-context";
import { CoinIcon, BankIcon, CardIcon } from "@/components/icons";

type Method = "crypto" | "ach" | "card" | "invoice";

const TABS: { method: Method; label: string; Icon: typeof CardIcon }[] = [
  { method: "crypto", label: "Crypto", Icon: CoinIcon },
  { method: "ach", label: "ACH Bank", Icon: BankIcon },
  { method: "card", label: "Card or Bank", Icon: CardIcon },
  { method: "invoice", label: "Invoice", Icon: BankIcon },
];

// Crypto (Coinbase Commerce) and ACH (Plaid + Dwolla) are hidden until those
// accounts are set up; add them back here to show them again. Shoppers can
// still pay from a U.S. bank account on the processor's page, from the Card tab.
const SHOWN_METHODS: Method[] = ["card", "invoice"];

interface ContactInfo {
  email: string;
  firstName: string;
  lastName: string;
}

export default function PaymentMethodSelector({ contact }: { contact: ContactInfo }) {
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<Method>(SHOWN_METHODS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only SKUs and quantities are sent; the server prices the order.
  const orderItems = useMemo(
    () => items.map((i) => ({ sku: i.sku, qty: i.qty })),
    [items]
  );

  const contactComplete = Boolean(contact.email && contact.firstName && contact.lastName);

  // Crypto (Coinbase Commerce) and card (the active payment processor) both create a
  // hosted payment page server-side and redirect the browser to it. The
  // payment method selector is only shown once the research-use attestation
  // on the checkout page is ticked, so it's sent as confirmed.
  async function startHostedCheckout(endpoint: string, { clearFirst }: { clearFirst: boolean }) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contact.email,
          items: orderItems,
          ruoAttested: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed.");
      // Card orders keep the cart until payment succeeds, so a buyer who
      // backs out of Checkout returns to a full cart (the success page clears it).
      if (clearFirst) clearCart();
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-navy mb-3">Payment Method</p>
        <div className={`grid grid-cols-2 gap-3 ${SHOWN_METHODS.length > 2 ? "sm:grid-cols-4" : ""}`}>
          {TABS.filter((t) => SHOWN_METHODS.includes(t.method)).map(({ method: m, label, Icon }) => (
            <MethodTab
              key={m}
              active={method === m}
              onClick={() => setMethod(m)}
              icon={<Icon className="h-5 w-5" />}
              label={label}
            />
          ))}
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
            onClick={() => startHostedCheckout("/api/checkout/crypto", { clearFirst: true })}
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
            You&apos;ll be redirected to our secure payment page to pay by
            card or U.S. bank account and confirm your U.S. shipping address.
          </p>
          <button
            type="button"
            className="btn-primary w-full disabled:opacity-40"
            disabled={!contactComplete || items.length === 0 || busy}
            onClick={() => startHostedCheckout("/api/checkout/card", { clearFirst: false })}
          >
            {busy ? "Redirecting…" : "Continue to Secure Checkout"}
          </button>
        </div>
      )}

      {method === "invoice" && (
        <InvoiceFlow
          contactComplete={contactComplete}
          orderItems={orderItems}
          onError={setError}
          onSuccess={(orderId, demo) => {
            clearCart();
            const params = new URLSearchParams({ method: "invoice" });
            if (orderId) params.set("order", orderId);
            if (demo) params.set("demo", "1");
            router.push(`/checkout/success?${params}`);
          }}
        />
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
        onError(e instanceof Error ? e.message : "Something went wrong.");
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

function InvoiceFlow({
  contactComplete,
  orderItems,
  onError,
  onSuccess,
}: {
  contactComplete: boolean;
  orderItems: { sku: string; qty: number }[];
  onError: (msg: string | null) => void;
  onSuccess: (orderId: string | null, demo: boolean) => void;
}) {
  const [poNumber, setPoNumber] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestInvoice() {
    onError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: orderItems, poNumber, ruoAttested: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invoice request failed.");
      onSuccess(data.orderId ?? null, Boolean(data.demo));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-slate-light leading-relaxed">
        For business and institution accounts with an EIN on file. We review
        your order, then email a Net 30 invoice you can pay by bank transfer
        or card. Orders ship once the invoice is paid.
      </p>
      <label className="block">
        <span className="block text-xs font-medium text-brand-slate-light mb-1">
          PO number (optional)
        </span>
        <input
          type="text"
          value={poNumber}
          maxLength={100}
          onChange={(e) => setPoNumber(e.target.value)}
          className="input"
        />
      </label>
      <button
        type="button"
        className="btn-primary w-full disabled:opacity-40"
        disabled={!contactComplete || orderItems.length === 0 || busy}
        onClick={requestInvoice}
      >
        {busy ? "Submitting…" : "Request Invoice"}
      </button>
    </div>
  );
}
