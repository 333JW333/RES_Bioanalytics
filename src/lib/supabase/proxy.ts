import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie for this request/response pair and
 * returns the verified claims (or null if signed out / session invalid).
 *
 * Always call this before making any auth decision in the Proxy — skipping
 * it means expired sessions never get refreshed, which randomly signs
 * users out. Uses getClaims() (verifies the JWT signature locally against
 * the project's published keys) rather than getSession(), which does not
 * revalidate and can be spoofed from request cookies alone.
 */
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // With Fluid compute, don't put this client in a global variable —
  // always create a new one per request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();

  return { claims: data?.claims ?? null, response };
}
