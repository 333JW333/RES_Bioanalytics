// Sends a visitor back to the page they were opening (e.g. a product) once
// they've signed in or confirmed a new account, instead of the catalog.
// The proxy adds it to the gate as ?next=/shop/tb-500 and each gate page
// passes it along. The emailed confirmation link can't carry it, so sign-up
// also leaves it in a cookie that the confirm step reads.

export const RETURN_TO_PARAM = "next";
export const RETURN_TO_COOKIE = "ecopeps-return-to";

// Returning to these would loop back through sign-in.
const GATE_PATHS = ["/enter", "/register", "/auth", "/forgot-password", "/reset-password"];

/**
 * `value` as a path on this site (e.g. "/shop/tb-500"), or null. Anything
 * that could leave the site ("//evil.com", "https://…", "/\evil.com") is
 * rejected, so a crafted sign-in link can't send people elsewhere.
 */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.includes("\\")) {
    return null;
  }
  const base = "https://ecopeps.invalid";
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return null;
  }
  if (url.origin !== base) return null;
  if (GATE_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) {
    return null;
  }
  return url.pathname + url.search;
}

/** `path` with the return-to page added, e.g. "/register?mode=signin&next=%2Fshop%2Ftb-500". */
export function withReturnTo(path: string, returnTo: string | null): string {
  if (!returnTo) return path;
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(RETURN_TO_PARAM, returnTo);
  return `${pathname}?${params}`;
}

/** Browser only: keep `returnTo` for the confirm-email step (a day, like the link). */
export function rememberReturnTo(returnTo: string | null) {
  if (!returnTo) return;
  try {
    document.cookie = `${RETURN_TO_COOKIE}=${encodeURIComponent(returnTo)}; path=/; max-age=86400; SameSite=Lax`;
  } catch {
    // Cookies unavailable: the confirm step falls back to the catalog.
  }
}

/** Browser only: the remembered return-to page, cleared once read. */
export function takeRememberedReturnTo(): string | null {
  try {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${RETURN_TO_COOKIE}=`))
      ?.slice(RETURN_TO_COOKIE.length + 1);
    document.cookie = `${RETURN_TO_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    return raw ? safeReturnPath(decodeURIComponent(raw)) : null;
  } catch {
    return null;
  }
}
