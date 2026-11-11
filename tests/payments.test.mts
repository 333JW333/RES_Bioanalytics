/* Payments: processors, order updates and order emails. Run with `npm test`. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createHmac } from "node:crypto";

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.RESEND_API_KEY = "re_dummy";

// ---- fetch mock: Stripe + Resend ---------------------------------------------
type Sent = { to: string[]; subject: string; html: string; text: string; reply_to: string; from: string };
const sent: Sent[] = [];
let resendFailNext = 0;
let invoiceForPayment: Record<string, string> = {};
const stripeCalls: string[] = [];
globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.startsWith("https://api.resend.com/emails")) {
    if (resendFailNext > 0) {
      resendFailNext--;
      return new Response(JSON.stringify({ message: "boom" }), { status: 500 });
    }
    sent.push(JSON.parse(String(init!.body)));
    return new Response(JSON.stringify({ id: `email_${sent.length}` }), { status: 200 });
  }
  if (url.startsWith("https://api.stripe.com/v1/")) {
    stripeCalls.push(`${init?.method ?? "GET"} ${url.replace("https://api.stripe.com/v1", "")}`);
    if (url.includes("/invoice_payments")) {
      const pi = new URL(url).searchParams.get("payment[payment_intent]")!;
      const inv = invoiceForPayment[pi];
      return new Response(JSON.stringify({ data: inv ? [{ invoice: inv }] : [] }), { status: 200 });
    }
    if (url.includes("/charges/")) {
      return new Response(JSON.stringify({ id: "ch_1", payment_intent: "pi_from_charge", amount: 7000, amount_refunded: 0, refunded: false }), { status: 200 });
    }
  }
  throw new Error(`Unexpected fetch ${url}`);
}) as typeof fetch;

// ---- In-memory stand-in for the Supabase admin client ------------------------------
type Row = Record<string, unknown>;
function fakeAdmin(orders: Row[]) {
  const tables: Record<string, Row[]> = { orders };
  const builder = (table: string) => {
    const st: { op: "select" | "update"; fields?: Row; eq: [string, unknown][]; inList?: [string, unknown[]]; returning: boolean } = {
      op: "select", eq: [], returning: false,
    };
    const match = (r: Row) => st.eq.every(([c, v]) => r[c] === v) && (!st.inList || st.inList[1].includes(r[st.inList[0]]));
    const run = () => {
      const rows = (tables[table] ?? []).filter(match);
      if (st.op === "update") {
        for (const r of rows) Object.assign(r, structuredClone(st.fields));
        return st.returning ? rows.map((r) => structuredClone(r)) : null;
      }
      return rows.map((r) => structuredClone(r));
    };
    const b = {
      select() { if (st.op === "update") st.returning = true; return b; },
      update(fields: Row) { st.op = "update"; st.fields = fields; return b; },
      eq(c: string, v: unknown) { st.eq.push([c, v]); return b; },
      in(c: string, v: unknown[]) { st.inList = [c, v]; return b; },
      async maybeSingle() {
        const rows = run() ?? [];
        if (rows.length > 1) return { data: null, error: { message: "multiple rows" } };
        return { data: rows[0] ?? null, error: null };
      },
      then(res: (v: { data: unknown; error: null }) => unknown, rej?: (e: unknown) => unknown) {
        try { return Promise.resolve(res({ data: run(), error: null })); } catch (e) { return rej ? rej(e) : Promise.reject(e); }
      },
    };
    return b;
  };
  return {
    from: builder,
    async rpc(name: string, args: { p_order_id: string; p_key: string }) {
      const o = orders.find((r) => r.id === args.p_order_id)!;
      const list = o.notifications_sent as string[];
      if (name === "claim_order_notification") {
        if (list.includes(args.p_key)) return { data: null, error: null };
        list.push(args.p_key);
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
    status: "pending",
    payment_flow: "checkout",
    processor: "stripe",
    amount_cents: 7900,
    items: [{ sku: "SKU-1", name: "Thymosin Alpha-1", sizeLabel: "10 mg", qty: 1, unitPrice: 79 }],
    shipping: null,
    po_number: null,
    ruo_attested_at: "2026-11-11T00:00:00Z",
    processor_checkout_id: "cs_test_1",
    processor_payment_id: null,
    processor_invoice_id: null,
    notifications_sent: [] as string[],
    ...over,
  };
}


const { applyPaymentUpdate } = await import("@/lib/order-lifecycle");
const { stripeProcessor, translateEvent } = await import("@/lib/payments/stripe-processor");
const { WebhookVerificationError } = await import("@/lib/payments/types");
const emails = await import("@/lib/email/order-emails");
type Admin = Parameters<typeof applyPaymentUpdate>[2];
const kinds = () => sent.map((m) => `${m.to.join(",")} :: ${m.subject}`);

// ---- Stripe → store updates -------------------------------------------------------
const ev = (type: string, object: unknown) => ({ id: "evt_1", type, livemode: false, data: { object } });
const session = (over: Row = {}) => ({
  id: "cs_test_1", url: null, status: "complete", payment_status: "paid", client_reference_id: "u1",
  payment_intent: "pi_1", customer: "cus_1", metadata: { order_id: "11111111-2222-3333-4444-555555555555" },
  collected_information: { shipping_details: { name: "Ada Lab", address: { line1: "1 Main St", line2: null, city: "Boise", state: "ID", postal_code: "83702", country: "US" } } },
  ...over,
});

await test("Stripe: paid checkout becomes 'paid' with normalized shipping", async () => {
  const [u] = await translateEvent(ev("checkout.session.completed", session()));
  assert.equal(u.type, "paid");
  assert.deepEqual(u.ref, { orderId: "11111111-2222-3333-4444-555555555555", checkoutId: "cs_test_1" });
  assert.equal(u.type === "paid" && u.paymentId, "pi_1");
  assert.deepEqual(u.type === "paid" && u.shipping, { name: "Ada Lab", line1: "1 Main St", line2: null, city: "Boise", state: "ID", postalCode: "83702", country: "US" });
});
await test("Stripe: completed-but-unpaid (ACH) becomes 'processing'", async () => {
  const [u] = await translateEvent(ev("checkout.session.completed", session({ payment_status: "unpaid" })));
  assert.equal(u.type, "processing");
});
await test("Stripe: async success/failure and expiry", async () => {
  assert.equal((await translateEvent(ev("checkout.session.async_payment_succeeded", session())))[0].type, "paid");
  const [f] = await translateEvent(ev("checkout.session.async_payment_failed", session()));
  assert.equal(f.type, "failed"); assert.equal(f.type === "failed" && f.reason, "declined");
  assert.equal((await translateEvent(ev("checkout.session.expired", session({ status: "expired" }))))[0].type, "expired");
});
await test("Stripe: invoice events", async () => {
  const inv = { id: "in_1", status: "paid", metadata: { order_id: "o-1" } };
  const [p] = await translateEvent(ev("invoice.paid", inv));
  assert.equal(p.type, "paid"); assert.deepEqual(p.ref, { orderId: "o-1", invoiceId: "in_1" });
  const [u] = await translateEvent(ev("invoice.marked_uncollectible", inv));
  assert.equal(u.type === "failed" && u.reason, "uncollectible");
  assert.equal((await translateEvent(ev("invoice.voided", inv)))[0].type, "invoice_canceled");
});
await test("Stripe: refunds name the payment and look up a paid invoice", async () => {
  invoiceForPayment = { pi_inv: "in_9" };
  const [r] = await translateEvent(ev("charge.refunded", { id: "ch_1", amount: 7900, amount_refunded: 2000, refunded: false, payment_intent: "pi_inv" }));
  assert.equal(r.type, "refunded");
  assert.deepEqual(r.ref, { paymentId: "pi_inv", invoiceId: "in_9" });
  assert.equal(r.type === "refunded" && r.full, false);
  assert.equal(r.type === "refunded" && r.refundedCents, 2000);
});
await test("Stripe: dispute without a PaymentIntent looks up its charge", async () => {
  const [d] = await translateEvent(ev("charge.dispute.created", { id: "dp_1", amount: 7900, charge: "ch_1", payment_intent: null }));
  assert.equal(d.type, "disputed");
  assert.equal(d.ref.paymentId, "pi_from_charge");
  assert.equal(d.type === "disputed" && d.disputeId, "dp_1");
});
await test("Stripe: events the store doesn't need produce no updates", async () => {
  assert.deepEqual(await translateEvent(ev("customer.created", {})), []);
});

// ---- Webhook signature -------------------------------------------------------
await test("Stripe webhook: genuine signature accepted, forged one rejected", async () => {
  const body = JSON.stringify(ev("checkout.session.completed", session()));
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex");
  const ok = await stripeProcessor.parseWebhook(body, new Headers({ "stripe-signature": `t=${t},v1=${sig}` }));
  assert.equal(ok.eventId, "evt_1");
  assert.equal(ok.updates[0].type, "paid");
  await assert.rejects(
    stripeProcessor.parseWebhook(body, new Headers({ "stripe-signature": `t=${t},v1=${"0".repeat(64)}` })),
    (e: unknown) => e instanceof WebhookVerificationError
  );
  await assert.rejects(stripeProcessor.parseWebhook(body, new Headers()), (e: unknown) => e instanceof WebhookVerificationError);
});

// ---- Order lifecycle -----------------------------------------------------------
await test("Card paid: status, payment ID, shipping saved; buyer + staff emailed once", async () => {
  sent.length = 0;
  const o = order(); const db = fakeAdmin([o]) as unknown as Admin;
  const [u] = await translateEvent(ev("checkout.session.completed", session()));
  await applyPaymentUpdate(stripeProcessor, u, db);
  assert.equal(o.status, "paid"); assert.ok(o.paid_at); assert.equal(o.processor_payment_id, "pi_1");
  assert.equal((o.shipping as Row).city, "Boise");
  assert.deepEqual(kinds(), [
    "buyer@example.com :: Your EcoPeps order 11111111 is confirmed",
    "support@ecopeps.com :: New paid order 11111111, ready to ship ($79.00)",
  ]);
  assert.equal(sent[0].from, "EcoPeps Orders <orders@ecopeps.com>");
  assert.equal(sent[0].reply_to, "support@ecopeps.com");
  assert.ok(sent[1].html.includes("https://dashboard.stripe.com/test/payments/pi_1"));
  // Re-delivery: nothing new.
  await applyPaymentUpdate(stripeProcessor, u, db);
  assert.equal(sent.length, 2);
  // A late "processing" can't move it back.
  await applyPaymentUpdate(stripeProcessor, { type: "processing", ref: { orderId: o.id as string } }, db);
  assert.equal(o.status, "paid"); assert.equal(sent.length, 2);
});

await test("Bank (ACH): processing email, then confirmation when it clears", async () => {
  sent.length = 0;
  const o = order(); const db = fakeAdmin([o]) as unknown as Admin;
  await applyPaymentUpdate(stripeProcessor, { type: "processing", ref: { checkoutId: "cs_test_1" }, paymentId: "pi_2" }, db);
  assert.equal(o.status, "processing");
  assert.deepEqual(kinds(), ["buyer@example.com :: We received your EcoPeps order 11111111"]);
  await applyPaymentUpdate(stripeProcessor, { type: "paid", ref: { checkoutId: "cs_test_1" } }, db);
  assert.equal(o.status, "paid"); assert.equal(sent.length, 3);
});

await test("Bank (ACH) fails: buyer told it didn't go through", async () => {
  sent.length = 0;
  const o = order({ status: "processing" }); const db = fakeAdmin([o]) as unknown as Admin;
  await applyPaymentUpdate(stripeProcessor, { type: "failed", ref: { orderId: o.id as string }, reason: "declined" }, db);
  assert.equal(o.status, "payment_failed");
  assert.deepEqual(kinds(), ["buyer@example.com :: Payment for EcoPeps order 11111111 didn't go through"]);
});

await test("Invoice written off as uncollectible: status changes, no email", async () => {
  sent.length = 0;
  const o = order({ status: "invoice_requested", payment_flow: "invoice", processor_invoice_id: "in_1" }); const db = fakeAdmin([o]) as unknown as Admin;
  await applyPaymentUpdate(stripeProcessor, { type: "failed", ref: { invoiceId: "in_1" }, reason: "uncollectible" }, db);
  assert.equal(o.status, "payment_failed"); assert.equal(sent.length, 0);
});

await test("Abandoned checkout expires to canceled without email", async () => {
  sent.length = 0;
  const o = order(); const db = fakeAdmin([o]) as unknown as Admin;
  await applyPaymentUpdate(stripeProcessor, { type: "expired", ref: { orderId: o.id as string } }, db);
  assert.equal(o.status, "canceled"); assert.equal(sent.length, 0);
});

await test("Refunds: partial then full, one email each, invoice order found via its invoice", async () => {
  sent.length = 0;
  const o = order({ status: "paid", payment_flow: "invoice", processor_invoice_id: "in_9", processor_checkout_id: null });
  const db = fakeAdmin([o]) as unknown as Admin;
  const partial = { type: "refunded" as const, ref: { paymentId: "pi_inv", invoiceId: "in_9" }, full: false, refundedCents: 2000 };
  await applyPaymentUpdate(stripeProcessor, partial, db);
  assert.equal(o.status, "partially_refunded");
  assert.equal(o.processor_payment_id, "pi_inv", "payment ID saved on the invoice order");
  await applyPaymentUpdate(stripeProcessor, partial, db); // re-delivery
  await applyPaymentUpdate(stripeProcessor, { ...partial, full: true, refundedCents: 7900 }, db);
  assert.equal(o.status, "refunded");
  assert.deepEqual(kinds(), [
    "buyer@example.com :: Refund issued for EcoPeps order 11111111",
    "buyer@example.com :: Refund issued for EcoPeps order 11111111",
  ]);
  assert.ok(sent[0].text.includes("$20.00 of $79.00")); assert.ok(sent[1].text.includes("refunded $79.00 for"));
});

await test("Dispute: status disputed, staff alerted with a link, buyer not emailed", async () => {
  sent.length = 0;
  const o = order({ status: "paid", processor_payment_id: "pi_1" }); const db = fakeAdmin([o]) as unknown as Admin;
  await applyPaymentUpdate(stripeProcessor, { type: "disputed", ref: { paymentId: "pi_1" }, disputeId: "dp_1", amountCents: 7900 }, db);
  assert.equal(o.status, "disputed");
  assert.deepEqual(kinds(), ["support@ecopeps.com :: Payment disputed: order 11111111 ($79.00)"]);
  assert.ok(sent[0].html.includes("https://dashboard.stripe.com/test/disputes/dp_1"));
});

await test("Email outage: the update throws (so the webhook retries) and the retry sends it once", async () => {
  sent.length = 0;
  const o = order(); const db = fakeAdmin([o]) as unknown as Admin;
  resendFailNext = 1;
  const u = { type: "paid" as const, ref: { orderId: o.id as string }, paymentId: "pi_1" };
  await assert.rejects(applyPaymentUpdate(stripeProcessor, u, db));
  assert.equal(o.status, "paid");
  assert.deepEqual(o.notifications_sent, [], "failed email not recorded as sent");
  await applyPaymentUpdate(stripeProcessor, u, db); // the processor's retry
  assert.deepEqual(kinds(), [
    "buyer@example.com :: Your EcoPeps order 11111111 is confirmed",
    "support@ecopeps.com :: New paid order 11111111, ready to ship ($79.00)",
  ]);
  await applyPaymentUpdate(stripeProcessor, u, db);
  assert.equal(sent.length, 2);
});

await test("Updates for unknown orders, or another processor's orders, change nothing", async () => {
  sent.length = 0;
  const o = order({ processor: "other" }); const db = fakeAdmin([o]) as unknown as Admin;
  await applyPaymentUpdate(stripeProcessor, { type: "paid", ref: { orderId: o.id as string } }, db);
  await applyPaymentUpdate(stripeProcessor, { type: "paid", ref: { orderId: "not-a-uuid", checkoutId: "cs_missing" } }, db);
  assert.equal(o.status, "pending"); assert.equal(sent.length, 0);
});

// ---- Email content --------------------------------------------------------------
await test("Emails escape customer-entered text and carry the RUO notice", () => {
  const msg = emails.orderConfirmedEmail({
    id: "11111111-2222-3333-4444-555555555555", ref: "11111111", email: "b@example.com", createdAt: "2026-11-11T00:00:00Z",
    items: [{ sku: "S", name: "BPC-157", sizeLabel: "10 mg", qty: 2, unitPrice: 45.5 }], amountCents: 9100,
    shipping: { name: "<script>alert(1)</script>", line1: "1 Main", line2: null, city: "Boise", state: "ID", postalCode: "83702", country: "US" },
    poNumber: null, paymentFlow: "checkout", ruoAttestedAt: null,
  });
  assert.ok(!msg.html.includes("<script>")); assert.ok(msg.html.includes("&lt;script&gt;"));
  assert.ok(msg.html.includes("$91.00")); assert.ok(msg.text.includes("2 x BPC-157 (10 mg)  $91.00"));
  assert.ok(msg.text.includes("laboratory research use only"));
  assert.ok(msg.text.includes("Boise, ID 83702"));
});

