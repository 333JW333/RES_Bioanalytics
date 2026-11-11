/**
 * What a page view records: the page's path (never the query string, which
 * can hold sign-in tokens or order numbers) and, for the first page of a
 * visit, the other website that linked to us. Disclosed in the Privacy
 * Policy, sections 1 and 7; records older than RETENTION_DAYS are deleted
 * every day by the daily scheduled job (deleteOldPageViews in src/lib/cron.ts).
 */

export const RETENTION_DAYS = 365;

/** The oldest a page view may be, as of `now`. */
export function retentionCutoff(now = Date.now()): string {
  return new Date(now - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** A path like "/shop/bpc-157", or null for anything we don't record. */
export function cleanPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  const path = value.split(/[?#]/)[0].slice(0, 300);
  if (path.startsWith("/api/") || path.startsWith("/_next/")) return null;
  return path;
}

/** Another site's address that linked here (origin + path, no query), or null. */
export function cleanReferrer(value: unknown, ownHost: string): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.replace(/^www\./, "");
    if (host === ownHost.replace(/^www\./, "").split(":")[0]) return null;
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return null;
  }
}
