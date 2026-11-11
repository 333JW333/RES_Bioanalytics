/* Shipping, My Orders, staff summaries and back-in-stock emails. Run with `npm test`. */
import assert from "node:assert/strict";
import { test } from "node:test";

process.env.RESEND_API_KEY = "re_dummy";

// ---- fetch mock: Resend ------------------------------------------------------------
type Msg = { to: string[]; subject: string; html: string; text: string; reply_to: string; from: string };
const sent: Msg[] = [];
const batches: Msg[][] = [];
let resendFailNext = 0;
globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.startsWith("https://api.resend.com/emails")) {
    if (resendFailNext > 0) {
      resendFailNext--;
      return new Response(JSON.stringify({ message: "boom" }), { status: 500 });
    }
    const body = JSON.parse(String(init!.body));
    if (url.endsWith("/batch")) batches.push(body);
    else sent.push(body);
    return new Response(JSON.stringify({ id: "x" }), { status: 200 });
  }
  throw new Error(`Unexpected fetch ${url}`);
}) as typeof fetch;

// ---- In-memory Supabase admin client -------------------------------------------------
type Row = Record<string, unknown>;
function fakeAdmin(tables: Record<string, Row[]>, rpcs: Record<string, (args: Row) => unknown> = {}) {
  const builder = (table: string) => {
    const st: { op: "select" | "update" | "insert" | "delete"; fields?: Row; filters: ((r: Row) => boolean)[]; returning: boolean } = {
      op: "select", filters: [], returning: false,
    };
    tables[table] ??= [];
    const run = (): { data: unknown; error: unknown } => {
      const all = tables[table];
      if (st.op === "insert") {
        if (all.some((r) => r.id === st.fields!.id)) return { data: null, error: { code: "23505", message: "duplicate" } };
        all.push({ ...st.fields });
        return { data: null, error: null };
      }
      const rows = all.filter((r) => st.filters.every((f) => f(r)));
      if (st.op === "delete") {
        tables[table] = all.filter((r) => !rows.includes(r));
        return { data: null, error: null };
      }
      if (st.op === "update") {
        for (const r of rows) Object.assign(r, structuredClone(st.fields));
        return { data: st.returning ? rows.map((r) => structuredClone(r)) : null, error: null };
      }
      return { data: rows.map((r) => structuredClone(r)), error: null };
    };
    const b = {
      select() { if (st.op === "update") st.returning = true; return b; },
      update(fields: Row) { st.op = "update"; st.fields = fields; return b; },
      insert(fields: Row) { st.op = "insert"; st.fields = fields; return b; },
      delete() { st.op = "delete"; return b; },
      eq(c: string, v: unknown) { st.filters.push((r) => r[c] === v); return b; },
      in(c: string, v: unknown[]) { st.filters.push((r) => v.includes(r[c])); return b; },
      is(c: string, v: null) { st.filters.push((r) => (r[c] ?? null) === v); return b; },
      not(c: string, _op: "is", v: null) { st.filters.push((r) => (r[c] ?? null) !== v); return b; },
      async maybeSingle() {
        const res = run();
        if (res.error) return res;
        const rows = (res.data ?? []) as Row[];
        if (rows.length > 1) return { data: null, error: { message: "multiple rows" } };
        return { data: rows[0] ?? null, error: null };
      },
      then(res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) {
        try { return Promise.resolve(res(run())); } catch (e) { return rej ? rej(e) : Promise.reject(e); }
      },
    };
    return b;
  };
  return {
    from: builder,
    async rpc(name: string, args: Row) {
      if (rpcs[name]) return { data: rpcs[name](args), error: null };
      const o = tables.orders.find((r) => r.id === args.p_order_id)!;
      const list = o.notifications_sent as string[];
      if (name === "claim_order_notification") {
        if (list.includes(args.p_key as string)) return { data: null, error: null };
        list.push(args.p_key as string);
        return { data: true, error: null };
      }
      o.notifications_sent = list.filter((k) => k !== args.p_key);
      return { data: null, error: null };
    },
  };
}

function order(over: Row = {}): Row {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    created_at: "2026-11-11T00:00:00Z",
    email: "buyer@example.com",
    status: "paid",
    payment_flow: "checkout",
    processor: "stripe",
    amount_cents: 7900,
    items: [{ sku: "RES-TA1-10", name: "Thymosin Alpha-1", sizeLabel: "10 mg", qty: 1, unitPrice: 79 }],
    shipping: { name: "Lab Manager", line1: "1 Research Way", line2: null, city: "Denver", state: "CO", postalCode: "80202", country: "US" },
    po_number: null,
    ruo_attested_at: "2026-11-11T00:00:00Z",
    processor_checkout_id: "cs_test_1",
    processor_payment_id: "pi_1",
    processor_invoice_id: null,
    notifications_sent: [] as string[],
    shipped_at: null,
    carrier: null,
    tracking_number: null,
    ...over,
  };
}

const { trackingUrl, cleanTrackingNumber, isCarrier } = await import("@/lib/shipping");
const { customerOrderStatus, isVisibleToCustomer } = await import("@/lib/order-display");
const { staffEmails } = await import("@/lib/staff");
const emails = await import("@/lib/email/order-emails");
const { staffActivityEmail, backInStockEmail } = await import("@/lib/email/report-emails");
const lifecycle = await import("@/lib/order-lifecycle");
const ws = await import("@/lib/staff-reports");
const { sendBackInStockEmails } = await import("@/lib/restock-notify");
const { sendEmailBatch } = await import("@/lib/email/send");
type Admin = Parameters<typeof lifecycle.recordShipment>[3];

const reset = () => { sent.length = 0; batches.length = 0; resendFailNext = 0; };

// ---- Shipping helpers ------------------------------------------------------------------

await test("Tracking links per carrier; none for Other", () => {
  assert.equal(trackingUrl("USPS", "9400 1000"), "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400%201000");
  assert.match(trackingUrl("UPS", "1Z999")!, /^https:\/\/www\.ups\.com\/track\?tracknum=1Z999$/);
  assert.match(trackingUrl("FedEx", "1234")!, /fedex\.com\/fedextrack\/\?trknbr=1234$/);
  assert.match(trackingUrl("DHL", "JD01")!, /dhl\.com\/.*tracking-id=JD01$/);
  assert.equal(trackingUrl("Other", "ABC123"), null);
  assert.equal(trackingUrl(null, "ABC123"), null);
  assert.equal(trackingUrl("USPS", null), null);
});

await test("Tracking numbers: trimmed, 5-40 letters/digits/spaces/dashes", () => {
  assert.equal(cleanTrackingNumber("  9400  1000-22 "), "9400 1000-22");
  assert.equal(cleanTrackingNumber("1234"), null, "too short");
  assert.equal(cleanTrackingNumber("x".repeat(41)), null, "too long");
  assert.equal(cleanTrackingNumber("<script>"), null);
  assert.equal(cleanTrackingNumber(42), null);
  assert.equal(isCarrier("USPS"), true);
  assert.equal(isCarrier("usps"), false);
  assert.equal(isCarrier(null), false);
});

await test("Staff list: STAFF_EMAILS, lowercased; support@ecopeps.com by default", () => {
  assert.deepEqual(staffEmails(" A@Example.com, b@example.com ,"), ["a@example.com", "b@example.com"]);
  assert.deepEqual(staffEmails(""), ["support@ecopeps.com"]);
  assert.deepEqual(staffEmails(undefined), ["support@ecopeps.com"]);
});

// ---- My Orders ---------------------------------------------------------------------------

await test("My Orders hides canceled orders and abandoned checkouts", () => {
  const now = Date.parse("2026-11-11T12:00:00Z");
  assert.equal(isVisibleToCustomer("canceled", "2026-11-11T11:00:00Z", now), false);
  assert.equal(isVisibleToCustomer("pending", "2026-11-11T11:00:00Z", now), true);
  assert.equal(isVisibleToCustomer("pending", "2026-11-09T11:00:00Z", now), false);
  assert.equal(isVisibleToCustomer("paid", "2025-01-01T00:00:00Z", now), true);
  assert.equal(isVisibleToCustomer("payment_failed", "2026-11-11T11:00:00Z", now), true);
});

await test("My Orders status labels", () => {
  assert.deepEqual(customerOrderStatus("paid", null), { label: "Paid, preparing to ship", tone: "good" });
  assert.equal(customerOrderStatus("paid", "2026-11-11T00:00:00Z").label, "Shipped");
  assert.equal(customerOrderStatus("partially_refunded", "2026-11-11T00:00:00Z").label, "Shipped");
  assert.equal(customerOrderStatus("refunded", "2026-11-11T00:00:00Z").label, "Refunded", "a full refund outranks shipped");
  assert.equal(customerOrderStatus("disputed", null).tone, "bad");
  assert.equal(customerOrderStatus("invoice_requested", null).label, "Invoice requested");
});

// ---- Emails ------------------------------------------------------------------------------

const data = {
  id: "11111111-2222-3333-4444-555555555555", ref: "11111111", email: "buyer@example.com", createdAt: "2026-11-11T00:00:00Z",
  items: [{ sku: "RES-TA1-10", name: "Thymosin Alpha-1", sizeLabel: "10 mg", qty: 2, unitPrice: 79 }],
  amountCents: 15800, shipping: null, poNumber: null, paymentFlow: "checkout" as const, ruoAttestedAt: null,
} as Parameters<typeof emails.orderShippedEmail>[0];

await test("Shipped email: to the buyer, carrier, tracking number and link, research-use footer", () => {
  const m = emails.orderShippedEmail(data, "USPS", "9400 1000", "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400%201000");
  assert.equal(m.to, "buyer@example.com");
  assert.equal(m.subject, "Your EcoPeps order 11111111 has shipped");
  assert.match(m.text, /Carrier: USPS/);
  assert.match(m.text, /Tracking number: 9400 1000/);
  assert.match(m.text, /Track your package: https:\/\/tools\.usps\.com/);
  assert.match(m.html, /href="https:\/\/tools\.usps\.com\/go\/TrackConfirmAction\?tLabels=9400%201000"/);
  assert.match(m.text, /2 x Thymosin Alpha-1 \(10 mg\)/);
  assert.match(m.text, /laboratory research use only/);
});

await test("Shipped email without a tracking page has no link", () => {
  const m = emails.orderShippedEmail(data, "Other", "ABC12345", null);
  assert.doesNotMatch(m.text, /Track your package/);
  assert.match(m.text, /shipped via Other/);
});

await test("New paid order alert links staff to the Orders page", () => {
  const m = emails.staffNewOrderEmail(data, "Stripe", "https://dashboard.stripe.com/payments/pi_1");
  assert.match(m.text, /Mark it shipped: https:\/\/www\.ecopeps\.com\/admin\/orders/);
  assert.match(m.text, /Payment in Stripe: https:\/\/dashboard\.stripe\.com\/payments\/pi_1/);
});

await test("Back-in-stock email: product, link, one-time note, research-use footer", () => {
  const m = backInStockEmail("r@example.com", "BPC-157", "https://www.ecopeps.com/shop/bpc-157");
  assert.equal(m.to, "r@example.com");
  assert.equal(m.subject, "BPC-157 is back in stock at EcoPeps");
  assert.match(m.text, /View BPC-157: https:\/\/www\.ecopeps\.com\/shop\/bpc-157/);
  assert.match(m.text, /one-time email/);
  assert.match(m.text, /laboratory research use only/);
});

// ---- Recording shipments ------------------------------------------------------------------

await test("Mark shipped: saves carrier/tracking and emails the buyer once", async () => {
  reset();
  const o = order();
  const db = fakeAdmin({ orders: [o] }) as unknown as Admin;
  const r = await lifecycle.recordShipment(o.id as string, "USPS", "9400100022", db);
  assert.deepEqual(r, { saved: "shipped", email: "sent" });
  assert.equal(o.carrier, "USPS");
  assert.equal(o.tracking_number, "9400100022");
  assert.ok(o.shipped_at);
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].to, ["buyer@example.com"]);
  assert.equal(sent[0].from, "EcoPeps Orders <orders@ecopeps.com>");
  assert.match(sent[0].text, /tLabels=9400100022/);
  assert.deepEqual(o.notifications_sent, ["order_shipped:USPS:9400100022"]);

  // Submitting the same details again doesn't email twice.
  const again = await lifecycle.recordShipment(o.id as string, "USPS", "9400100022", db);
  assert.deepEqual(again, { saved: "updated", email: "sent" });
  assert.equal(sent.length, 1);
});

await test("Fixing the tracking number keeps the ship date and emails the new details", async () => {
  reset();
  const o = order({ shipped_at: "2026-11-10T00:00:00Z", carrier: "USPS", tracking_number: "WRONG123", notifications_sent: ["order_shipped:USPS:WRONG123"] });
  const db = fakeAdmin({ orders: [o] }) as unknown as Admin;
  const r = await lifecycle.recordShipment(o.id as string, "UPS", "1Z999AA10123456784", db);
  assert.deepEqual(r, { saved: "updated", email: "sent" });
  assert.equal(o.shipped_at, "2026-11-10T00:00:00Z");
  assert.equal(o.carrier, "UPS");
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /ups\.com\/track\?tracknum=1Z999AA10123456784/);
});

await test("Unpaid, fully refunded or disputed orders can't be marked shipped", async () => {
  for (const status of ["pending", "processing", "invoice_requested", "refunded", "disputed", "canceled"]) {
    reset();
    const o = order({ status });
    const db = fakeAdmin({ orders: [o] }) as unknown as Admin;
    const r = await lifecycle.recordShipment(o.id as string, "USPS", "9400100022", db);
    assert.deepEqual(r, { saved: "not_shippable", email: "skipped" }, status);
    assert.equal(o.shipped_at, null, status);
    assert.equal(sent.length, 0, status);
  }
  const partly = order({ status: "partially_refunded" });
  const r = await lifecycle.recordShipment(partly.id as string, "USPS", "9400100022", fakeAdmin({ orders: [partly] }) as unknown as Admin);
  assert.equal(r.saved, "shipped");
});

await test("Email failure: shipment stays saved, email unrecorded, resend sends it", async () => {
  reset();
  const o = order();
  const db = fakeAdmin({ orders: [o] }) as unknown as Admin;
  resendFailNext = 1;
  const origError = console.error; console.error = () => {};
  const r = await lifecycle.recordShipment(o.id as string, "FedEx", "123456789012", db);
  console.error = origError;
  assert.deepEqual(r, { saved: "shipped", email: "failed" });
  assert.ok(o.shipped_at);
  assert.deepEqual(o.notifications_sent, []);

  assert.equal(await lifecycle.resendShipmentEmail(o.id as string, db), "sent");
  assert.equal(sent.length, 1);
  // A resend on request goes out even though it was already sent.
  assert.equal(await lifecycle.resendShipmentEmail(o.id as string, db), "sent");
  assert.equal(sent.length, 2);
  assert.deepEqual(o.notifications_sent, ["order_shipped:FedEx:123456789012"]);
});

await test("Resend does nothing for an order that hasn't shipped", async () => {
  reset();
  const o = order();
  assert.equal(await lifecycle.resendShipmentEmail(o.id as string, fakeAdmin({ orders: [o] }) as unknown as Admin), "skipped");
  assert.equal(sent.length, 0);
});

await test("Without RESEND_API_KEY the shipment saves and no email is attempted", async () => {
  reset();
  delete process.env.RESEND_API_KEY;
  const o = order();
  const r = await lifecycle.recordShipment(o.id as string, "USPS", "9400100022", fakeAdmin({ orders: [o] }) as unknown as Admin);
  process.env.RESEND_API_KEY = "re_dummy";
  assert.deepEqual(r, { saved: "shipped", email: "skipped" });
  assert.equal(sent.length, 0);
});

// ---- Weekly summary dates (Mountain Time) -------------------------------------------------

const iso = (d: Date) => d.toISOString();

await test("Monday cron covers last Monday-Sunday, Mountain Standard Time", () => {
  const w = ws.lastFullWeek(new Date("2026-11-16T14:00:00Z"));
  assert.equal(iso(w.since), "2026-11-09T07:00:00.000Z");
  assert.equal(iso(w.until), "2026-11-16T07:00:00.000Z");
  assert.equal(w.key, "weekly:2026-11-16");
  assert.equal(w.label, "Nov 9 – Nov 15, 2026");
});

await test("Week spanning the fall daylight-saving change (Nov 1, 2026)", () => {
  const w = ws.lastFullWeek(new Date("2026-11-02T14:00:00Z"));
  assert.equal(iso(w.since), "2026-10-26T06:00:00.000Z", "midnight MDT");
  assert.equal(iso(w.until), "2026-11-02T07:00:00.000Z", "midnight MST");
  assert.equal(w.label, "Oct 26 – Nov 1, 2026");
});

await test("Week spanning the spring daylight-saving change (Mar 8, 2026)", () => {
  const w = ws.lastFullWeek(new Date("2026-03-09T14:00:00Z"));
  assert.equal(iso(w.since), "2026-03-02T07:00:00.000Z");
  assert.equal(iso(w.until), "2026-03-09T06:00:00.000Z");
});

await test("A late or repeated run still picks the same week", () => {
  assert.equal(ws.lastFullWeek(new Date("2026-11-18T20:00:00Z")).key, "weekly:2026-11-16", "Wednesday");
  assert.equal(ws.lastFullWeek(new Date("2026-11-16T07:30:00Z")).key, "weekly:2026-11-16", "00:30 Monday MT");
  assert.equal(ws.lastFullWeek(new Date("2026-11-16T06:30:00Z")).key, "weekly:2026-11-09", "23:30 Sunday MT");
});

await test("Start of day on the morning daylight saving ends", () => {
  // 01:30 MST on Nov 1; that day's midnight was still MDT (06:00 UTC).
  assert.equal(iso(ws.startOfDay(new Date("2026-11-01T08:30:00Z"))), "2026-11-01T06:00:00.000Z");
});

await test("Manual summaries: last 24 hours / 7 days, one per minute", () => {
  const w = ws.lastHours("weekly", new Date("2026-11-11T18:05:30Z"));
  assert.equal(iso(w.since), "2026-11-04T18:05:30.000Z");
  assert.equal(w.key, "manual-weekly:2026-11-11T18:05");
  assert.equal(w.label, "the last 7 days");
  const d = ws.lastHours("daily", new Date("2026-11-11T18:05:30Z"));
  assert.equal(iso(d.since), "2026-11-10T18:05:30.000Z");
  assert.equal(d.key, "manual-daily:2026-11-11T18:05");
  assert.equal(d.range, "Nov 10, 11:05 AM – Nov 11, 11:05 AM MT");
});

// ---- Daily summary timing (5 p.m. Mountain Time) -----------------------------------------

await test("Daily: 5:30 p.m. MST covers 5 p.m. yesterday to 5 p.m. today", () => {
  const w = ws.lastDay(new Date("2026-11-12T00:30:00Z"));
  assert.equal(iso(w.since), "2026-11-11T00:00:00.000Z");
  assert.equal(iso(w.until), "2026-11-12T00:00:00.000Z");
  assert.equal(w.key, "daily:2026-11-11");
  assert.equal(w.label, "Nov 11");
  assert.equal(w.range, "Nov 10, 5:00 PM – Nov 11, 5:00 PM MT");
});

await test("Daily: the 4 p.m. MST (23:00 UTC) run points at yesterday's, already sent", () => {
  assert.equal(ws.lastDay(new Date("2026-11-11T23:30:00Z")).key, "daily:2026-11-10");
});

await test("Daily in summer: the 23:00 UTC run is 5 p.m. MDT; the 00:00 UTC run repeats it", () => {
  const first = ws.lastDay(new Date("2026-07-15T23:20:00Z"));
  assert.equal(iso(first.until), "2026-07-15T23:00:00.000Z");
  assert.equal(first.key, "daily:2026-07-15");
  assert.equal(ws.lastDay(new Date("2026-07-16T00:20:00Z")).key, "daily:2026-07-15");
});

await test("Daily across daylight-saving changes: 25-hour and 23-hour days", () => {
  const fall = ws.lastDay(new Date("2026-11-02T00:10:00Z")); // Nov 1, 5:10 p.m. MST
  assert.equal(iso(fall.since), "2026-10-31T23:00:00.000Z", "Oct 31, 5 p.m. MDT");
  assert.equal(iso(fall.until), "2026-11-02T00:00:00.000Z", "Nov 1, 5 p.m. MST");
  const spring = ws.lastDay(new Date("2026-03-09T00:10:00Z")); // Mar 8, 6:10 p.m. MDT
  assert.equal(iso(spring.since), "2026-03-08T00:00:00.000Z", "Mar 7, 5 p.m. MST");
  assert.equal(iso(spring.until), "2026-03-08T23:00:00.000Z", "Mar 8, 5 p.m. MDT");
});

// ---- Summary content ------------------------------------------------------------------

const raw = {
  accounts_total: 12,
  new_accounts: [
    { email: "a@uni.edu", name: "Ada L", business_type: "University / Academic Lab", confirmed: true },
    { email: "b@example.com", name: null, business_type: null, confirmed: false },
  ],
  paid_orders: 3, revenue_cents: 23700, invoice_requests: 1, unpaid_checkouts: 4,
  shipped: 2, awaiting_shipment: 1, refunded: 0, disputed: 0, page_views: 1234,
  top_products: [{ slug: "bpc-157", views: 40, signed_in_viewers: 3 }, { slug: "gone-product", views: 2, signed_in_viewers: 0 }],
  countries: [{ country: "US", views: 1200 }, { country: "??", views: 34 }],
  restock_waiting: [{ slug: "tb-500", waiting: "5" as unknown as number }],
  orders: [
    { id: "7473f34d-1111-4111-8111-111111111111", email: "a@uni.edu", amount_cents: 15800, status: "paid" as const, payment_flow: "checkout" as const, shipped_at: null },
    { id: "5ab0c0de-4444-4444-8444-444444444444", email: "k@bio.io", amount_cents: 7900, status: "paid" as const, payment_flow: "checkout" as const, shipped_at: "2026-11-11T18:00:00Z" },
    { id: "9c21aa07-2222-4222-8222-222222222222", email: "o@acme.com", amount_cents: 52000, status: "invoice_requested" as const, payment_flow: "invoice" as const, shipped_at: null },
  ],
  restock_requests: [{ email: "w@lab.org", slug: "tb-500" }],
  inquiries: [{ email: "q@lab.org", name: "Quinn R", subject: "Bulk pricing" }],
};
const dayWindow = ws.lastDay(new Date("2026-11-12T00:30:00Z"));

await test("Summary data: product and country names, order refs, numbers", () => {
  const s = ws.toActivityData(raw, dayWindow);
  assert.deepEqual(s.topProducts.map((p) => p.name), ["BPC-157", "gone-product"]);
  assert.deepEqual(s.countries.map((c) => c.name), ["United States", "Unknown"]);
  assert.deepEqual(s.restockWaiting, [{ name: "TB-500", waiting: 5 }]);
  assert.deepEqual(s.restockRequests, [{ email: "w@lab.org", product: "TB-500" }]);
  assert.deepEqual(s.orders.map((o) => o.ref), ["7473F34D", "5AB0C0DE", "9C21AA07"]);
  assert.equal(s.revenueCents, 23700);
});

await test("Daily email: dashboard button first, what needs attention, and every new item", () => {
  const m = staffActivityEmail(ws.toActivityData(raw, dayWindow), "daily", "https://supabase.com/dashboard/project/abc");
  assert.equal(m.to, "support@ecopeps.com");
  assert.equal(m.subject, "EcoPeps daily update, Nov 11: 3 paid orders, 1 to ship, 2 new accounts");
  assert.match(m.text, /Everything new at www\.ecopeps\.com, Nov 10, 5:00 PM – Nov 11, 5:00 PM MT\./);
  const dash = m.text.indexOf("Open the staff dashboard: https://www.ecopeps.com/admin");
  assert.ok(dash > 0 && dash < m.text.indexOf("ORDERS"), "dashboard button near the top");
  assert.match(m.html, /href="https:\/\/www\.ecopeps\.com\/admin"/);
  for (const h of ["NEEDS ATTENTION", "ORDERS", "NEW ACCOUNTS", "CONTACT FORM MESSAGES", "NEW RESTOCK SIGN-UPS", "SITE TRAFFIC", "WAITING FOR A RESTOCK"]) {
    assert.match(m.text, new RegExp(h));
  }
  assert.match(m.text, /To ship: 1 paid order waiting/);
  assert.match(m.text, /Invoices to review: 1 new request/);
  assert.match(m.text, /Contact form: 1 new message/);
  assert.match(m.text, /Open orders to ship: https:\/\/www\.ecopeps\.com\/admin\/orders/);
  assert.match(m.text, /Paid: 3 \(\$237\.00\)/);
  assert.match(m.text, /7473F34D · \$158\.00: a@uni\.edu · paid, ready to ship/);
  assert.match(m.text, /5AB0C0DE · \$79\.00: k@bio\.io · shipped/);
  assert.match(m.text, /9C21AA07 · \$520\.00: o@acme\.com · invoice requested: review it \(Net 30\)/);
  assert.match(m.text, /2 new accounts; 12 accounts in total/);
  assert.match(m.text, /a@uni\.edu: Ada L · University \/ Academic Lab/);
  assert.match(m.text, /b@example\.com: email not confirmed/);
  assert.match(m.text, /q@lab\.org: Quinn R · Bulk pricing/);
  assert.match(m.text, /TB-500: w@lab\.org/);
  assert.match(m.text, /1,234 page views/);
  assert.match(m.text, /BPC-157: 40 views, 3 signed-in visitors/);
  assert.match(m.text, /TB-500: 5 people/);
  assert.doesNotMatch(m.text, /Refunded/, "zero refunds aren't listed");
  assert.doesNotMatch(m.text, /research use only/, "staff emails have no customer footer");
});

await test("Weekly email: same content, weekly subject", () => {
  const week = ws.lastFullWeek(new Date("2026-11-16T14:00:00Z"));
  const m = staffActivityEmail(ws.toActivityData(raw, week), "weekly", null);
  assert.equal(m.subject, "EcoPeps weekly summary: Nov 9 – Nov 15, 2026");
  assert.match(m.text, /The week at www\.ecopeps\.com, Nov 9 – Nov 15, 2026 \(Mountain Time\)\./);
  assert.match(m.text, /Open the staff dashboard: https:\/\/www\.ecopeps\.com\/admin/);
});

await test("Quiet day: no attention section, lists cut at 25", () => {
  const quiet = { ...raw, paid_orders: 0, revenue_cents: 0, invoice_requests: 0, awaiting_shipment: 0, restock_waiting: [], top_products: [], countries: [],
    orders: [], restock_requests: [], inquiries: [],
    new_accounts: Array.from({ length: 30 }, (_, i) => ({ email: `u${i}@x.com`, name: null, business_type: null, confirmed: true })) };
  const m = staffActivityEmail(ws.toActivityData(quiet, dayWindow), "daily", null);
  assert.equal(m.subject, "EcoPeps daily update, Nov 11: 0 paid orders, 30 new accounts");
  assert.doesNotMatch(m.text, /NEEDS ATTENTION/);
  assert.doesNotMatch(m.text, /Open orders to ship/);
  assert.doesNotMatch(m.text, /WAITING FOR A RESTOCK|CONTACT FORM|RESTOCK SIGN-UPS/);
  assert.match(m.text, /…and 5 more\./);
  assert.match(m.text, /u24@x\.com/);
  assert.doesNotMatch(m.text, /u25@x\.com/);
});

await test("Each summary is sent once; a failed send can be retried", async () => {
  reset();
  const tables: Record<string, Row[]> = { staff_reports: [] };
  const db = fakeAdmin(tables, { activity_summary: () => raw }) as never;
  const w = ws.lastFullWeek(new Date("2026-11-16T14:00:00Z"));

  resendFailNext = 1;
  await assert.rejects(ws.sendStaffReport("weekly", w, db));
  assert.equal(tables.staff_reports.length, 0, "failed send not recorded");

  assert.equal(await ws.sendStaffReport("weekly", w, db), "sent");
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0].to, ["support@ecopeps.com"]);
  assert.equal(await ws.sendStaffReport("weekly", w, db), "already_sent");
  assert.equal(sent.length, 1);

  // The two daily runs (23:00 and 00:00 UTC) send one email.
  const winter1 = ws.lastDay(new Date("2026-11-11T23:05:00Z")); // 4:05 p.m. MST: yesterday's
  const winter2 = ws.lastDay(new Date("2026-11-12T00:05:00Z")); // 5:05 p.m. MST: today's
  tables.staff_reports.push({ id: winter1.key });
  assert.equal(await ws.sendStaffReport("daily", winter1, db), "already_sent");
  assert.equal(await ws.sendStaffReport("daily", winter2, db), "sent");
  assert.equal(await ws.sendStaffReport("daily", ws.lastDay(new Date("2026-11-12T00:40:00Z")), db), "already_sent");
  assert.equal(sent.length, 2);
  assert.match(sent[1].subject, /^EcoPeps daily update, Nov 11:/);

  delete process.env.RESEND_API_KEY;
  assert.equal(await ws.sendStaffReport("daily", ws.lastHours("daily"), db), "email_off");
  process.env.RESEND_API_KEY = "re_dummy";
});

// ---- Back in stock ----------------------------------------------------------------------

function requests(slug: string, n: number, over: Row = {}): Row[] {
  return Array.from({ length: n }, (_, i) => ({ id: `${slug}-${i}`, email: `${slug}${i}@example.com`, product_slug: slug, notified_at: null, ...over }));
}

await test("Back in stock: emails everyone waiting once, one recipient per email", async () => {
  reset();
  const tables = { restock_requests: [...requests("bpc-157", 3), ...requests("bpc-157", 1, { id: "old", notified_at: "2026-10-01T00:00:00Z" }), ...requests("tb-500", 2)] };
  const db = fakeAdmin(tables) as never;
  const r = await sendBackInStockEmails("bpc-157", db);
  assert.deepEqual(r, { status: "sent", sent: 3, failed: 0 });
  assert.equal(batches.length, 1);
  assert.equal(batches[0].length, 3);
  for (const m of batches[0]) assert.equal(m.to.length, 1);
  assert.deepEqual(batches[0].map((m) => m.to[0]).sort(), ["bpc-1570@example.com", "bpc-1571@example.com", "bpc-1572@example.com"]);
  assert.equal(batches[0][0].subject, "BPC-157 is back in stock at EcoPeps");
  assert.equal(tables.restock_requests.find((x) => x.id === "old")!.notified_at, "2026-10-01T00:00:00Z", "earlier notice untouched");
  assert.ok(tables.restock_requests.filter((x) => x.product_slug === "bpc-157").every((x) => x.notified_at));
  assert.ok(tables.restock_requests.filter((x) => x.product_slug === "tb-500").every((x) => !x.notified_at), "other products untouched");

  assert.deepEqual(await sendBackInStockEmails("bpc-157", db), { status: "nobody_waiting" });
  assert.equal(batches.length, 1);
});

await test("Back in stock: refuses while the site still shows it sold out", async () => {
  reset();
  const tables = { restock_requests: requests("tb-500", 2) };
  assert.deepEqual(await sendBackInStockEmails("tb-500", fakeAdmin(tables) as never), { status: "still_sold_out" });
  assert.deepEqual(await sendBackInStockEmails("no-such-product", fakeAdmin(tables) as never), { status: "unknown_product" });
  assert.equal(batches.length, 0);
  assert.ok(tables.restock_requests.every((x) => !x.notified_at));
});

await test("Back in stock: 150 people go in batches of 100; a failed batch stays on the list", async () => {
  reset();
  const tables = { restock_requests: requests("ss-31", 150) };
  const db = fakeAdmin(tables) as never;
  resendFailNext = 1; // first batch fails
  const origError = console.error; console.error = () => {};
  const r = await sendBackInStockEmails("ss-31", db);
  console.error = origError;
  assert.deepEqual(r, { status: "sent", sent: 50, failed: 100 });
  assert.equal(tables.restock_requests.filter((x) => !x.notified_at).length, 100);

  const retry = await sendBackInStockEmails("ss-31", db);
  assert.deepEqual(retry, { status: "sent", sent: 100, failed: 0 });
  assert.ok(tables.restock_requests.every((x) => x.notified_at));
  assert.equal(batches.reduce((n, b) => n + b.length, 0), 150, "nobody emailed twice");
});

await test("A batch holds at most 100 emails", async () => {
  const m = backInStockEmail("a@example.com", "X", "https://www.ecopeps.com/shop/x");
  await assert.rejects(sendEmailBatch(Array(101).fill(m)), /at most 100/);
});

