"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Landing point for the "Confirm your email" link Supabase sends on
// signup. The confirmation link redirects here with the new session's
// tokens in the URL hash fragment (#access_token=...&refresh_token=...).
// Creating the browser client below triggers supabase-js's automatic
// detectSessionInUrl handling, which reads that fragment and writes the
// session cookie (via @supabase/ssr) before getSession() resolves — no
// custom token-parsing code needed here.
export default function AuthCallbackClient() {
  const router = useRouter();
  const [status, setStatus] = useState<"working" | "error">("working");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data, error }) => {
      if (error || !data.session) {
        setStatus("error");
        return;
      }
      router.replace("/shop");
    });
  }, [router]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-3.5 py-10 text-center sm:px-6">
      {status === "working" ? (
        <p className="text-sm text-brand-slate-light">
          Confirming your account…
        </p>
      ) : (
        <div className="border border-brand-line bg-white px-6 py-8">
          <h1 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-slate-light">
            Confirmation link expired
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-slate">
            This confirmation link is no longer valid — it may have expired
            or already been used. Try signing in, or request a new
            confirmation email from the registration page.
          </p>
          <Link
            href="/register?mode=signin"
            className="btn-primary mt-5 inline-flex min-h-11 items-center justify-center px-6"
          >
            Back to sign in
          </Link>
        </div>
      )}
    </main>
  );
}
