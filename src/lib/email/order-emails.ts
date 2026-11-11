import type { PricedLine } from "@/lib/pricing";
import type { ShippingAddress } from "@/lib/payments/types";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { money, renderEmail, type Block } from "./layout";
import type { EmailMessage } from "./send";

/**
 * EcoPeps' order emails: one function per message, each returning the
 * subject, HTML and plain-text versions. Wording sticks to order facts;
 * nothing here describes what a product does.
 */

export interface OrderEmailData {
  id: string;
  /** Short reference shown to customers, e.g. "7473F34D". */
  ref: string;
  email: string;
  createdAt: string;
  items: PricedLine[];
  amountCents: number;
  shipping: ShippingAddress | null;
  poNumber: string | null;
  paymentFlow: "checkout" | "invoice";
  ruoAttestedAt: string | null;
}

const SHIPPING_NOTE =
  "Orders are typically dispatched within 1 business day of payment confirmation, and we'll email you tracking details when yours ships.";


// ---- Customer emails ---------------------------------------------------------

export function orderConfirmedEmail(o: OrderEmailData): EmailMessage {
  return render(o, {
    audience: "customer",
    subject: `Your EcoPeps order ${o.ref} is confirmed`,
    heading: "Thank you. Your order is confirmed.",
    blocks: [
      { p: `We've received your payment for order ${o.ref}. ${SHIPPING_NOTE}` },
      itemsOf(o),
      ...shipTo(o),
    ],
  });
}

export function paymentProcessingEmail(o: OrderEmailData): EmailMessage {
  return render(o, {
    audience: "customer",
    subject: `We received your EcoPeps order ${o.ref}`,
    heading: "Your order is in. Your bank payment is processing.",
    blocks: [
      {
        p:
          `Thanks for order ${o.ref}. Bank (ACH) payments usually take up to 4 business days to clear. ` +
          "We'll email you as soon as yours clears, and your order ships after that.",
      },
      itemsOf(o),
      ...shipTo(o),
    ],
  });
}

export function paymentFailedEmail(o: OrderEmailData): EmailMessage {
  return render(o, {
    audience: "customer",
    subject: `Payment for EcoPeps order ${o.ref} didn't go through`,
    heading: "Your payment didn't go through.",
    blocks: [
      {
        p:
          `We couldn't collect payment for order ${o.ref}, so it hasn't shipped. ` +
          "You haven't been charged for it. You can place the order again, or reply to this email and we'll help.",
      },
      itemsOf(o),
      { link: { label: "Return to the shop", url: `${SITE_URL}/shop` } },
    ],
  });
}

export function refundIssuedEmail(o: OrderEmailData, refundedCents: number, full: boolean): EmailMessage {
  return render(o, {
    audience: "customer",
    subject: `Refund issued for EcoPeps order ${o.ref}`,
    heading: full ? "Your refund is on its way." : "A partial refund is on its way.",
    blocks: [
      {
        p:
          `We've refunded ${money(refundedCents)}${full ? "" : ` of ${money(o.amountCents)}`} for order ${o.ref} ` +
          "to your original payment method. Depending on your bank, it can take 5-10 business days to appear.",
      },
      itemsOf(o),
    ],
  });
}

export function invoiceRequestedEmail(o: OrderEmailData): EmailMessage {
  return render(o, {
    audience: "customer",
    subject: `We received your invoice request for EcoPeps order ${o.ref}`,
    heading: "We received your Net 30 invoice request.",
    blocks: [
      {
        p:
          `We'll review order ${o.ref} and email your invoice, which you can pay by bank transfer or card. ` +
          "Your order ships once the invoice is paid.",
      },
      ...(o.poNumber ? [{ facts: [["PO number", o.poNumber]] as [string, string][] }] : []),
      itemsOf(o),
    ],
  });
}

// ---- Staff alerts (to support@ecopeps.com) ---------------------------------------

export function staffNewOrderEmail(o: OrderEmailData, processorName: string, dashboardUrl: string | null): EmailMessage {
  return render(o, {
    audience: "staff",
    to: SUPPORT_EMAIL,
    subject: `New paid order ${o.ref}, ready to ship (${money(o.amountCents)})`,
    heading: `Order ${o.ref} is paid and ready to ship.`,
    blocks: [
      { facts: orderFacts(o, processorName) },
      itemsOf(o),
      ...shipTo(o),
      ...(dashboardUrl ? [{ link: { label: `View payment in ${processorName}`, url: dashboardUrl } }] : []),
    ],
  });
}

export function staffInvoiceRequestEmail(o: OrderEmailData, processorName: string, dashboardUrl: string | null): EmailMessage {
  return render(o, {
    audience: "staff",
    to: SUPPORT_EMAIL,
    subject: `Invoice request to review: order ${o.ref} (${money(o.amountCents)})`,
    heading: `A Net 30 invoice for order ${o.ref} is waiting for review.`,
    blocks: [
      { p: `It's a draft. Nothing reaches the buyer until you review it and send it in ${processorName}.` },
      { facts: orderFacts(o, processorName) },
      itemsOf(o),
      ...(dashboardUrl ? [{ link: { label: `Review the invoice in ${processorName}`, url: dashboardUrl } }] : []),
    ],
  });
}

export function staffDisputeEmail(
  o: OrderEmailData,
  processorName: string,
  dashboardUrl: string | null,
  disputedCents: number | null
): EmailMessage {
  return render(o, {
    audience: "staff",
    to: SUPPORT_EMAIL,
    subject: `Payment disputed: order ${o.ref}${disputedCents ? ` (${money(disputedCents)})` : ""}`,
    heading: `The buyer's bank opened a dispute on order ${o.ref}.`,
    blocks: [
      {
        p:
          `Respond in ${processorName} before its deadline. The order record holds the buyer's research-use ` +
          "attestation (time, IP address, browser and policy version) to submit as evidence.",
      },
      { facts: orderFacts(o, processorName) },
      itemsOf(o),
      ...(dashboardUrl ? [{ link: { label: `Respond in ${processorName}`, url: dashboardUrl } }] : []),
    ],
  });
}

// ---- Helpers -------------------------------------------------------------------

interface Spec {
  audience: "customer" | "staff";
  to?: string;
  subject: string;
  heading: string;
  blocks: Block[];
}

function render(o: OrderEmailData, spec: Spec): EmailMessage {
  return renderEmail({ ...spec, to: spec.to ?? o.email });
}

function itemsOf(o: OrderEmailData): Block {
  return { items: { lines: o.items, totalCents: o.amountCents } };
}

function shipTo(o: OrderEmailData): Block[] {
  return o.shipping ? [{ address: { label: "Shipping to", value: o.shipping } }] : [];
}

function orderFacts(o: OrderEmailData, processorName: string): [string, string][] {
  const facts: [string, string][] = [
    ["Order", `${o.ref} (${o.id})`],
    ["Buyer", o.email],
    ["Total", money(o.amountCents)],
    ["Payment", `${o.paymentFlow === "invoice" ? "Net 30 invoice" : "Checkout"} via ${processorName}`],
  ];
  if (o.poNumber) facts.push(["PO number", o.poNumber]);
  if (o.ruoAttestedAt) facts.push(["Research-use attestation", new Date(o.ruoAttestedAt).toUTCString()]);
  return facts;
}
