import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { money, renderEmail, type Block } from "./layout";
import type { EmailMessage } from "./send";

/**
 * The weekly summary staff get every Monday, and the one-time email
 * customers get when a product they asked about is back in stock.
 */

export interface WeeklySummaryData {
  /** e.g. "Nov 3 – Nov 9, 2026" */
  label: string;
  accountsTotal: number;
  newAccounts: { email: string; name: string | null; businessType: string | null; confirmed: boolean }[];
  paidOrders: number;
  revenueCents: number;
  invoiceRequests: number;
  unpaidCheckouts: number;
  shipped: number;
  awaitingShipment: number;
  refunded: number;
  disputed: number;
  pageViews: number;
  topProducts: { name: string; views: number; signedInViewers: number }[];
  countries: { name: string; views: number }[];
  restockWaiting: { name: string; waiting: number }[];
}

/** Longer lists are cut here, with a count of the rest. */
const MAX_ROWS = 25;

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

export function staffWeeklySummaryEmail(s: WeeklySummaryData, supabaseDashboard: string | null): EmailMessage {
  const blocks: Block[] = [
    { h: "Sales" },
    {
      facts: [
        ["Paid orders", `${s.paidOrders} (${money(s.revenueCents)})`],
        ["Invoice requests", String(s.invoiceRequests)],
        ["Checkouts started, not paid", String(s.unpaidCheckouts)],
        ...(s.refunded ? [["Refunded", String(s.refunded)] as [string, string]] : []),
        ...(s.disputed ? [["Disputed", String(s.disputed)] as [string, string]] : []),
      ],
    },
    { h: "Shipping" },
    {
      facts: [
        ["Shipped this week", String(s.shipped)],
        ["Paid and waiting to ship now", String(s.awaitingShipment)],
      ],
    },
  ];
  if (s.awaitingShipment > 0) blocks.push({ link: { label: "Open orders to ship", url: `${SITE_URL}/admin/orders` } });

  blocks.push({ h: "Accounts" });
  blocks.push({
    p: `${plural(s.newAccounts.length, "new account")} this week; ${plural(s.accountsTotal, "account")} in total.`,
  });
  if (s.newAccounts.length) {
    blocks.push({
      facts: s.newAccounts.slice(0, MAX_ROWS).map((a) => [
        a.email,
        [a.name, a.businessType, a.confirmed ? null : "email not confirmed"].filter(Boolean).join(" · ") || "(no details)",
      ]),
    });
    if (s.newAccounts.length > MAX_ROWS) blocks.push({ p: `…and ${s.newAccounts.length - MAX_ROWS} more.` });
  }

  blocks.push({ h: "Site traffic" }, { p: `${plural(s.pageViews, "page view")} this week.` });
  if (s.topProducts.length) {
    blocks.push(
      { p: "Most-viewed products:" },
      {
        facts: s.topProducts.map((p) => [
          p.name,
          `${plural(p.views, "view")}${p.signedInViewers ? `, ${plural(p.signedInViewers, "signed-in visitor")}` : ""}`,
        ]),
      }
    );
  }
  if (s.countries.length) {
    blocks.push({ p: "Views by country:" }, { facts: s.countries.map((c) => [c.name, plural(c.views, "view")]) });
  }

  if (s.restockWaiting.length) {
    blocks.push(
      { h: "Waiting for a restock" },
      { facts: s.restockWaiting.map((r) => [r.name, plural(r.waiting, "person", "people")]) },
      { link: { label: "Open back-in-stock emails", url: `${SITE_URL}/admin/restock` } }
    );
  }

  if (supabaseDashboard) {
    blocks.push({
      p:
        `Details per customer: Supabase Table Editor, "staff" schema (customer_activity, customer_timeline): ` +
        `${supabaseDashboard}/editor`,
    });
  }

  return renderEmail({
    audience: "staff",
    to: SUPPORT_EMAIL,
    subject: `EcoPeps weekly summary: ${s.label}`,
    heading: `Your week at EcoPeps: ${s.label}`,
    blocks,
  });
}

export function backInStockEmail(to: string, productName: string, productUrl: string): EmailMessage {
  return renderEmail({
    audience: "customer",
    to,
    subject: `${productName} is back in stock at EcoPeps`,
    heading: `${productName} is back in stock.`,
    blocks: [
      {
        p:
          `You asked us to let you know when ${productName} was available again. ` +
          "A new batch has passed its certificate of analysis (COA) testing and is in stock now.",
      },
      { link: { label: `View ${productName}`, url: productUrl } },
      {
        p:
          "This is a one-time email: you asked to be notified about this product, and we won't email you about " +
          "it again.",
      },
    ],
  });
}
