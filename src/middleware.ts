import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Cookie set after successful registration / sign-in. */
export const ACCESS_COOKIE = "ecopeps-access";
/** Cookie set after age + RUO confirm on /enter. */
export const AGE_COOKIE = "ecopeps-age";

const PUBLIC_PREFIXES = [
  "/enter",
  "/register",
  "/quality",
  "/about",
  "/contact",
  "/legal",
  "/faq",
  "/shipping",
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname) || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const hasAccess = request.cookies.get(ACCESS_COOKIE)?.value === "1";

  // Unregistered visitors: send storefront traffic through the Enter gate.
  if (!hasAccess) {
    const enterUrl = request.nextUrl.clone();
    enterUrl.pathname = "/enter";
    enterUrl.search = "";
    return NextResponse.redirect(enterUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets handled above via isPublicPath.
     * Excluding common static file extensions keeps the matcher lean.
     */
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|pdf)$).*)",
  ],
};
