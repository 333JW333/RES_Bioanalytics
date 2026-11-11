/* Account Details rules, page-view retention, and account changes in the staff email. Run with `npm test`. */
import assert from "node:assert/strict";
import { test } from "node:test";

const d = await import("@/lib/account-details");
const { retentionCutoff, RETENTION_DAYS } = await import("@/lib/page-views");
const { deleteOldPageViews } = await import("@/lib/cron");
const { staffActivityEmail } = await import("@/lib/email/report-emails");
const ws = await import("@/lib/staff-reports");

const good = {
  firstName: "  Sam ",
  lastName: "Lee",
  phone: "(208) 555-0100",
  website: "lab.example.edu/research",
  businessType: "Business / Institution (EIN Required)",
  industry: "Biotechnology Company",
  ein: "123456789",
};

function form(values: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

await test("Details: valid input is trimmed, EIN formatted, blank website stored as empty", () => {
  const r = d.validateDetails(d.readDetails(form(good)));
  assert.ok(r.ok);
  assert.deepEqual(r.update, {
    first_name: "Sam",
    last_name: "Lee",
    phone: "(208) 555-0100",
    website: "lab.example.edu/research",
    business_type: "Business / Institution (EIN Required)",
    industry: "Biotechnology Company",
    ein: "12-3456789",
  });
  const noExtras = d.validateDetails(d.readDetails(form({ ...good, website: "", ein: "" })));
  assert.ok(noExtras.ok);
  assert.equal(noExtras.update.website, null);
  assert.equal(noExtras.update.ein, null);
});

await test("Details: each bad field gets its own message", () => {
  const r = d.validateDetails(
    d.readDetails(
      form({ firstName: "", lastName: "x".repeat(101), phone: "12", website: "not a site", businessType: "Other", industry: "Astrology", ein: "12-34" })
    )
  );
  assert.ok(!r.ok);
  assert.deepEqual(Object.keys(r.errors).sort(), ["businessType", "ein", "firstName", "industry", "lastName", "phone", "website"]);
});

await test("Phone numbers: common formats accepted, too few digits or odd characters refused", () => {
  for (const ok of ["208-555-0100", "(208) 555-0100", "+1 208 555 0100", "208.555.0100 ext 12", "2085550100"]) assert.ok(d.isPhone(ok), ok);
  for (const bad of ["", "555-01", "call me", "208<555>0100", "1".repeat(31)]) assert.ok(!d.isPhone(bad), bad);
});

await test("Websites: with or without https, no spaces, must have a real domain", () => {
  for (const ok of ["example.com", "https://lab.example.edu/research", "http://sub.example.co.uk"]) assert.ok(d.isWebsite(ok), ok);
  for (const bad of ["example", "javascript:alert(1)", "ftp://example.com", "my site.com", "https://localhost"]) {
    assert.ok(!d.isWebsite(bad), bad);
  }
  // Long saved addresses (one profile has 285 characters) still pass.
  assert.ok(d.isWebsite(`example.com/${"a".repeat(280)}`));
});

await test("EINs: 9 digits with or without the dash", () => {
  assert.equal(d.normalizeEin("123456789"), "12-3456789");
  assert.equal(d.normalizeEin("12-3456789"), "12-3456789");
  assert.equal(d.normalizeEin(" 12 3456789 "), "12-3456789");
  for (const bad of ["12345678", "1234567890", "AB-CDEFGHI"]) assert.equal(d.normalizeEin(bad), null, bad);
});

await test("New email: valid, lowercased, and different from the current one", () => {
  assert.deepEqual(d.validateNewEmail(" New@Lab.EDU ", "old@lab.edu"), { ok: true, email: "new@lab.edu" });
  assert.equal(d.validateNewEmail("OLD@lab.edu", "old@lab.edu").ok, false);
  for (const bad of ["", "no-at-sign", "a@b", 42]) assert.equal(d.validateNewEmail(bad, "old@lab.edu").ok, false);
});

await test("New password: 8 to 72 characters, typed the same twice", () => {
  assert.equal(d.validateNewPassword("correct horse", "correct horse").ok, true);
  assert.equal(d.validateNewPassword("short", "short").ok, false);
  assert.equal(d.validateNewPassword("x".repeat(73), "x".repeat(73)).ok, false);
  assert.equal(d.validateNewPassword("correct horse", "correct hose").ok, false);
});

await test("Page views older than 12 months are deleted, and only those", async () => {
  const now = Date.parse("2026-11-11T17:00:00Z");
  assert.equal(RETENTION_DAYS, 365);
  assert.equal(retentionCutoff(now), "2025-11-11T17:00:00.000Z");

  const calls: { count?: string; column?: string; value?: string }[] = [];
  const fake = {
    from(table: string) {
      assert.equal(table, "page_views");
      const call: (typeof calls)[number] = {};
      calls.push(call);
      return {
        delete(opts: { count: string }) {
          call.count = opts.count;
          return {
            lt(column: string, value: string) {
              call.column = column;
              call.value = value;
              return Promise.resolve({ error: null, count: 3 });
            },
          };
        },
      };
    },
  };
  assert.equal(await deleteOldPageViews(fake as never, now), 3);
  assert.deepEqual(calls, [{ count: "exact", column: "viewed_at", value: "2025-11-11T17:00:00.000Z" }]);
});

await test("Daily email lists account changes and flags business type, EIN and email changes", () => {
  const raw = {
    accounts_total: 5, new_accounts: [], paid_orders: 0, revenue_cents: 0, invoice_requests: 0, unpaid_checkouts: 0,
    shipped: 0, awaiting_shipment: 0, refunded: 0, disputed: 0, page_views: 0, top_products: [], countries: [],
    restock_waiting: [], orders: [], restock_requests: [], inquiries: [],
    profile_changes: [
      { email: "sam@lab.edu", field: "business type", old_value: "Independent Researcher / Sole Proprietor", new_value: "Business / Institution (EIN Required)" },
      { email: "sam@lab.edu", field: "EIN", old_value: null, new_value: "ending 6789" },
      { email: "kim@bio.io", field: "phone", old_value: "208-555-0100", new_value: "208-555-0199" },
      { email: "kim@bio.io", field: "password", old_value: null, new_value: "changed" },
    ],
  };
  const m = staffActivityEmail(ws.toActivityData(raw, ws.lastDay(new Date("2026-11-12T00:30:00Z"))), "daily", null);
  assert.match(m.text, /NEEDS ATTENTION/);
  assert.match(m.text, /Account changes: 2 to business type, industry, EIN or email/);
  assert.match(m.text, /ACCOUNT DETAILS CHANGED/);
  assert.match(m.text, /sam@lab\.edu: business type: Independent Researcher \/ Sole Proprietor → Business \/ Institution \(EIN Required\)/);
  assert.match(m.text, /sam@lab\.edu: EIN: \(blank\) → ending 6789/);
  assert.match(m.text, /kim@bio\.io: phone: 208-555-0100 → 208-555-0199/);
  assert.match(m.text, /kim@bio\.io: changed their password/);
});
