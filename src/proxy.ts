import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";
import { RETURN_TO_PARAM } from "@/lib/return-to";

const PUBLIC_PREFIXES = [
  "/enter",
  "/register",
  // Password recovery: reached signed out (forgot-password) or with only
  // the short-lived recovery session (reset-password).
  "/forgot-password",
  "/reset-password",
  // Lands the browser after clicking the email-confirmation link, before
  // a session exists yet (see src/app/(gate)/auth/callback/page.tsx).
  "/auth",
  "/quality",
  "/about",
  "/contact",
  "/legal",
  "/faq",
  "/shipping",
  // Vial QR codes link here (see src/app/c/[code]/route.ts). A customer
  // scanning a physical vial they already own must land on the COA
  // without being routed through the registration gate first.
  "/c",
];

function isPublicPath(pathname: string): boolean {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/coas") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return true;
  }
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Vial QR codes encode their URL in all capitals (HTTPS://ECOPEPS.COM/C/R1)
  // so the QR can use its compact alphanumeric mode and print at the
  // smallest size. Paths are case-sensitive, so serve /C/... from the
  // /c/[code] route.
  if (pathname.startsWith("/C/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/c/${pathname.slice(3)}`;
    return NextResponse.rewrite(url);
  }

  // Do not run code between refreshSession and the claims check below — a
  // simple mistake here can make it very hard to debug users being
  // randomly signed out. This runs on every request (not just gated ones)
  // so a session that's expired after a long idle period gets refreshed
  // before the visitor ever hits a page that needs it.
  const { claims, response } = await refreshSession(request);

  // Supabase only issues claims for a confirmed session (email
  // confirmations are required on this project), so having claims here
  // already implies a verified account.
  if (!claims && !isPublicPath(pathname)) {
    const enterUrl = request.nextUrl.clone();
    enterUrl.pathname = "/enter";
    enterUrl.search = "";
    // Bring them back here once signed in (src/lib/return-to.ts). The home
    // page is left out so a plain visit still lands on the catalog.
    if (pathname !== "/") {
      enterUrl.searchParams.set(RETURN_TO_PARAM, pathname + request.nextUrl.search);
    }
    const redirectResponse = NextResponse.redirect(enterUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next's static/image assets and common static
     * file extensions; other public paths are let through by isPublicPath.
     */
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|pdf)$).*)",
  ],
};
