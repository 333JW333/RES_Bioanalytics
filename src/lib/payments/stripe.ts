import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Stripe REST client built on fetch, matching how this app talks to
 * its other providers (src/lib/payments/*). It covers only the calls the
 * checkout, invoice and webhook routes make.
 *
 * Keys: use a sandbox/test key (sk_test_… or a restricted rk_test_…) until
 * Stripe has confirmed in writing that the account is supportable. In live
 * mode prefer a restricted key with write access to Checkout Sessions,
 * Customers, Invoices and Invoice Items, and read access to Charges,
 * Payment Intents and Invoice Payments.
 */

const API_BASE = "https://api.stripe.com/v1";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

type Param = string | number | boolean | null | undefined | Param[] | { [key: string]: Param };

/**
 * Encodes nested params the way Stripe's API expects:
 * { line_items: [{ price_data: { currency: "usd" } }] }
 *   → line_items[0][price_data][currency]=usd
 */
export function encodeStripeParams(params: Record<string, Param>): URLSearchParams {
  const out = new URLSearchParams();
  const walk = (prefix: string, value: Param) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(`${prefix}[${i}]`, v));
    } else if (typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(`${prefix}[${k}]`, v);
    } else {
      out.append(prefix, String(value));
    }
  };
  for (const [k, v] of Object.entries(params)) walk(k, v);
  return out;
}

export class StripeApiError extends Error {
  status: number;
  type: string | undefined;
  code: string | undefined;

  constructor(status: number, type: string | undefined, code: string | undefined, message: string) {
    super(message);
    this.name = "StripeApiError";
    this.status = status;
    this.type = type;
    this.code = code;
  }
}

async function stripeRequest<T>(
  method: "GET" | "POST",
  path: string,
  params: Record<string, Param> = {},
  opts: { idempotencyKey?: string } = {}
): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");

  const encoded = encodeStripeParams(params);
  const query = encoded.toString();
  const url = method === "GET" && query ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`;

  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  // Pin the API version once you've picked one (Dashboard → Developers);
  // without it Stripe uses the account's default version.
  if (process.env.STRIPE_API_VERSION) headers["Stripe-Version"] = process.env.STRIPE_API_VERSION;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";

  const res = await fetch(url, {
    method,
    headers,
    body: method === "POST" ? encoded : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error ?? {};
    throw new StripeApiError(res.status, err.type, err.code, err.message ?? `Stripe error (${res.status})`);
  }
  return json as T;
}

// ---- Object shapes (only the fields this app reads) ----------------------

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  client_reference_id: string | null;
  payment_intent: string | null;
  customer: string | null;
  metadata: Record<string, string>;
  collected_information?: { shipping_details?: unknown } | null;
  shipping_details?: unknown;
}

export interface StripeInvoice {
  id: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  metadata: Record<string, string>;
  hosted_invoice_url?: string | null;
}

export interface StripeCharge {
  id: string;
  amount: number;
  amount_refunded: number;
  refunded: boolean;
  payment_intent: string | null;
}

export interface StripeDispute {
  id: string;
  charge: string;
  payment_intent: string | null;
}

export interface StripeEvent<T = unknown> {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: T };
}

// ---- Calls ---------------------------------------------------------------

export function createCustomer(p: { email: string; name?: string; userId: string }) {
  return stripeRequest<{ id: string }>(
    "POST",
    "/customers",
    { email: p.email, name: p.name, metadata: { user_id: p.userId } },
    { idempotencyKey: `customer-${p.userId}` }
  );
}

export function createCheckoutSession(params: Record<string, Param>, idempotencyKey: string) {
  return stripeRequest<StripeCheckoutSession>("POST", "/checkout/sessions", params, { idempotencyKey });
}

export function retrieveCheckoutSession(id: string) {
  return stripeRequest<StripeCheckoutSession>("GET", `/checkout/sessions/${encodeURIComponent(id)}`);
}

export function createDraftInvoice(params: Record<string, Param>, idempotencyKey: string) {
  return stripeRequest<StripeInvoice>("POST", "/invoices", params, { idempotencyKey });
}

export function createInvoiceItem(params: Record<string, Param>, idempotencyKey: string) {
  return stripeRequest<{ id: string }>("POST", "/invoiceitems", params, { idempotencyKey });
}

export function retrieveCharge(id: string) {
  return stripeRequest<StripeCharge>("GET", `/charges/${encodeURIComponent(id)}`);
}

/** The invoice a PaymentIntent paid, if any (invoice payments aren't tagged with our metadata). */
export async function findInvoiceIdForPaymentIntent(paymentIntentId: string): Promise<string | null> {
  try {
    const list = await stripeRequest<{ data: { invoice: string }[] }>("GET", "/invoice_payments", {
      payment: { type: "payment_intent", payment_intent: paymentIntentId },
      limit: 1,
    });
    return list.data[0]?.invoice ?? null;
  } catch {
    return null;
  }
}

// ---- Webhook signature verification -------------------------------------

const DEFAULT_TOLERANCE_SECONDS = 300;

/**
 * Verifies a `Stripe-Signature` header against the raw request body and
 * returns the parsed event. Scheme: HMAC-SHA256 of `${t}.${payload}` with the
 * endpoint's signing secret, compared against every `v1` signature, with a
 * timestamp tolerance to block replays.
 */
export function constructWebhookEvent(
  payload: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
  nowSeconds = Math.floor(Date.now() / 1000)
): StripeEvent {
  if (!signatureHeader) throw new Error("Missing Stripe-Signature header.");

  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [k, v] = part.split("=", 2);
    if (k === "t") timestamp = Number(v);
    else if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || !Number.isFinite(timestamp) || signatures.length === 0) {
    throw new Error("Malformed Stripe-Signature header.");
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest();
  const matched = signatures.some((sig) => {
    const given = Buffer.from(sig, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!matched) throw new Error("Stripe signature mismatch.");
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
    throw new Error("Stripe signature timestamp outside tolerance.");
  }

  return JSON.parse(payload) as StripeEvent;
}

/** Dollars (as priced by src/lib/pricing.ts) to integer cents. */
export function toCents(amountUsd: number): number {
  return Math.round(amountUsd * 100);
}
