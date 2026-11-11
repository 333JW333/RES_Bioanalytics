import type { PricedLine } from "@/lib/pricing";

/**
 * The contract every payment processor plugs in through. Orders, statuses,
 * customer emails and the checkout pages only ever talk to this interface,
 * so switching processors means writing one adapter (see
 * stripe-processor.ts) and pointing PAYMENT_PROCESSOR at it.
 */
export interface PaymentProcessor {
  /** Saved on each order (orders.processor). Lowercase letters, digits, "_". */
  readonly id: string;
  /** Shown to staff, e.g. in alert emails. */
  readonly name: string;

  /** False when its keys aren't set; checkout then refuses (or demos locally). */
  isConfigured(): boolean;

  /** Starts a hosted payment page for an order already saved as `pending`. */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;

  /** Net 30 invoices. Leave out if the processor can't invoice. */
  createInvoice?(input: InvoiceInput): Promise<InvoiceResult>;

  /**
   * Verifies a webhook delivery is genuine and translates it into
   * processor-neutral updates. Throws WebhookVerificationError if it isn't
   * genuine. Return no updates for events the store doesn't need.
   */
  parseWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>;

  /**
   * When the buyer lands back on the success page before the webhook has
   * arrived, asks the processor how the checkout went. Optional.
   */
  lookupCheckout?(checkoutId: string): Promise<PaymentUpdate | null>;

  /** Link for staff to the payment, invoice or dispute in the processor's dashboard. */
  dashboardUrl?(ref: { paymentId?: string | null; invoiceId?: string | null; disputeId?: string | null }): string | null;
}

export interface CheckoutBuyer {
  userId: string;
  email: string;
  name: string | null;
}

export interface CheckoutInput {
  orderId: string;
  buyer: CheckoutBuyer;
  lines: PricedLine[];
  /** Our success page for this order. */
  successUrl: string;
  /** Where to send the buyer if they back out. */
  cancelUrl: string;
}

export interface CheckoutResult {
  redirectUrl: string;
  /** The processor's ID for this checkout (saved as orders.processor_checkout_id). */
  checkoutId: string;
  customerId: string | null;
}

export interface InvoiceInput {
  orderId: string;
  buyer: CheckoutBuyer;
  lines: PricedLine[];
  poNumber: string | null;
  netDays: number;
}

export interface InvoiceResult {
  invoiceId: string;
  customerId: string | null;
}

export interface WebhookResult {
  /** The processor's event ID, used to ignore re-deliveries. */
  eventId: string;
  eventType: string;
  updates: PaymentUpdate[];
}

/**
 * Which order an update is about: our own order ID, or a processor reference
 * saved on the order. The first one that matches is used.
 */
export interface OrderRef {
  orderId?: string | null;
  checkoutId?: string | null;
  paymentId?: string | null;
  invoiceId?: string | null;
}

export interface ShippingAddress {
  name: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

/** What happened to an order's payment, in the store's own terms. */
export type PaymentUpdate =
  /** Money received (card, cleared bank payment, or paid invoice). */
  | { type: "paid"; ref: OrderRef; paymentId?: string | null; shipping?: ShippingAddress | null }
  /** Checkout finished but the money hasn't cleared yet (e.g. ACH debit). */
  | { type: "processing"; ref: OrderRef; paymentId?: string | null; shipping?: ShippingAddress | null }
  /** The payment failed. "uncollectible" means staff wrote an invoice off; the buyer isn't emailed. */
  | { type: "failed"; ref: OrderRef; reason?: "declined" | "uncollectible" }
  /** The buyer left the payment page without paying and it timed out. */
  | { type: "expired"; ref: OrderRef }
  /** Staff canceled an unpaid invoice. */
  | { type: "invoice_canceled"; ref: OrderRef }
  /** Money returned. `refundedCents` is the total refunded so far. */
  | { type: "refunded"; ref: OrderRef; full: boolean; refundedCents: number }
  /** The buyer's bank opened a chargeback. */
  | { type: "disputed"; ref: OrderRef; disputeId: string; amountCents: number | null };

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}
