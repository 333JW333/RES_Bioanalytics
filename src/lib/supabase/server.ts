import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// For Server Components and Route Handlers. In a Server Component,
// cookieStore.set() throws (Next.js only allows cookie writes from a Route
// Handler or Proxy) — that's caught and ignored here because the Proxy
// (src/proxy.ts) already refreshes the session on every request.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore since the
            // Proxy handles refreshing and writing the session cookie.
          }
        },
      },
    }
  );
}
