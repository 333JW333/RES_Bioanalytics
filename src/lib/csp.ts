/**
 * The site's Content Security Policy, sent as Content-Security-Policy-Report-Only
 * (next.config.ts): browsers report what it would block to /api/csp-report
 * but block nothing yet. Switch it to enforcing only after the reports have
 * been quiet for a while.
 *
 * What the browser loads from elsewhere today:
 * - Cloudflare Turnstile (src/components/Turnstile.tsx): its script and the
 *   challenge frame, both from challenges.cloudflare.com.
 * - Supabase Auth from the browser (sign-in, registration, password reset,
 *   session refresh): requests to NEXT_PUBLIC_SUPABASE_URL.
 * - Stripe: nothing. Checkout sends the shopper to Stripe's own page, a
 *   normal navigation that CSP doesn't restrict. Stripe.js isn't loaded.
 * - Plaid: nothing while ACH is off (src/lib/payments/methods.ts). Turning
 *   ACH on loads Plaid Link: add https://cdn.plaid.com to script-src and
 *   frame-src, and Plaid's API host to connect-src, first.
 * - Next.js puts its page data in inline <script> tags. The pages are
 *   prerendered, so they can't carry a per-request nonce; 'unsafe-inline'
 *   allows those scripts. A nonce-based policy would need every page rendered
 *   per request (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 */

export const CSP_REPORT_PATH = "/api/csp-report";
/** The Reporting API group name used by report-to (Reporting-Endpoints header). */
export const CSP_REPORT_GROUP = "csp-endpoint";

const TURNSTILE = "https://challenges.cloudflare.com";
/** Vercel's preview toolbar and comments (https://vercel.com/docs/vercel-toolbar/managing-toolbar). */
const VERCEL_LIVE = "https://vercel.live";

export interface CspOptions {
  /** `next dev`: React needs eval for its debugging tools. */
  dev?: boolean;
  /** Vercel preview deployments, which show the Vercel toolbar. */
  preview?: boolean;
  /** NEXT_PUBLIC_SUPABASE_URL. */
  supabaseUrl?: string;
}

/** The origin the browser's Supabase client talks to, or any Supabase project if unknown. */
export function supabaseOrigin(url: string | undefined): string {
  try {
    const { protocol, origin } = new URL(url ?? "");
    if (protocol === "https:" || protocol === "http:") return origin;
  } catch {
    // Fall through.
  }
  return "https://*.supabase.co";
}

export function contentSecurityPolicy({ dev = false, preview = false, supabaseUrl }: CspOptions = {}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", TURNSTILE, ...(dev ? ["'unsafe-eval'"] : [])],
    // React style={} attributes and Turnstile's widget need inline styles.
    "style-src": ["'self'", "'unsafe-inline'"],
    // data: for the two-step sign-in QR code (staff pages).
    "img-src": ["'self'", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", supabaseOrigin(supabaseUrl)],
    "frame-src": [TURNSTILE],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "report-uri": [CSP_REPORT_PATH],
    "report-to": [CSP_REPORT_GROUP],
  };
  if (preview) {
    directives["script-src"].push(VERCEL_LIVE);
    directives["style-src"].push(VERCEL_LIVE);
    directives["img-src"].push(VERCEL_LIVE, "https://vercel.com", "blob:");
    directives["font-src"].push(VERCEL_LIVE, "https://assets.vercel.com");
    directives["connect-src"].push(VERCEL_LIVE, "wss://ws-us3.pusher.com");
    directives["frame-src"].push(VERCEL_LIVE);
  }
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

// ---- Reports ------------------------------------------------------------------

/** Larger report bodies are ignored. A browser's batch of reports is a few KB. */
export const MAX_REPORT_BYTES = 64 * 1024;
const MAX_REPORTS = 10;

/** One violation, as written to the logs: no query strings, so no tokens or personal data. */
export interface CspViolation {
  directive: string;
  /** "inline", "eval", "data", a scheme like "chrome-extension:", or origin + path. */
  blocked: string;
  /** The page's path. */
  page: string | null;
  /** The script that caused it, if the browser said. */
  source: string | null;
  line: number | null;
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** A URL without its query string or fragment; a keyword ("inline", "eval") as is. */
function withoutQuery(value: string, keep: "path" | "origin+path"): string | null {
  if (!value) return null;
  if (/^[a-z-]+$/i.test(value)) return value.toLowerCase().slice(0, 40);
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return url.protocol;
    return (keep === "path" ? url.pathname : url.origin + url.pathname).slice(0, 200);
  } catch {
    return null;
  }
}

function violation(r: Obj, legacy: boolean): CspViolation {
  const pick = (legacyKey: string, key: string) => (legacy ? r[legacyKey] : r[key]);
  const directive = str(pick("effective-directive", "effectiveDirective")) || str(r["violated-directive"]);
  const line = Number(pick("line-number", "lineNumber"));
  return {
    directive: (directive.split(" ")[0] || "unknown").slice(0, 40),
    blocked: withoutQuery(str(pick("blocked-uri", "blockedURL")), "origin+path") ?? "unknown",
    page: withoutQuery(str(pick("document-uri", "documentURL")), "path"),
    source: withoutQuery(str(pick("source-file", "sourceFile")), "origin+path"),
    line: Number.isFinite(line) && line > 0 ? line : null,
  };
}

/**
 * The violations in a report body: the older report-uri format
 * ({"csp-report": {...}}, Firefox and Safari) or the Reporting API's
 * ([{type: "csp-violation", body: {...}}], Chrome and Edge).
 */
export function summarizeCspReports(body: unknown): CspViolation[] {
  if (isObj(body) && isObj(body["csp-report"])) return [violation(body["csp-report"], true)];
  if (!Array.isArray(body)) return [];
  return body
    .filter((r): r is Obj => isObj(r) && r.type === "csp-violation" && isObj(r.body))
    .slice(0, MAX_REPORTS)
    .map((r) => violation(r.body as Obj, false));
}
