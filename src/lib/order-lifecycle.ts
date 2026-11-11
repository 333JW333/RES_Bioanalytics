import * as emails from "@/lib/email/order-emails";
import { isEmailConfigured, sendEmail, type EmailMessage } from "@/lib/email/send";
import { formatOrderRef, type OrderStatus } from "@/lib/orders";
import { getProcessor } from "@/lib/payments/processors";
import type { OrderRef, PaymentProcessor, PaymentUpdate, ShippingAddress } from "@/lib/payments/types";
import type { PricedLine } from "@/lib/pricing";
import { trackingUrl } from "@/lib/shipping";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What happens to an order after checkout, whichever processor took the
 * payment: status changes and the emails that go with them. Processors only
 * report PaymentUpdates (src/lib/payments/types.ts); this file decides what
 * they mean for the order.
 */

type Admin = ReturnType<typeof createAdminClient>;

const ORDER_COLUMNS =
  "id, created_at, email, status, payment_flow, processor, amount_cents, items, shipping, po_number, " +
  "ruo_attested_at, processor_checkout_id, processor_payment_id, processor_invoice_id";

export interface OrderRow {
  id: string;
  created_at: string;
  email: string;
  status: OrderStatus;
  payment_flow: "checkout" | "invoice";
  processor: string;
  amount_cents: number;
  items: PricedLine[];
  shipping: ShippingAddress | null;
  po_number: string | null;
  ruo_attested_at: string | null;
  processor_checkout_id: string | null;
  processor_payment_id: string | null;
  processor_invoice_id: string | null;
}

/**
 * The statuses each update may move an order from. Anything else is a late
 * or repeated event, so a re-delivered "paid" can't undo a refund.
 */
const ALLOWED_FROM: Record<PaymentUpdate["type"], OrderStatus[]> = {
  paid: ["pending", "processing", "payment_failed", "invoice_requested"],
  processing: ["pending"],
  failed: ["pending", "processing", "invoice_requested"],
  expired: ["pending"],
  invoice_canceled: ["invoice_requested", "payment_failed"],
  refunded: ["paid", "partially_refunded", "processing"],
  disputed: ["paid", "partially_refunded", "refunded", "processing"],
};

export function targetStatus(update: PaymentUpdate): OrderStatus {
  switch (update.type) {
    case "paid":
      return "paid";
    case "processing":
      return "processing";
    case "failed":
      return "payment_failed";
    case "expired":
    case "invoice_canceled":
      return "canceled";
    case "refunded":
      return update.full ? "refunded" : "partially_refunded";
    case "disputed":
      return "disputed";
  }
}

/**
 * Applies one update from a processor (webhook or return page) and sends
 * the emails it calls for. Safe to repeat: the status only moves forward,
 * and each email goes out once per order. Throws if an email fails, so a
 * webhook delivery is retried.
 */
export async function applyPaymentUpdate(
  processor: PaymentProcessor,
  update: PaymentUpdate,
  admin: Admin = createAdminClient()
): Promise<void> {
  const order = await findOrder(admin, processor.id, update.ref);
  if (!order) {
    console.warn(`${processor.name} ${update.type} update matched no order`, update.ref);
    return;
  }

  // Refunds and disputes on invoice orders arrive with a payment ID the order
  // doesn't have yet; save it so later events match directly.
  if (update.ref.paymentId && !order.processor_payment_id) {
    await admin.from("orders").update({ processor_payment_id: update.ref.paymentId }).eq("id", order.id);
    order.processor_payment_id = update.ref.paymentId;
  }

  const now = new Date().toISOString();
  const target = targetStatus(update);
  const fields: Record<string, unknown> = { status: target, updated_at: now };
  if (update.type === "paid") fields.paid_at = now;
  if (update.type === "paid" || update.type === "processing") {
    if (update.paymentId) fields.processor_payment_id = update.paymentId;
    if (update.shipping) fields.shipping = update.shipping;
  }

  const { data: changed, error } = await admin
    .from("orders")
    .update(fields)
    .eq("id", order.id)
    .in("status", ALLOWED_FROM[update.type])
    .select(ORDER_COLUMNS)
    .maybeSingle<OrderRow>();
  if (error) throw new Error(`Could not update order ${order.id}: ${error.message}`);

  const current = changed ?? order;
  // Ignored update, or the order has since moved on: no emails.
  if (current.status !== target) return;
  // Also reached when an earlier delivery already made this change but its
  // emails failed; notify() skips any that were sent.
  await notify(admin, current.id, noticesFor(processor, current, update));
}

/** Emails for a new Net 30 invoice request. Never throws: the invoice already exists. */
export async function notifyInvoiceRequested(processor: PaymentProcessor, orderId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const order = await findOrder(admin, processor.id, { orderId });
    if (!order) return;
    const data = emailData(order);
    const url = processor.dashboardUrl?.({ invoiceId: order.processor_invoice_id }) ?? null;
    await notify(admin, order.id, [
      { key: "invoice_requested", build: () => emails.invoiceRequestedEmail(data) },
      { key: "staff_invoice_request", build: () => emails.staffInvoiceRequestEmail(data, processor.name, url) },
    ]);
  } catch (err) {
    console.error(`Invoice request emails for order ${orderId} failed`, err);
  }
}

// ---- Shipping ------------------------------------------------------------------

/** Orders in these statuses have been paid for and can ship. */
export const SHIPPABLE: OrderStatus[] = ["paid", "partially_refunded"];

export interface ShipmentResult {
  /** "updated": the order had already shipped; its tracking details were corrected. */
  saved: "shipped" | "updated" | "not_shippable";
  email: EmailOutcome;
}

/** "skipped": nothing to send, or email isn't set up (RESEND_API_KEY). */
export type EmailOutcome = "sent" | "failed" | "skipped";

/**
 * Records an order's shipment from the staff Orders page and emails the buyer
 * the tracking details. On an order that already shipped, it corrects the
 * carrier and tracking number, and the buyer gets the new details. Each
 * tracking number is emailed once. If the email fails, the shipment stays
 * saved and resendShipmentEmail() can send it.
 */
export async function recordShipment(
  orderId: string,
  carrier: string,
  trackingNumber: string,
  admin: Admin = createAdminClient()
): Promise<ShipmentResult> {
  const fields = { carrier, tracking_number: trackingNumber };
  // updated_at is left alone: it tracks payment-status changes.
  const first = await admin
    .from("orders")
    .update({ ...fields, shipped_at: new Date().toISOString() })
    .eq("id", orderId)
    .in("status", SHIPPABLE)
    .is("shipped_at", null)
    .select(SHIPPED_COLUMNS)
    .maybeSingle<ShippedOrderRow>();
  if (first.error) throw new Error(`Could not mark order ${orderId} shipped: ${first.error.message}`);
  if (first.data) return { saved: "shipped", email: await sendShippedEmail(admin, first.data) };

  const fix = await admin
    .from("orders")
    .update(fields)
    .eq("id", orderId)
    .not("shipped_at", "is", null)
    .select(SHIPPED_COLUMNS)
    .maybeSingle<ShippedOrderRow>();
  if (fix.error) throw new Error(`Could not update tracking for order ${orderId}: ${fix.error.message}`);
  if (!fix.data) return { saved: "not_shippable", email: "skipped" };
  return { saved: "updated", email: await sendShippedEmail(admin, fix.data) };
}

/** Sends the shipped email again, e.g. when the buyer says it never arrived. */
export async function resendShipmentEmail(orderId: string, admin: Admin = createAdminClient()): Promise<EmailOutcome> {
  const { data: order, error } = await admin
    .from("orders")
    .select(SHIPPED_COLUMNS)
    .eq("id", orderId)
    .not("shipped_at", "is", null)
    .maybeSingle<ShippedOrderRow>();
  if (error) throw new Error(`Could not load order ${orderId}: ${error.message}`);
  if (!order?.carrier || !order.tracking_number) return "skipped";

  const { error: releaseError } = await admin.rpc("release_order_notification", {
    p_order_id: order.id,
    p_key: shippedNoticeKey(order.carrier, order.tracking_number),
  });
  if (releaseError) throw new Error(`Could not reset the shipped email for order ${orderId}: ${releaseError.message}`);
  return sendShippedEmail(admin, order);
}

async function sendShippedEmail(admin: Admin, order: ShippedOrderRow): Promise<EmailOutcome> {
  if (!isEmailConfigured() || !order.carrier || !order.tracking_number) return "skipped";
  try {
    await notify(admin, order.id, [shippedNotice(order)]);
    return "sent";
  } catch (err) {
    console.error(`Shipped email for order ${order.id} failed`, err);
    return "failed";
  }
}

/** The record key for a shipped email, so each tracking number is emailed once. */
export function shippedNoticeKey(carrier: string | null, trackingNumber: string | null): string {
  return `order_shipped:${carrier ?? ""}:${trackingNumber ?? ""}`;
}

interface ShippedOrderRow extends OrderRow {
  shipped_at: string | null;
  carrier: string | null;
  tracking_number: string | null;
}

const SHIPPED_COLUMNS = `${ORDER_COLUMNS}, shipped_at, carrier, tracking_number`;

function shippedNotice(order: ShippedOrderRow): Notice {
  const carrier = order.carrier ?? "";
  const tracking = order.tracking_number ?? "";
  return {
    key: shippedNoticeKey(carrier, tracking),
    build: () => emails.orderShippedEmail(emailData(order), carrier, tracking, trackingUrl(carrier, tracking)),
  };
}

/**
 * For the success page: if the buyer got back before the processor's webhook,
 * ask the processor directly so the page (and the emails) don't wait for it.
 */
export async function refreshPendingOrder(order: Pick<OrderRow, "id" | "status" | "processor" | "processor_checkout_id">) {
  if (order.status !== "pending" || !order.processor_checkout_id) return;
  const processor = getProcessor(order.processor);
  if (!processor?.lookupCheckout) return;
  const update = await processor.lookupCheckout(order.processor_checkout_id);
  // The lookup was by this order's own checkout ID, so point it at this order.
  if (update) await applyPaymentUpdate(processor, { ...update, ref: { orderId: order.id } });
}

// ---- Emails --------------------------------------------------------------------

interface Notice {
  /** Recorded on the order once sent, so it's never sent twice. */
  key: string;
  build: () => EmailMessage;
}

function noticesFor(processor: PaymentProcessor, order: OrderRow, update: PaymentUpdate): Notice[] {
  const data = emailData(order);
  const dashboard = (ref: Parameters<NonNullable<PaymentProcessor["dashboardUrl"]>>[0]) =>
    processor.dashboardUrl?.(ref) ?? null;

  switch (update.type) {
    case "paid":
      return [
        { key: "order_confirmed", build: () => emails.orderConfirmedEmail(data) },
        {
          key: "staff_new_order",
          build: () =>
            emails.staffNewOrderEmail(
              data,
              processor.name,
              dashboard({ paymentId: order.processor_payment_id, invoiceId: order.processor_invoice_id })
            ),
        },
      ];
    case "processing":
      return [{ key: "payment_processing", build: () => emails.paymentProcessingEmail(data) }];
    case "failed":
      // Staff writing off an invoice isn't a declined payment; they contact the buyer themselves.
      return update.reason === "uncollectible"
        ? []
        : [{ key: "payment_failed", build: () => emails.paymentFailedEmail(data) }];
    case "refunded":
      // Keyed by the running total, so each further partial refund gets its own email.
      return [
        {
          key: `refund_issued:${update.refundedCents}`,
          build: () => emails.refundIssuedEmail(data, update.refundedCents, update.full),
        },
      ];
    case "disputed":
      return [
        {
          key: `staff_dispute:${update.disputeId}`,
          build: () =>
            emails.staffDisputeEmail(data, processor.name, dashboard({ disputeId: update.disputeId }), update.amountCents),
        },
      ];
    case "expired":
    case "invoice_canceled":
      return [];
  }
}

async function notify(admin: Admin, orderId: string, notices: Notice[]) {
  for (const notice of notices) {
    if (!isEmailConfigured()) {
      console.warn(`RESEND_API_KEY unset; ${notice.key} email for order ${orderId} not sent`);
      continue;
    }
    const { data: claimed, error } = await admin.rpc("claim_order_notification", {
      p_order_id: orderId,
      p_key: notice.key,
    });
    if (error) throw new Error(`Could not record ${notice.key} for order ${orderId}: ${error.message}`);
    if (claimed !== true) continue; // already sent

    try {
      await sendEmail(notice.build());
    } catch (err) {
      // Un-record it so the retry sends it.
      await admin.rpc("release_order_notification", { p_order_id: orderId, p_key: notice.key });
      throw err;
    }
  }
}

function emailData(order: OrderRow): emails.OrderEmailData {
  return {
    id: order.id,
    ref: formatOrderRef(order.id),
    email: order.email,
    createdAt: order.created_at,
    items: order.items,
    amountCents: order.amount_cents,
    shipping: order.shipping,
    poNumber: order.po_number,
    paymentFlow: order.payment_flow,
    ruoAttestedAt: order.ruo_attested_at,
  };
}

// ---- Lookup --------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The order an update is about. Our own order ID wins; then the processor's references. */
async function findOrder(admin: Admin, processorId: string, ref: OrderRef): Promise<OrderRow | null> {
  const lookups: [column: string, value: string | null | undefined][] = [
    ["id", ref.orderId && UUID_RE.test(ref.orderId) ? ref.orderId : null],
    ["processor_checkout_id", ref.checkoutId],
    ["processor_payment_id", ref.paymentId],
    ["processor_invoice_id", ref.invoiceId],
  ];
  for (const [column, value] of lookups) {
    if (!value) continue;
    const { data, error } = await admin
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq(column, value)
      .eq("processor", processorId)
      .maybeSingle<OrderRow>();
    if (error) throw new Error(`Order lookup by ${column} failed: ${error.message}`);
    if (data) return data;
  }
  return null;
}
