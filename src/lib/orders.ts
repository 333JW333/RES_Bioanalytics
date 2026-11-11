import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUSINESS_TYPES } from "@/lib/gate";
import type { CheckoutBuyer } from "@/lib/payments/types";
import type { PricedLine } from "@/lib/pricing";

/**
 * Bump this whenever the RUO Policy or Terms of Sale text changes, so each
 * order records which version the buyer attested to.
 */
export const RUO_POLICY_VERSION = "2026-09-26";

export interface Buyer {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  businessType: string | null;
  ein: string | null;
  termsAcceptedAt: string | null;
}

export type BuyerResult = { ok: true; buyer: Buyer } | { ok: false; status: number; error: string };

/**
 * The /api/* routes are not covered by the sign-in gate in src/proxy.ts, so
 * every payment route must check for itself that the caller is a signed-in,
 * registered buyer who accepted the research-use terms at registration.
 */
export async function requireBuyer(): Promise<BuyerResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || typeof claims.email !== "string") {
    return { ok: false, status: 401, error: "Please sign in to check out." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, business_type, ein, terms_accepted_at")
    .eq("id", claims.sub)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      business_type: string | null;
      ein: string | null;
      terms_accepted_at: string | null;
    }>();

  if (!profile?.terms_accepted_at) {
    return {
      ok: false,
      status: 403,
      error: "Your account hasn't accepted the research-use terms. Please contact support.",
    };
  }

  return {
    ok: true,
    buyer: {
      userId: claims.sub,
      email: claims.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      businessType: profile.business_type,
      ein: profile.ein,
      termsAcceptedAt: profile.terms_accepted_at,
    },
  };
}

/** Business/institution accounts with an EIN on file can request Net 30 invoices. */
export function isInvoiceEligible(buyer: Buyer): boolean {
  return buyer.businessType === BUSINESS_TYPES[0] && Boolean(buyer.ein?.trim());
}

export function attestationEvidence(req: NextRequest) {
  return {
    ruo_attested_at: new Date().toISOString(),
    ruo_attestation_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    ruo_attestation_user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
    ruo_policy_version: RUO_POLICY_VERSION,
  };
}

/** What a payment processor needs to know about the buyer. */
export function checkoutBuyer(buyer: Buyer): CheckoutBuyer {
  return {
    userId: buyer.userId,
    email: buyer.email,
    name: [buyer.firstName, buyer.lastName].filter(Boolean).join(" ") || null,
  };
}

/** The short reference customers see, e.g. "7473F34D". */
export function formatOrderRef(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

/** Total in cents, priced the same way processors charge it (per-unit cents × qty). */
export function amountCentsFor(lines: PricedLine[]): number {
  return lines.reduce((sum, l) => sum + Math.round(l.unitPrice * 100) * l.qty, 0);
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "paid"
  | "payment_failed"
  | "canceled"
  | "refunded"
  | "partially_refunded"
  | "disputed"
  | "invoice_requested";

export interface NewOrder {
  buyer: Buyer;
  processor: string;
  flow: "checkout" | "invoice";
  status: "pending" | "invoice_requested";
  lines: PricedLine[];
  amountCents: number;
  evidence: ReturnType<typeof attestationEvidence>;
  poNumber?: string | null;
}

export async function insertOrder(o: NewOrder): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .insert({
      user_id: o.buyer.userId,
      email: o.buyer.email,
      status: o.status,
      processor: o.processor,
      payment_flow: o.flow,
      amount_cents: o.amountCents,
      items: o.lines,
      profile_terms_accepted_at: o.buyer.termsAcceptedAt,
      po_number: o.poNumber || null,
      ...o.evidence,
    })
    .select("id")
    .single<{ id: string }>();
  if (error || !data) throw new Error(`Could not create order: ${error?.message ?? "no row"}`);
  return data.id;
}

export async function updateOrder(orderId: string, fields: Record<string, unknown>) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw new Error(`Could not update order ${orderId}: ${error.message}`);
}
