import type { OrderStatus } from "@/lib/orders";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { money, renderEmail, type Block } from "./layout";
import type { EmailMessage } from "./send";

/**
 * The staff summary emails (daily at 5 p.m. Mountain Time, and weekly on
 * Mondays), and the one-time email customers get when a product they asked
 * about is back in stock.
 */

export type ReportPeriod = "daily" | "weekly";

export interface ActivityData {
  /** Short, for the subject, e.g. "Nov 11" or "Nov 9 – Nov 15, 2026". */
  label: string;
  /** The exact period covered, shown in the email. */
  range: string;
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
  /** Orders with news in the period (placed, paid, shipped, refunded…). */
  orders: {
    ref: string;
    email: string;
    amountCents: number;
    status: OrderStatus;
    paymentFlow: "checkout" | "invoice";
    shipped: boolean;
  }[];
  restockRequests: { email: string; product: string }[];
  inquiries: { email: string; name: string | null; subject: string }[];
  /** Customers' own changes on My Account -> Account Details. */
  profileChanges: { email: string; field: string; oldValue: string | null; newValue: string | null }[];
}

/** Changes worth a second look when screening accounts. */
export const SCREENING_FIELDS = ["business type", "industry", "EIN", "email (change requested)"];

/** Longer lists are cut here, with a count of the rest. */
const MAX_ROWS = 25;

export const STAFF_DASHBOARD_URL = `${SITE_URL}/admin`;

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

const ORDER_STATUS: Record<OrderStatus, string> = {
  pending: "awaiting payment",
  paid: "paid, ready to ship",
  processing: "bank payment processing",
  invoice_requested: "invoice requested: review it",
  payment_failed: "payment failed",
  refunded: "refunded",
  partially_refunded: "partly refunded",
  disputed: "DISPUTED: respond in the payment processor",
  canceled: "canceled",
};

function orderStatus(o: ActivityData["orders"][number]): string {
  if (o.shipped && (o.status === "paid" || o.status === "partially_refunded")) return "shipped";
  return ORDER_STATUS[o.status] ?? o.status;
}

/** Adds up to MAX_ROWS rows as a facts table, then "…and N more". */
function list<T>(blocks: Block[], rows: T[], row: (r: T) => [string, string]) {
  blocks.push({ facts: rows.slice(0, MAX_ROWS).map(row) });
  if (rows.length > MAX_ROWS) blocks.push({ p: `…and ${rows.length - MAX_ROWS} more.` });
}

export function staffActivityEmail(s: ActivityData, period: ReportPeriod, supabaseDashboard: string | null): EmailMessage {
  const daily = period === "daily";
  const blocks: Block[] = [
    { p: `${daily ? "Everything new" : "The week"} at www.ecopeps.com, ${s.range}.` },
    { link: { label: "Open the staff dashboard", url: STAFF_DASHBOARD_URL } },
  ];

  // What needs someone now.
  const todo: [string, string][] = [];
  if (s.awaitingShipment) todo.push(["To ship", `${plural(s.awaitingShipment, "paid order")} waiting`]);
  if (s.invoiceRequests) todo.push(["Invoices to review", `${s.invoiceRequests} new request${s.invoiceRequests === 1 ? "" : "s"}`]);
  if (s.disputed) todo.push(["Disputes", `${s.disputed} to respond to`]);
  if (s.inquiries.length) todo.push(["Contact form", plural(s.inquiries.length, "new message")]);
  const screening = s.profileChanges.filter((c) => SCREENING_FIELDS.includes(c.field)).length;
  if (screening) todo.push(["Account changes", `${screening} to business type, industry, EIN or email`]);
  if (todo.length) {
    blocks.push({ h: "Needs attention" }, { facts: todo });
    if (s.awaitingShipment) blocks.push({ link: { label: "Open orders to ship", url: `${SITE_URL}/admin/orders` } });
  }

  blocks.push({ h: "Orders" });
  blocks.push({
    facts: [
      ["Paid", `${s.paidOrders} (${money(s.revenueCents)})`],
      ["Invoice requests", String(s.invoiceRequests)],
      ["Checkouts started, not paid", String(s.unpaidCheckouts)],
      ["Shipped", String(s.shipped)],
      ...(s.refunded ? [["Refunded", String(s.refunded)] as [string, string]] : []),
      ...(s.disputed ? [["Disputed", String(s.disputed)] as [string, string]] : []),
    ],
  });
  if (s.orders.length) {
    list(blocks, s.orders, (o) => [
      `${o.ref} · ${money(o.amountCents)}`,
      `${o.email} · ${orderStatus(o)}${o.paymentFlow === "invoice" ? " (Net 30)" : ""}`,
    ]);
  }

  blocks.push(
    { h: "New accounts" },
    { p: `${plural(s.newAccounts.length, "new account")}; ${plural(s.accountsTotal, "account")} in total.` }
  );
  if (s.newAccounts.length) {
    list(blocks, s.newAccounts, (a) => [
      a.email,
      [a.name, a.businessType, a.confirmed ? null : "email not confirmed"].filter(Boolean).join(" · ") || "(no details)",
    ]);
  }

  if (s.inquiries.length) {
    blocks.push({ h: "Contact form messages" });
    list(blocks, s.inquiries, (i) => [i.email, [i.name, i.subject].filter(Boolean).join(" · ")]);
  }

  if (s.profileChanges.length) {
    blocks.push({ h: "Account details changed" });
    list(blocks, s.profileChanges, (c) => [
      c.email,
      c.field === "password" ? "changed their password" : `${c.field}: ${c.oldValue ?? "(blank)"} → ${c.newValue ?? "(blank)"}`,
    ]);
  }

  if (s.restockRequests.length) {
    blocks.push({ h: "New restock sign-ups" });
    list(blocks, s.restockRequests, (r) => [r.product, r.email]);
  }

  blocks.push({ h: "Site traffic" }, { p: `${plural(s.pageViews, "page view")}.` });
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

  const headline = [
    plural(s.paidOrders, "paid order"),
    s.awaitingShipment ? `${s.awaitingShipment} to ship` : null,
    plural(s.newAccounts.length, "new account"),
  ]
    .filter(Boolean)
    .join(", ");

  return renderEmail({
    audience: "staff",
    to: SUPPORT_EMAIL,
    subject: daily ? `EcoPeps daily update, ${s.label}: ${headline}` : `EcoPeps weekly summary: ${s.label}`,
    heading: daily ? `Today at EcoPeps: ${headline}` : `Your week at EcoPeps: ${s.label}`,
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
