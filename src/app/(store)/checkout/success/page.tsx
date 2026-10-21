import Link from "next/link";
import { ShieldCheckIcon } from "@/components/icons";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured, retrieveCheckoutSession } from "@/lib/payments/stripe";

type StripeView =
  | { kind: "paid"; orderId: string | null }
  | { kind: "processing"; orderId: string | null }
  | { kind: "unconfirmed" };

/**
 * Looks the Checkout Session up with Stripe instead of trusting the URL, and
 * only for the signed-in buyer who created it. Display only — the webhook is
 * what marks the order paid.
 */
async function loadStripeSession(sessionId: string): Promise<StripeView> {
  if (!isStripeConfigured()) return { kind: "unconfirmed" };
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const session = await retrieveCheckoutSession(sessionId);
    if (!data?.claims?.sub || session.client_reference_id !== data.claims.sub) {
      return { kind: "unconfirmed" };
    }
    const orderId = session.metadata?.order_id ?? null;
    if (session.payment_status === "paid") return { kind: "paid", orderId };
    if (session.status === "complete") return { kind: "processing", orderId };
    return { kind: "unconfirmed" };
  } catch (err) {
    console.error("Could not load Checkout Session", err);
    return { kind: "unconfirmed" };
  }
}

const METHOD_LABEL: Record<string, string> = {
  ach: "ACH bank transfer",
  card: "card",
  crypto: "crypto",
  invoice: "invoice",
};

export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success">
) {
  const searchParams = await props.searchParams;
  const demo = searchParams.demo === "1";
  const method = typeof searchParams.method === "string" ? searchParams.method : "crypto";
  const sessionId =
    typeof searchParams.session_id === "string" ? searchParams.session_id : undefined;

  const stripe = sessionId ? await loadStripeSession(sessionId) : null;
  const order =
    stripe && stripe.kind !== "unconfirmed"
      ? stripe.orderId
      : typeof searchParams.order === "string" && !sessionId
        ? searchParams.order
        : undefined;

  if (stripe?.kind === "unconfirmed") {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold text-brand-navy mb-3">Payment not confirmed</h1>
        <p className="text-brand-slate-light max-w-md mx-auto mb-8">
          We couldn&apos;t confirm this payment. If you were charged, you&apos;ll
          receive a confirmation email shortly — otherwise please return to
          checkout and try again.
        </p>
        <Link href="/checkout" className="btn-primary">Back to Checkout</Link>
      </div>
    );
  }

  const isInvoice = method === "invoice";
  const heading = isInvoice ? "Invoice Requested" : "Order Received";
  const body = isInvoice
    ? "We'll review your order and email a Net 30 invoice. Your order ships once the invoice is paid."
    : stripe?.kind === "processing"
      ? "Your payment is processing. We'll email you once it clears, and your order will ship after that."
      : `Thank you for your order via ${METHOD_LABEL[method] ?? "your selected method"}. A confirmation email with tracking details will follow once payment is verified.`;

  return (
    <div className="container-page py-24 text-center">
      {(stripe || demo) && <ClearCartOnMount />}
      <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal-dark">
        <ShieldCheckIcon className="h-7 w-7" />
      </span>
      <h1 className="text-3xl font-bold text-brand-navy mb-3">{heading}</h1>
      <p className="text-brand-slate-light max-w-md mx-auto mb-2">{body}</p>
      {order && (
        <p className="text-sm text-brand-slate-light mb-8">
          Order reference: <span className="font-mono text-brand-navy">{order}</span>
        </p>
      )}
      {demo && (
        <p className="max-w-md mx-auto mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Demo mode: no live payment processor keys are configured yet, so
          this order was simulated. Add your Stripe / Coinbase Commerce /
          Plaid / Dwolla credentials to process real payments.
        </p>
      )}
      <Link href="/shop" className="btn-primary">Continue Shopping</Link>
    </div>
  );
}
