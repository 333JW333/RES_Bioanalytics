/* New-account alert, page-view tracking helpers. Run with `npm test`. */
import assert from "node:assert/strict";
import { test } from "node:test";

const { staffNewAccountEmail, mountainTime } = await import("@/lib/email/account-emails");
const { isFreshConfirmation, supabaseDashboardUrl } = await import("@/lib/account-notifications");
const { requestOrigin, formatLocation } = await import("@/lib/request-origin");
const { cleanPath, cleanReferrer } = await import("@/lib/page-views");


await test("Request origin: IP, decoded city, region, country, browser", () => {
  const o = requestOrigin(new Headers({
    "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    "x-vercel-ip-city": "S%C3%A3o%20Paulo",
    "x-vercel-ip-country-region": "SP",
    "x-vercel-ip-country": "BR",
    "user-agent": "Mozilla/5.0 Test",
  }));
  assert.deepEqual(o, { ip: "203.0.113.7", city: "São Paulo", region: "SP", country: "BR", userAgent: "Mozilla/5.0 Test" });
  assert.equal(formatLocation(o), "São Paulo, SP, BR");
  assert.equal(formatLocation(requestOrigin(new Headers())), null);
});

await test("Only a just-made confirmation counts as a new account", () => {
  const now = Date.parse("2026-11-11T18:00:00Z");
  assert.equal(isFreshConfirmation("2026-11-11T17:59:30Z", now), true);
  assert.equal(isFreshConfirmation("2026-11-11T17:40:00Z", now), false, "20 minutes old");
  assert.equal(isFreshConfirmation(null, now), false);
  assert.equal(isFreshConfirmation("garbage", now), false);
});

await test("Supabase dashboard link comes from the project URL", () => {
  assert.equal(supabaseDashboardUrl("https://udxfcoqrvbdnvjublwuo.supabase.co"), "https://supabase.com/dashboard/project/udxfcoqrvbdnvjublwuo");
  assert.equal(supabaseDashboardUrl("http://localhost:54321"), null);
  assert.equal(supabaseDashboardUrl(undefined), null);
});

await test("New-account email: details, location, Supabase pointers, escaping", () => {
  const msg = staffNewAccountEmail({
    userId: "cc661fbb-00e5-49dd-876a-b179e50b93ee", email: "a@example.com",
    firstName: "Asba", lastName: "<b>bas</b>", businessType: "Independent Researcher / Sole Proprietor",
    industry: null, website: "https://lab.example", phone: null, einOnFile: false,
    signedUpAt: "2026-11-11T02:17:02Z", confirmedAt: "2026-11-11T02:17:15Z", accountCount: 8,
    origin: { ip: "203.0.113.7", city: "Mumbai", region: "MH", country: "IN", userAgent: "Mozilla/5.0" },
    supabaseDashboard: "https://supabase.com/dashboard/project/ref",
  });
  assert.equal(msg.to, "support@ecopeps.com");
  assert.equal(msg.subject, "New account confirmed: Asba <b>bas</b> (Mumbai, MH, IN)");
  assert.ok(!msg.html.includes("<b>bas</b>") && msg.html.includes("&lt;b&gt;bas&lt;/b&gt;"), "HTML escaped");
  for (const s of ["Email: a@example.com", "Approx. location: Mumbai, MH, IN (from IP address)", "IP address: 203.0.113.7",
    "EIN on file: No", "Website: https://lab.example", "Accounts in total: 8", "Signed up: Nov 10, 2026, 7:17 PM MT",
    "customer_timeline", "https://supabase.com/dashboard/project/ref/editor"]) {
    assert.ok(msg.text.includes(s), `text has "${s}"`);
  }
  assert.ok(!msg.text.includes("Industry:"), "empty fields left out");
  assert.ok(!msg.text.includes("research use only"), "no customer footer on staff mail");
});

await test("Times shown in Mountain Time", () => {
  assert.equal(mountainTime("2026-07-01T18:00:00Z"), "Jul 1, 2026, 12:00 PM MT");
  assert.equal(mountainTime(null), "unknown");
});

await test("Page views keep the path only, never query strings or API/asset paths", () => {
  assert.equal(cleanPath("/shop/bpc-157"), "/shop/bpc-157");
  assert.equal(cleanPath("/auth/confirm?token_hash=secret&type=email"), "/auth/confirm");
  assert.equal(cleanPath("/checkout/success?order=abc#x"), "/checkout/success");
  assert.equal(cleanPath("/api/track"), null);
  assert.equal(cleanPath("/_next/static/x.js"), null);
  assert.equal(cleanPath("//evil.example/path"), null);
  assert.equal(cleanPath("https://evil.example"), null);
  assert.equal(cleanPath(42), null);
  assert.equal(cleanPath("/" + "a".repeat(500))!.length, 300);
});

await test("Referrer: other sites only, without their query string", () => {
  assert.equal(cleanReferrer("https://www.google.com/search?q=peptides", "www.ecopeps.com"), "https://www.google.com/search");
  assert.equal(cleanReferrer("https://www.ecopeps.com/shop", "www.ecopeps.com"), null);
  assert.equal(cleanReferrer("https://ecopeps.com/shop", "www.ecopeps.com"), null);
  assert.equal(cleanReferrer("javascript:alert(1)", "www.ecopeps.com"), null);
  assert.equal(cleanReferrer("", "www.ecopeps.com"), null);
});

