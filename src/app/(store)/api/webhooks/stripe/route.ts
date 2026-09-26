import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  constructWebhookEvent,
  findInvoiceIdForPaymentIntent,
  retrieveCharge,
  type StripeCharge,
  type StripeCheckoutSession,
  type StripeDispute,
  type StripeEvent,
  type StripeInvoice,
} from "@/lib/payments/stripe";

/**
 * Stripe webhook — the source of truth for order status.
 *
 * Subscribe the endpoint (https://www.ecopeps.com/api/webhooks/stripe) to:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired,
 *   invoice.paid, invoice.payment_failed, invoice.voided,
 *   invoice.marked_uncollectible, charge.refunded, charge.dispute.created
 *
 * Status changes only move forward from the states listed for each event,
 * so a late or re-delivered event can't undo a refund or a dispute.
 */

type Admin = ReturnType<typeof createAdminClient>;
type Status =
  | "pending"
  | "processing"
  | "paid"
  | "payment_failed"
  | "canceled"
  | "refunded"
  | "partially_refunded"
  | "disputed"
  | "invoice_requested";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set; rejecting webhook");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  // Signature is computed over the exact bytes Stripe sent, so read the raw body.
  const payload = await req.text();
  let event: StripeEvent;
  try {
    event = constructWebhookEvent(payload, req.headers.get("stripe-signature"), secret);
  } catch (err) {
    console.warn("Rejected Stripe webhook:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: skip events already processed; retry ones that failed midway.
  const { data: seen } = await admin
    .from("stripe_events")
    .select("processed_at")
    .eq("id", event.id)
    .maybeSingle<{ processed_at: string | null }>();
  if (seen?.processed_at) return NextResponse.json({ received: true, duplicate: true });
  if (!seen) {
    await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  }

  try {
    await handleEvent(admin, event);
  } catch (err) {
    // Non-2xx makes Stripe retry with backoff.
    console.error(`Stripe webhook ${event.type} (${event.id}) failed:`, err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  await admin
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", event.id);
  return NextResponse.json({ received: true });
}

async function handleEvent(admin: Admin, event: StripeEvent) {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as StripeCheckoutSession;
      const orderId = s.metadata?.order_id;
      if (!orderId) return;
      const shipping = s.collected_information?.shipping_details ?? s.shipping_details ?? null;
      const base = { stripe_payment_intent_id: s.payment_intent, shipping };
      if (s.payment_status === "paid") {
        await transition(admin, orderId, ["pending", "processing", "payment_failed"], {
          ...base,
          status: "paid",
          paid_at: new Date().toISOString(),
        });
      } else {
        // Delayed-notification methods (e.g. ACH debit) complete checkout before funds settle.
        await transition(admin, orderId, ["pending"], { ...base, status: "processing" });
      }
      return;
    }
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object as StripeCheckoutSession;
      if (!s.metadata?.order_id) return;
      await transition(admin, s.metadata.order_id, ["pending", "processing"], {
        status: "paid",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: s.payment_intent,
      });
      return;
    }
    case "checkout.session.async_payment_failed": {
      const s = event.data.object as StripeCheckoutSession;
      if (!s.metadata?.order_id) return;
      await transition(admin, s.metadata.order_id, ["pending", "processing"], {
        status: "payment_failed",
      });
      return;
    }
    case "checkout.session.expired": {
      const s = event.data.object as StripeCheckoutSession;
      if (!s.metadata?.order_id) return;
      await transition(admin, s.metadata.order_id, ["pending"], { status: "canceled" });
      return;
    }
    case "invoice.paid": {
      const inv = event.data.object as StripeInvoice;
      if (!inv.metadata?.order_id) return;
      await transition(admin, inv.metadata.order_id, ["invoice_requested", "processing", "payment_failed"], {
        status: "paid",
        paid_at: new Date().toISOString(),
      });
      return;
    }
    case "invoice.payment_failed":
    case "invoice.marked_uncollectible": {
      const inv = event.data.object as StripeInvoice;
      if (!inv.metadata?.order_id) return;
      await transition(admin, inv.metadata.order_id, ["invoice_requested", "processing"], {
        status: "payment_failed",
      });
      return;
    }
    case "invoice.voided": {
      const inv = event.data.object as StripeInvoice;
      if (!inv.metadata?.order_id) return;
      await transition(admin, inv.metadata.order_id, ["invoice_requested", "payment_failed"], {
        status: "canceled",
      });
      return;
    }
    case "charge.refunded": {
      const charge = event.data.object as StripeCharge;
      const orderId = await orderIdForPaymentIntent(admin, charge.payment_intent);
      if (!orderId) return;
      const full = charge.refunded || charge.amount_refunded >= charge.amount;
      await transition(admin, orderId, ["paid", "partially_refunded", "processing"], {
        status: full ? "refunded" : "partially_refunded",
      });
      return;
    }
    case "charge.dispute.created": {
      const dispute = event.data.object as StripeDispute;
      const pi = dispute.payment_intent ?? (await retrieveCharge(dispute.charge)).payment_intent;
      const orderId = await orderIdForPaymentIntent(admin, pi);
      // The order row holds the RUO attestation (time, IP, user agent,
      // policy version) — submit it as dispute evidence in the Dashboard.
      console.error(
        `DISPUTE ${dispute.id} on charge ${dispute.charge} — order ${orderId ?? "not found"}. Respond in the Stripe Dashboard.`
      );
      if (orderId) {
        await transition(admin, orderId, ["paid", "partially_refunded", "refunded", "processing"], {
          status: "disputed",
        });
      }
      return;
    }
    default:
      return; // Not subscribed / not needed.
  }
}

/** Updates the order only if it's currently in one of `from`. */
async function transition(
  admin: Admin,
  orderId: string,
  from: Status[],
  fields: { status: Status } & Record<string, unknown>
) {
  const { error } = await admin
    .from("orders")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .in("status", from);
  if (error) throw new Error(`orders update failed: ${error.message}`);
}

async function orderIdForPaymentIntent(admin: Admin, paymentIntentId: string | null): Promise<string | null> {
  if (!paymentIntentId) return null;

  const { data: direct } = await admin
    .from("orders")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle<{ id: string }>();
  if (direct) return direct.id;

  // Invoice payments aren't tagged with our metadata; go via the invoice.
  const invoiceId = await findInvoiceIdForPaymentIntent(paymentIntentId);
  if (!invoiceId) return null;
  const { data: viaInvoice } = await admin
    .from("orders")
    .select("id")
    .eq("stripe_invoice_id", invoiceId)
    .maybeSingle<{ id: string }>();
  if (viaInvoice) {
    await admin.from("orders").update({ stripe_payment_intent_id: paymentIntentId }).eq("id", viaInvoice.id);
  }
  return viaInvoice?.id ?? null;
}
