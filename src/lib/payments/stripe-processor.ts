import { createAdminClient } from "@/lib/supabase/admin";
import {
  constructWebhookEvent,
  createCheckoutSession,
  createCustomer,
  createDraftInvoice,
  createInvoiceItem,
  findInvoiceIdForPaymentIntent,
  isStripeConfigured,
  retrieveCharge,
  retrieveCheckoutSession,
  retrieveUsableCustomer,
  toCents,
  updateCustomerEmail,
  type StripeCharge,
  type StripeCheckoutSession,
  type StripeDispute,
  type StripeEvent,
  type StripeInvoice,
} from "./stripe";
import {
  WebhookVerificationError,
  type CheckoutBuyer,
  type PaymentProcessor,
  type PaymentUpdate,
  type ShippingAddress,
} from "./types";

/**
 * Stripe, plugged in through the PaymentProcessor interface. Everything the
 * store knows about Stripe is in this file and stripe.ts (the API client).
 *
 * Stripe webhook endpoint: https://www.ecopeps.com/api/webhooks/stripe,
 * Snapshot payload, subscribed to every event in WEBHOOK_EVENTS.
 */

const ID = "stripe";

export const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.voided",
  "invoice.marked_uncollectible",
  "charge.refunded",
  "charge.dispute.created",
] as const;

const RUO_LINE = "For laboratory research use only. Not for human or animal consumption.";

export const stripeProcessor: PaymentProcessor = {
  id: ID,
  name: "Stripe",

  isConfigured: isStripeConfigured,

  async createCheckout({ orderId, buyer, lines, successUrl, cancelUrl }) {
    const customerId = await getOrCreateCustomer(buyer);
    const metadata = { order_id: orderId, user_id: buyer.userId };
    const session = await createCheckoutSession(
      {
        mode: "payment",
        customer: customerId,
        client_reference_id: buyer.userId,
        line_items: lines.map((l) => ({
          quantity: l.qty,
          price_data: {
            currency: "usd",
            unit_amount: toCents(l.unitPrice),
            product_data: {
              name: `${l.name} (${l.sizeLabel})`,
              description: RUO_LINE,
              metadata: { sku: l.sku },
            },
          },
        })),
        // Shipping page: U.S. addresses only; international is case-by-case via Contact.
        shipping_address_collection: { allowed_countries: ["US"] },
        custom_text: {
          submit: {
            message:
              "By paying you confirm this purchase is for laboratory research use only, per the EcoPeps RUO Policy you accepted.",
          },
        },
        metadata,
        payment_intent_data: { metadata, description: `EcoPeps order ${orderId}` },
        success_url: successUrl,
        cancel_url: cancelUrl,
      },
      `checkout-${orderId}`
    );
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return { redirectUrl: session.url, checkoutId: session.id, customerId };
  },

  async createInvoice({ orderId, buyer, lines, poNumber, netDays }) {
    const customerId = await getOrCreateCustomer(buyer);
    const customFields = [{ name: "Order", value: orderId.slice(0, 8).toUpperCase() }];
    if (poNumber) customFields.unshift({ name: "PO number", value: poNumber });

    // A draft (auto_advance off): nothing reaches the buyer until staff
    // review it and click Send in the Stripe Dashboard.
    const invoice = await createDraftInvoice(
      {
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: netDays,
        auto_advance: false,
        pending_invoice_items_behavior: "exclude",
        custom_fields: customFields,
        footer:
          "All products are supplied for laboratory research use only and are not for human or animal consumption.",
        metadata: { order_id: orderId, user_id: buyer.userId },
      },
      `invoice-${orderId}`
    );

    for (const [i, l] of lines.entries()) {
      await createInvoiceItem(
        {
          customer: customerId,
          invoice: invoice.id,
          currency: "usd",
          amount: toCents(l.unitPrice) * l.qty,
          description: `${l.qty} × ${l.name} (${l.sizeLabel}) @ $${l.unitPrice.toFixed(2)} — SKU ${l.sku}`,
          metadata: { order_id: orderId, sku: l.sku },
        },
        `invoice-${orderId}-item-${i}`
      );
    }
    return { invoiceId: invoice.id, customerId };
  },

  async parseWebhook(rawBody, headers) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
    let event: StripeEvent;
    try {
      event = constructWebhookEvent(rawBody, headers.get("stripe-signature"), secret);
    } catch (err) {
      throw new WebhookVerificationError(err instanceof Error ? err.message : "Invalid signature.");
    }
    return { eventId: event.id, eventType: event.type, updates: await translateEvent(event) };
  },

  async lookupCheckout(checkoutId) {
    return sessionUpdate(await retrieveCheckoutSession(checkoutId));
  },

  dashboardUrl({ paymentId, invoiceId, disputeId }) {
    const base = `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.includes("_test_") ? "test/" : ""}`;
    if (disputeId) return `${base}disputes/${disputeId}`;
    if (invoiceId) return `${base}invoices/${invoiceId}`;
    if (paymentId) return `${base}payments/${paymentId}`;
    return null;
  },
};

/** Stripe's events in the store's own terms. Events not listed produce no updates. */
export async function translateEvent(event: StripeEvent): Promise<PaymentUpdate[]> {
  switch (event.type) {
    case "checkout.session.completed": {
      const update = sessionUpdate(event.data.object as StripeCheckoutSession);
      return update ? [update] : [];
    }
    case "checkout.session.async_payment_succeeded":
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const s = event.data.object as StripeCheckoutSession;
      const ref = { orderId: s.metadata?.order_id ?? null, checkoutId: s.id };
      if (event.type === "checkout.session.expired") return [{ type: "expired", ref }];
      if (event.type === "checkout.session.async_payment_failed") return [{ type: "failed", ref, reason: "declined" }];
      return [{ type: "paid", ref, paymentId: s.payment_intent }];
    }
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.marked_uncollectible":
    case "invoice.voided": {
      const inv = event.data.object as StripeInvoice;
      const ref = { orderId: inv.metadata?.order_id ?? null, invoiceId: inv.id };
      if (event.type === "invoice.paid") return [{ type: "paid", ref }];
      if (event.type === "invoice.voided") return [{ type: "invoice_canceled", ref }];
      return [{ type: "failed", ref, reason: event.type === "invoice.payment_failed" ? "declined" : "uncollectible" }];
    }
    case "charge.refunded": {
      const charge = event.data.object as StripeCharge;
      if (!charge.payment_intent) return [];
      return [
        {
          type: "refunded",
          ref: await paymentRef(charge.payment_intent),
          full: charge.refunded || charge.amount_refunded >= charge.amount,
          refundedCents: charge.amount_refunded,
        },
      ];
    }
    case "charge.dispute.created": {
      const dispute = event.data.object as StripeDispute;
      const paymentId = dispute.payment_intent ?? (await retrieveCharge(dispute.charge)).payment_intent;
      if (!paymentId) return [];
      return [
        {
          type: "disputed",
          ref: await paymentRef(paymentId),
          disputeId: dispute.id,
          amountCents: dispute.amount ?? null,
        },
      ];
    }
    default:
      return [];
  }
}

function sessionUpdate(s: StripeCheckoutSession): PaymentUpdate | null {
  const ref = { orderId: s.metadata?.order_id ?? null, checkoutId: s.id };
  const shipping = toShippingAddress(s.collected_information?.shipping_details ?? s.shipping_details);
  if (s.payment_status === "paid") return { type: "paid", ref, paymentId: s.payment_intent, shipping };
  // Delayed methods (e.g. ACH debit) complete checkout before the money clears.
  if (s.status === "complete") return { type: "processing", ref, paymentId: s.payment_intent, shipping };
  return null;
}

/** Refunds and disputes name the PaymentIntent; invoice orders are found through their invoice. */
async function paymentRef(paymentId: string) {
  return { paymentId, invoiceId: await findInvoiceIdForPaymentIntent(paymentId) };
}

export function toShippingAddress(raw: unknown): ShippingAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as { name?: string | null; address?: Record<string, string | null> | null };
  const a = d.address ?? {};
  return {
    name: d.name ?? null,
    line1: a.line1 ?? null,
    line2: a.line2 ?? null,
    city: a.city ?? null,
    state: a.state ?? null,
    postalCode: a.postal_code ?? null,
    country: a.country ?? null,
  };
}

/**
 * Reuses the account's Stripe Customer, creating and saving one on first
 * purchase. A saved Customer the current key can't use (one made in test
 * mode, once the site runs on the live key) is replaced.
 */
async function getOrCreateCustomer(buyer: CheckoutBuyer): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("processor_customers")
    .select("customer_id")
    .eq("user_id", buyer.userId)
    .eq("processor", ID)
    .maybeSingle<{ customer_id: string }>();
  const saved = existing ? await retrieveUsableCustomer(existing.customer_id) : null;
  if (saved) {
    // Stripe emails invoices to the Customer's address, so it must follow
    // the account: after an email change, the old inbox (maybe no longer
    // the buyer's) would otherwise get their invoices.
    if (saved.email !== buyer.email) await updateCustomerEmail(saved.id, buyer.email);
    return saved.id;
  }

  // Idempotency key is per user, so a race between two tabs yields the same Customer.
  const customer = await createCustomer({
    email: buyer.email,
    name: buyer.name ?? undefined,
    userId: buyer.userId,
    replacing: existing?.customer_id,
  });
  const { error } = await admin
    .from("processor_customers")
    .upsert({ user_id: buyer.userId, processor: ID, customer_id: customer.id }, { onConflict: "user_id,processor" });
  if (error) console.error("Could not save Stripe customer", error.message);
  return customer.id;
}
