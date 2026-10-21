import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the project's SECRET key, which bypasses
 * RLS. Use it only where there is no user session to act as (the Stripe
 * webhook) or to write rows users must not be able to write themselves
 * (orders, Stripe customer mapping) — and only after the route has checked
 * who the caller is. Never import this from a Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set.");
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
