/* Security regressions: redirects, public-form tables, staff summaries, CSP. Run with `npm test`. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const { safeReturnPath } = await import("@/lib/return-to");
const { cleanPath } = await import("@/lib/page-views");
const ws = await import("@/lib/staff-reports");
const { staffActivityEmail } = await import("@/lib/email/report-emails");
const { contentSecurityPolicy, summarizeCspReports, supabaseOrigin } = await import("@/lib/csp");
const nextConfig = (await import("../next.config")).default;

// ---- Return-to (sign-in "next" parameter) ------------------------------------------

await test("Return-to: dot segments can't turn a path into another site", () => {
  for (const evil of [
    "/.//evil.example",
    "/..//evil.example",
    "/%2e//evil.example",
    "/%2e%2e//evil.example/x?y=1",
    "/a/..//evil.example",
    "/././/evil.example",
  ]) {
    const out = safeReturnPath(evil);
    assert.equal(out, null, `${evil} -> ${out}`);
  }
  // Already rejected before, still rejected.
  for (const evil of ["//evil.example", "/\\evil.example", "https://evil.example", "/\t/evil.example"]) {
    assert.equal(safeReturnPath(evil), null, evil);
  }
});

await test("Return-to: real pages still come back", () => {
  assert.equal(safeReturnPath("/shop/tb-500"), "/shop/tb-500");
  assert.equal(safeReturnPath("/shop?category=glp"), "/shop?category=glp");
  assert.equal(safeReturnPath("/shop/./tb-500"), "/shop/tb-500");
  assert.equal(safeReturnPath("/account/../shop"), "/shop");
  assert.equal(safeReturnPath("/register"), null, "gate pages loop");
});

// ---- Public-form tables: no direct inserts through the Data API --------------------

type TableState = { apiInsert: Set<string>; insertPolicies: Set<string> };

/**
 * Replays the migrations' grants and policies for the given tables, in
 * order, and returns which site-visitor roles can still insert directly.
 */
function replayMigrations(tables: string[]) {
  const dir = new URL("../supabase/migrations/", import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const state = new Map<string, TableState>(tables.map((t) => [t, { apiInsert: new Set(), insertPolicies: new Set() }]));
  const views = new Set<string>();
  const roles = (list: string) => ["anon", "authenticated"].filter((r) => new RegExp(`\\b${r}\\b`).test(list));

  for (const file of files) {
    // Strip comments, then split into statements.
    const sql = readFileSync(new URL(file, dir), "utf8").replace(/--[^\n]*/g, "");
    for (const raw of sql.split(";")) {
      const s = raw.replace(/\s+/g, " ").trim().toLowerCase();
      let m: RegExpMatchArray | null;
      if ((m = s.match(/^alter table public\.(\w+) rename to (\w+)$/))) {
        const old = state.get(m[1]);
        if (old) {
          state.delete(m[1]);
          state.set(m[2], old);
        }
      } else if ((m = s.match(/^create (?:or replace )?view public\.(\w+)/))) {
        views.add(m[1]);
      } else if ((m = s.match(/^drop view (?:if exists )?public\.(\w+)/))) {
        views.delete(m[1]);
      } else if ((m = s.match(/^grant ([\w, ]+) on (?:table )?public\.(\w+) to (.+)$/))) {
        const t = state.get(m[2]);
        if (t && /\b(insert|all)\b/.test(m[1])) roles(m[3]).forEach((r) => t.apiInsert.add(r));
      } else if ((m = s.match(/^revoke ([\w, ]+) on (?:table )?public\.(\w+) from (.+)$/))) {
        const t = state.get(m[2]);
        if (t && /\b(insert|all)\b/.test(m[1])) roles(m[3]).forEach((r) => t.apiInsert.delete(r));
      } else if ((m = s.match(/^create policy "([^"]+)" on public\.(\w+) (?:as \w+ )?for (insert|all) to (.+?)(?: with check| using|$)/))) {
        const t = state.get(m[2]);
        if (t && roles(m[4]).length) t.insertPolicies.add(m[1]);
      } else if ((m = s.match(/^alter policy "([^"]+)" on public\.(\w+) rename to "([^"]+)"$/))) {
        const t = state.get(m[2]);
        if (t?.insertPolicies.delete(m[1])) t.insertPolicies.add(m[3]);
      } else if ((m = s.match(/^drop policy (?:if exists )?"([^"]+)" on public\.(\w+)$/))) {
        state.get(m[2])?.insertPolicies.delete(m[1]);
      }
    }
  }
  return { state, views };
}

await test("Contact and restock tables only take rows from the server, after its checks", () => {
  // Turnstile (contact) and the catalog check (restock) run in server
  // actions; a direct insert with the public key would skip them.
  const { state, views } = replayMigrations(["enquiries", "restock_requests"]);
  for (const table of ["inquiries", "restock_requests"]) {
    const t = state.get(table);
    assert.ok(t, `${table} tracked`);
    assert.deepEqual([...t.insertPolicies], [], `${table}: insert policies for site visitors`);
    assert.deepEqual([...t.apiInsert], [], `${table}: insert granted to site visitors`);
  }
  assert.ok(!views.has("enquiries"), "the old enquiries alias view is gone");
});

await test("The contact and restock actions save with the secret key, after their checks", () => {
  const contact = readFileSync(new URL("../src/app/(store)/contact/actions.ts", import.meta.url), "utf8");
  const verified = contact.indexOf("verifyTurnstile(token)");
  const insert = contact.indexOf('createAdminClient().from("inquiries").insert(');
  assert.ok(verified > 0 && insert > verified, "inquiry saved with the secret key after the captcha check");

  const restock = readFileSync(new URL("../src/lib/restock.ts", import.meta.url), "utf8");
  const catalog = restock.indexOf("getProductBySlug(slug)");
  const claims = restock.indexOf("getClaims()");
  const save = restock.indexOf('createAdminClient().from("restock_requests").insert(');
  assert.ok(catalog > 0 && claims > catalog && save > claims, "restock row saved after the catalog and session checks");
  assert.match(restock, /product_slug: product\.slug/, "slug from the catalog, not the form");
});

// ---- Staff summaries: page views are public input ------------------------------------

const quietDay = {
  accounts_total: 1, new_accounts: [], paid_orders: 0, revenue_cents: 0, invoice_requests: 0, unpaid_checkouts: 0,
  shipped: 0, awaiting_shipment: 0, refunded: 0, disputed: 0, page_views: 900, countries: [], orders: [], inquiries: [],
};

await test("Staff summary lists only catalog products, whatever paths were recorded", () => {
  const injected = "URGENT-payouts-paused:verify-at-stripe-verify.example";
  const raw = {
    ...quietDay,
    top_products: [
      { slug: injected, views: 800, signed_in_viewers: 0 },
      { slug: "bpc-157", views: 40, signed_in_viewers: 3 },
    ],
    restock_waiting: [{ slug: injected, waiting: 50 }, { slug: "tb-500", waiting: 2 }],
    restock_requests: [{ email: "x@example.com", slug: injected }],
  };
  const window = ws.lastDay(new Date("2026-11-12T00:30:00Z"));
  const s = ws.toActivityData(raw, window);
  assert.deepEqual(s.topProducts.map((p) => p.name), ["BPC-157"]);
  assert.deepEqual(s.restockWaiting, [{ name: "TB-500", waiting: 2 }]);
  assert.deepEqual(s.restockRequests, []);
  const m = staffActivityEmail(s, "daily", null);
  assert.ok(!m.text.includes("stripe-verify") && !m.html.includes("stripe-verify"), "injected text reaches the email");
});

await test("Page views: only URL path characters are recorded", () => {
  assert.equal(cleanPath("/shop/bpc-157"), "/shop/bpc-157");
  assert.equal(cleanPath("/admin/progress/daily/2026-11-11"), "/admin/progress/daily/2026-11-11");
  assert.equal(cleanPath("/caf%C3%A9"), "/caf%C3%A9");
  assert.equal(cleanPath("/shop/URGENT: payouts paused, call 208 555 0100"), null);
  assert.equal(cleanPath("/shop/line\nbreak"), null);
  assert.equal(cleanPath("/shop/<b>x</b>"), null);
  assert.equal(cleanPath("/shop/café"), null);
});

// ---- Content Security Policy (report-only) --------------------------------------------

await test("CSP is sent report-only, never enforced", async () => {
  const config = nextConfig("phase-test");
  const routes = await config.headers!();
  const all = routes.find((r) => r.source === "/:path*");
  assert.ok(all, "headers on every path");
  const keys = all.headers.map((h) => h.key.toLowerCase());
  assert.ok(keys.includes("content-security-policy-report-only"));
  assert.ok(!keys.includes("content-security-policy"), "must not enforce yet");
  const endpoints = all.headers.find((h) => h.key === "Reporting-Endpoints");
  assert.equal(endpoints?.value, 'csp-endpoint="/api/csp-report"');
  // The existing headers stay.
  for (const k of ["x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy"]) {
    assert.ok(keys.includes(k), k);
  }
});

function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy.split(";").map((d) => {
      const [name, ...values] = d.trim().split(/\s+/);
      return [name, values] as [string, string[]];
    })
  );
}

await test("CSP allows what the site loads and nothing broader", () => {
  const d = directives(contentSecurityPolicy({ supabaseUrl: "https://abcxyz.supabase.co" }));
  assert.deepEqual(d.get("default-src"), ["'self'"]);
  assert.ok(d.get("script-src")!.includes("https://challenges.cloudflare.com"), "Turnstile script");
  assert.ok(d.get("frame-src")!.includes("https://challenges.cloudflare.com"), "Turnstile frame");
  assert.deepEqual(d.get("connect-src"), ["'self'", "https://abcxyz.supabase.co"]);
  assert.deepEqual(d.get("object-src"), ["'none'"]);
  assert.deepEqual(d.get("frame-ancestors"), ["'none'"]);
  assert.deepEqual(d.get("form-action"), ["'self'"]);
  assert.deepEqual(d.get("base-uri"), ["'self'"]);
  assert.deepEqual(d.get("report-uri"), ["/api/csp-report"]);
  assert.ok(!d.get("script-src")!.includes("'unsafe-eval'"), "no eval in production");
  for (const [name, values] of d) {
    assert.ok(!values.some((v) => v === "*" || v === "https:" || v === "http:"), `${name} allows any host`);
    assert.ok(!values.includes("https://vercel.live"), `${name}: Vercel toolbar only on previews`);
  }
});

await test("CSP: development allows eval, previews allow the Vercel toolbar", () => {
  assert.ok(directives(contentSecurityPolicy({ dev: true })).get("script-src")!.includes("'unsafe-eval'"));
  const preview = directives(contentSecurityPolicy({ preview: true }));
  assert.ok(preview.get("script-src")!.includes("https://vercel.live"));
  assert.ok(preview.get("connect-src")!.includes("wss://ws-us3.pusher.com"));
  assert.equal(supabaseOrigin(undefined), "https://*.supabase.co");
  assert.equal(supabaseOrigin("http://127.0.0.1:54321"), "http://127.0.0.1:54321");
  assert.equal(supabaseOrigin("javascript:alert(1)"), "https://*.supabase.co");
});

await test("CSP reports: both formats, logged without query strings", () => {
  const legacy = summarizeCspReports({
    "csp-report": {
      "document-uri": "https://www.ecopeps.com/auth/confirm?token_hash=SECRET&type=email",
      "blocked-uri": "https://evil.example/x.js?session=SECRET",
      "effective-directive": "script-src-elem",
      "source-file": "https://www.ecopeps.com/_next/static/chunks/a.js?v=1",
      "line-number": 12,
    },
  });
  assert.deepEqual(legacy, [
    {
      directive: "script-src-elem",
      blocked: "https://evil.example/x.js",
      page: "/auth/confirm",
      source: "https://www.ecopeps.com/_next/static/chunks/a.js",
      line: 12,
    },
  ]);
  assert.ok(!JSON.stringify(legacy).includes("SECRET"));

  const modern = summarizeCspReports([
    { type: "csp-violation", body: { documentURL: "https://www.ecopeps.com/shop?x=1", blockedURL: "inline", effectiveDirective: "script-src-elem" } },
    { type: "csp-violation", body: { documentURL: "https://www.ecopeps.com/", blockedURL: "chrome-extension://abc/inject.js", effectiveDirective: "script-src-elem" } },
    { type: "deprecation", body: {} },
  ]);
  assert.deepEqual(modern.map((v) => [v.page, v.blocked]), [["/shop", "inline"], ["/", "chrome-extension:"]]);

  assert.deepEqual(summarizeCspReports("nonsense"), []);
  assert.deepEqual(summarizeCspReports({ other: 1 }), []);
  const flood = Array.from({ length: 500 }, () => ({ type: "csp-violation", body: { blockedURL: "eval" } }));
  assert.equal(summarizeCspReports(flood).length, 10, "a batch is capped");
});
