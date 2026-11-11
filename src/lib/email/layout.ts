import { formatUSD } from "@/lib/format";
import type { ShippingAddress } from "@/lib/payments/types";
import type { PricedLine } from "@/lib/pricing";
import { SUPPORT_EMAIL } from "@/lib/site";
import type { EmailMessage } from "./send";

/**
 * The shared look of EcoPeps emails: a heading, then blocks of content, in
 * both HTML (inline styles, for email clients) and plain text.
 */

export type Block =
  | { p: string }
  | { items: { lines: PricedLine[]; totalCents: number } }
  | { facts: [string, string][] }
  | { address: { label: string; value: ShippingAddress } }
  | { link: { label: string; url: string } };

export interface EmailSpec {
  /** Customer emails carry the support and research-use footer; staff emails don't. */
  audience: "customer" | "staff";
  to: string;
  subject: string;
  heading: string;
  blocks: Block[];
}

const RUO_NOTICE =
  "All EcoPeps products are sold for laboratory research use only. They are not for human or animal consumption.";

const NAVY = "#071a2c";
const TEAL = "#0d8f81";
const SLATE = "#475569";
const LINE = "#e2e8f0";

export const money = (cents: number) => formatUSD(cents / 100);

const lineCents = (l: PricedLine) => Math.round(l.unitPrice * 100) * l.qty;

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function addressLines(a: ShippingAddress): string[] {
  const cityLine = [a.city, [a.state, a.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [a.name, a.line1, a.line2, cityLine, a.country && a.country !== "US" ? a.country : null].filter(
    (l): l is string => Boolean(l && l.trim())
  );
}

export function renderEmail(spec: EmailSpec): EmailMessage {
  const html: string[] = [];
  const text: string[] = [spec.heading, ""];

  for (const block of spec.blocks) {
    if ("p" in block) {
      html.push(`<p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:${NAVY}">${esc(block.p)}</p>`);
      text.push(block.p, "");
    } else if ("items" in block) {
      const { lines, totalCents } = block.items;
      const rows = lines
        .map(
          (l) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${NAVY}">${l.qty} &times; ${esc(l.name)} (${esc(l.sizeLabel)})</td>` +
            `<td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${NAVY};text-align:right;white-space:nowrap">${money(lineCents(l))}</td></tr>`
        )
        .join("");
      html.push(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse">${rows}` +
          `<tr><td style="padding:10px 0 0;font-size:15px;font-weight:bold;color:${NAVY}">Total</td>` +
          `<td style="padding:10px 0 0;font-size:15px;font-weight:bold;color:${NAVY};text-align:right">${money(totalCents)}</td></tr></table>`
      );
      for (const l of lines) text.push(`${l.qty} x ${l.name} (${l.sizeLabel})  ${money(lineCents(l))}`);
      text.push(`Total  ${money(totalCents)}`, "");
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

  return { to: spec.to, subject: spec.subject, html: body, text: text.join("\n") };
}
