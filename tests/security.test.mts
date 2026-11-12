/* Sign-in redirects, staff two-step setup, scheduled-job access. Run with `npm test`. */
import assert from "node:assert/strict";
import { test } from "node:test";

const { safeReturnPath } = await import("@/lib/return-to");
const { emailProvenRecently, EMAIL_PROOF_SECONDS } = await import("@/lib/staff");
const { isCronAuthorized } = await import("@/lib/cron");

await test("Return-to accepts pages on this site", () => {
  assert.equal(safeReturnPath("/shop/tb-500?x=1"), "/shop/tb-500?x=1");
  assert.equal(safeReturnPath("/account"), "/account");
});

await test("Return-to refuses anything that could leave the site", () => {
  for (const value of [
    "//evil.example",
    "/.//evil.example/login",
    "/%2e//evil.example/login",
    "/a/..//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "/register",
    "",
    null,
  ]) {
    assert.equal(safeReturnPath(value), null, String(value));
  }
});

await test("A first authenticator needs a recently opened emailed link, not just a password", () => {
  const now = 1_800_000_000;
  const ago = (seconds: number) => now - seconds;
  assert.equal(emailProvenRecently([{ method: "password", timestamp: ago(5) }], now), false, "password only");
  assert.equal(emailProvenRecently([{ method: "otp", timestamp: ago(120) }], now), true, "reset link 2 minutes ago");
  assert.equal(
    emailProvenRecently([{ method: "password", timestamp: ago(5) }, { method: "otp", timestamp: ago(120) }], now),
    true,
    "either entry counts"
  );
  assert.equal(emailProvenRecently([{ method: "otp", timestamp: ago(EMAIL_PROOF_SECONDS + 1) }], now), false, "too old");
  assert.equal(emailProvenRecently([{ method: "otp", timestamp: now + 3600 }], now), false, "from the future");
  assert.equal(emailProvenRecently([{ method: "totp", timestamp: ago(5) }], now), false, "an authenticator code");
  assert.equal(emailProvenRecently(undefined, now), false);
  assert.equal(emailProvenRecently("otp", now), false);
  assert.equal(emailProvenRecently([{ method: "otp" }], now), false, "no timestamp");
});

await test("Scheduled jobs refuse callers without the secret", () => {
  const request = (authorization?: string) =>
    ({ headers: new Headers(authorization ? { authorization } : {}) }) as Parameters<typeof isCronAuthorized>[0];
  const env = process.env as Record<string, string | undefined>;
  const saved = { secret: env.CRON_SECRET, node: env.NODE_ENV };
  try {
    env.CRON_SECRET = "s3cret";
    assert.equal(isCronAuthorized(request("Bearer s3cret")), true);
    assert.equal(isCronAuthorized(request("Bearer wrong")), false);
    assert.equal(isCronAuthorized(request()), false);

    delete env.CRON_SECRET;
    env.NODE_ENV = "production";
    assert.equal(isCronAuthorized(request()), false, "a deployment without the secret refuses");
    env.NODE_ENV = "development";
    assert.equal(isCronAuthorized(request()), true, "a developer's own machine may run the jobs");
  } finally {
    env.CRON_SECRET = saved.secret;
    env.NODE_ENV = saved.node;
    if (saved.secret === undefined) delete env.CRON_SECRET;
    if (saved.node === undefined) delete env.NODE_ENV;
  }
});
