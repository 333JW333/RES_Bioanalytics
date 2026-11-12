/* Payment-path security regressions: scheduled-job auth and the Stripe Customer's email. Run with `npm test`. */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { NextRequest } from "next/server";

const env = process.env as Record<string, string | undefined>;
function setEnv(name: string, value: string | undefined) {
  if (value === undefined) delete env[name];
  else env[name] = value;
}

setEnv("NEXT_PUBLIC_SUPABASE_URL", "http://supabase.test");
setEnv("SUPABASE_SECRET_KEY", "sb_secret_test_placeholder");
setEnv("STRIPE_SECRET_KEY", "sk_test_placeholder");

// ---- fetch mock: Supabase REST (processor_customers) + Stripe ------------------------
const calls: { method: string; path: string; body: URLSearchParams | null }[] = [];
let savedCustomer: { id: string; email: string | null } | null = null;
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = new URL(input instanceof Request ? input.url : String(input));
  const method = init?.method ?? "GET";
  if (url.host === "supabase.test") {
    if (url.pathname === "/rest/v1/processor_customers" && method === "GET") {
      const rows = savedCustomer ? [{ customer_id: savedCustomer.id }] : [];
      return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response("[]", { status: 201, headers: { "content-type": "application/json" } });
  }
  if (url.host === "api.stripe.com") {
    const path = url.pathname.replace("/v1", "");
    const body = init?.body instanceof URLSearchParams ? init.body : null;
    calls.push({ method, path, body });
    const ok = (o: unknown) => new Response(JSON.stringify(o), { status: 200 });
    if (savedCustomer && path === `/customers/${savedCustomer.id}`) {
      if (method === "POST") savedCustomer.email = body?.get("email") ?? savedCustomer.email;
      return ok({ id: savedCustomer.id, email: savedCustomer.email });
    }
    if (path === "/customers" && method === "POST") return ok({ id: "cus_new" });
    if (path === "/invoices") return ok({ id: "in_1", status: "draft", metadata: {} });
    if (path === "/invoiceitems") return ok({ id: "ii_1" });
    if (path === "/checkout/sessions") {
      return ok({ id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1", status: "open", payment_status: "unpaid", metadata: {} });
    }
  }
  throw new Error(`Unexpected fetch ${method} ${url}`);
}) as typeof fetch;

const { isCronAuthorized } = await import("@/lib/cron");
const { stripeProcessor } = await import("@/lib/payments/stripe-processor");

// ---- Scheduled jobs (/api/cron/*) --------------------------------------------------
const cronRequest = (authorization?: string) =>
  new Request("https://www.ecopeps.com/api/cron/daily-summary", {
    headers: authorization ? { authorization } : {},
  }) as unknown as NextRequest;

await test("Cron: a deployed build with no CRON_SECRET refuses everyone instead of letting anyone in", () => {
  const before = { secret: env.CRON_SECRET, nodeEnv: env.NODE_ENV };
  try {
    setEnv("CRON_SECRET", undefined);
    setEnv("NODE_ENV", "production");
    assert.equal(isCronAuthorized(cronRequest()), false);
    assert.equal(isCronAuthorized(cronRequest("Bearer anything")), false);
    assert.equal(isCronAuthorized(cronRequest("Bearer undefined")), false);
    setEnv("NODE_ENV", undefined);
    assert.equal(isCronAuthorized(cronRequest()), false, "unknown build mode fails closed");
    // Local `npm run dev` can still run a job by hand.
    setEnv("NODE_ENV", "development");
    assert.equal(isCronAuthorized(cronRequest()), true);
  } finally {
    setEnv("CRON_SECRET", before.secret);
    setEnv("NODE_ENV", before.nodeEnv);
  }
});

await test("Cron: with CRON_SECRET set, only the exact bearer token is accepted", () => {
  const before = { secret: env.CRON_SECRET, nodeEnv: env.NODE_ENV };
  try {
    setEnv("CRON_SECRET", "cron-secret-placeholder");
    for (const mode of ["production", "development"]) {
      setEnv("NODE_ENV", mode);
      assert.equal(isCronAuthorized(cronRequest("Bearer cron-secret-placeholder")), true);
      assert.equal(isCronAuthorized(cronRequest()), false);
      assert.equal(isCronAuthorized(cronRequest("Bearer wrong")), false);
      assert.equal(isCronAuthorized(cronRequest("cron-secret-placeholder")), false);
    }
  } finally {
    setEnv("CRON_SECRET", before.secret);
    setEnv("NODE_ENV", before.nodeEnv);
  }
});

// ---- The saved Stripe Customer follows the account's email ------------------------
const buyer = { userId: "00000000-0000-4000-8000-000000000001", email: "new-address@example.com", name: "Sam Lee" };
const lines = [{ sku: "RES-BPC-10", name: "BPC-157", sizeLabel: "10 mg", qty: 1, unitPrice: 79 }];
const index = (method: string, path: string) => calls.findIndex((c) => c.method === method && c.path === path);

await test("Stripe: after an email change, the saved Customer gets the new address before an invoice is drafted", async () => {
  calls.length = 0;
  savedCustomer = { id: "cus_saved", email: "old-address@example.com" };
  const result = await stripeProcessor.createInvoice!({ orderId: "11111111-2222-3333-4444-555555555555", buyer, lines, poNumber: null, netDays: 30 });
  assert.equal(result.customerId, "cus_saved", "the saved Customer is reused");
  const update = index("POST", "/customers/cus_saved");
  assert.ok(update >= 0, "the Customer's email is updated");
  assert.equal(calls[update].body?.get("email"), "new-address@example.com");
  assert.ok(update < index("POST", "/invoices"), "updated before the invoice copies it");
  assert.equal(savedCustomer.email, "new-address@example.com");
});

await test("Stripe: Checkout uses the account's current email too", async () => {
  calls.length = 0;
  savedCustomer = { id: "cus_saved", email: "old-address@example.com" };
  await stripeProcessor.createCheckout({
    orderId: "11111111-2222-3333-4444-555555555555", buyer, lines,
    successUrl: "https://www.ecopeps.com/checkout/success", cancelUrl: "https://www.ecopeps.com/checkout",
  });
  const update = index("POST", "/customers/cus_saved");
  assert.ok(update >= 0 && update < index("POST", "/checkout/sessions"));
});

await test("Stripe: an unchanged email isn't rewritten", async () => {
  calls.length = 0;
  savedCustomer = { id: "cus_saved", email: "new-address@example.com" };
  await stripeProcessor.createInvoice!({ orderId: "11111111-2222-3333-4444-555555555555", buyer, lines, poNumber: null, netDays: 30 });
  assert.equal(index("POST", "/customers/cus_saved"), -1);
  assert.equal(index("POST", "/customers"), -1, "no new Customer either");
});
