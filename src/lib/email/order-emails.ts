import { formatUSD } from "@/lib/format";
import type { PricedLine } from "@/lib/pricing";
import type { ShippingAddress } from "@/lib/payments/types";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
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

const RUO_NOTICE =
  "All EcoPeps products are sold for laboratory research use only. They are not for human or animal consumption.";
const SHIPPING_NOTE =
  "Orders are typically dispatched within 1 business day of payment confirmation, and we'll email you tracking details when yours ships.";

const money = (cents: number) => formatUSD(cents / 100);

// ---- Customer emails ---------------------------------------------------------

export function orderConfirmedEmail(o: OrderEmailData): EmailMessage {
  return render(o, {
    audience: "customer",
    subject: `Your EcoPeps order ${o.ref} is confirmed`,
    heading: "Thank you. Your order is confirmed.",
    blocks: [
      { p: `We've received your payment for order ${o.ref}. ${SHIPPING_NOTE}` },
      { items: true },
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
      { items: true },
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
      { items: true },
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
      { items: true },
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
      { items: true },
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
      { items: true },
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
      { items: true },
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
      { items: true },
      ...(dashboardUrl ? [{ link: { label: `Respond in ${processorName}`, url: dashboardUrl } }] : []),
    ],
  });
}

// ---- Layout --------------------------------------------------------------------

type Block =
  | { p: string }
  | { items: true }
  | { facts: [string, string][] }
  | { address: { label: string; value: ShippingAddress } }
  | { link: { label: string; url: string } };

interface Spec {
  audience: "customer" | "staff";
  to?: string;
  subject: string;
  heading: string;
  blocks: Block[];
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

function addressLines(a: ShippingAddress): string[] {
  const cityLine = [a.city, [a.state, a.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [a.name, a.line1, a.line2, cityLine, a.country && a.country !== "US" ? a.country : null].filter(
    (l): l is string => Boolean(l && l.trim())
  );
}

const NAVY = "#071a2c";
const TEAL = "#0d8f81";
const SLATE = "#475569";
const LINE = "#e2e8f0";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function render(o: OrderEmailData, spec: Spec): EmailMessage {
  const html: string[] = [];
  const text: string[] = [spec.heading, ""];

  for (const block of spec.blocks) {
    if ("p" in block) {
      html.push(`<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${NAVY}">${esc(block.p)}</p>`);
      text.push(block.p, "");
    } else if ("items" in block) {
      const rows = o.items
        .map(
          (l) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${NAVY}">${l.qty} &times; ${esc(l.name)} (${esc(l.sizeLabel)})</td>` +
            `<td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${NAVY};text-align:right;white-space:nowrap">${money(Math.round(l.unitPrice * 100) * l.qty)}</td></tr>`
        )
        .join("");
      html.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse">${rows}` +
          `<tr><td style="padding:10px 0 0;font-size:15px;font-weight:bold;color:${NAVY}">Total</td>` +
          `<td style="padding:10px 0 0;font-size:15px;font-weight:bold;color:${NAVY};text-align:right">${money(o.amountCents)}</td></tr></table>`
      );
      for (const l of o.items) {
        text.push(`${l.qty} x ${l.name} (${l.sizeLabel})  ${money(Math.round(l.unitPrice * 100) * l.qty)}`);
      }
      text.push(`Total  ${money(o.amountCents)}`, "");
    } else if ("facts" in block) {
      const rows = block.facts
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;font-size:13px;color:${SLATE};vertical-align:top;white-space:nowrap">${esc(k)}</td>` +
            `<td style="padding:4px 0;font-size:13px;color:${NAVY}">${esc(v)}</td></tr>`
        )
        .join("");
      html.push(`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px">${rows}</table>`);
      for (const [k, v] of block.facts) text.push(`${k}: ${v}`);
      text.push("");
    } else if ("address" in block) {
      const lines = addressLines(block.address.value);
      if (lines.length) {
        html.push(
          `<p style="margin:0 0 4px;font-size:13px;color:${SLATE}">${esc(block.address.label)}</p>` +
            `<p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:${NAVY}">${lines.map(esc).join("<br>")}</p>`
        );
        text.push(`${block.address.label}:`, ...lines, "");
      }
    } else {
      html.push(
        `<p style="margin:0 0 16px"><a href="${esc(block.link.url)}" style="display:inline-block;background:${TEAL};color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:10px 18px;border-radius:8px">${esc(block.link.label)}</a></p>`
      );
      text.push(`${block.link.label}: ${block.link.url}`, "");
    }
  }

  const footer =
    spec.audience === "customer"
      ? [`Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`, RUO_NOTICE]
      : ["Sent automatically by www.ecopeps.com."];
  text.push("--", ...footer, "EcoPeps · www.ecopeps.com");

  const body =
    `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px"><tr><td align="center">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;font-family:Arial,Helvetica,sans-serif">` +
    `<tr><td style="background:${NAVY};border-radius:12px 12px 0 0;padding:18px 24px;font-size:20px;font-weight:bold;color:#ffffff">Eco<span style="color:#14b8a6">Peps</span></td></tr>` +
    `<tr><td style="padding:24px">` +
    `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${NAVY}">${esc(spec.heading)}</h1>` +
    html.join("") +
    `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid ${LINE};font-size:12px;line-height:1.5;color:${SLATE}">` +
    footer.map(esc).join("<br>") +
    `</p></td></tr></table></td></tr></table></body></html>`;

  return { to: spec.to ?? o.email, subject: spec.subject, html: body, text: text.join("\n") };
}
