"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "../register/RegisterFormParts";

export default function ForgotPasswordClient({
  linkExpired,
}: {
  linkExpired: boolean;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Enter your email address.");
      return;
    }

    setSubmitting(true);
    // The "Reset password" email template links to
    // /auth/confirm?token_hash=...&type=recovery, so no redirectTo here.
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(
      trimmedEmail
    );
    setSubmitting(false);

    // Supabase reports success whether or not the email has an account,
    // so this screen never reveals which emails are registered. An error
    // here is a real failure (e.g. rate limit), so show it.
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSentTo(trimmedEmail);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-3.5 py-10 sm:px-6">
      <section className="border border-brand-line bg-white px-6 py-8">
        <h1 className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-brand-slate-light">
          {sentTo ? "Check your email" : "Forgot password"}
        </h1>

        {sentTo ? (
          <p className="mt-3 text-center text-sm leading-relaxed text-brand-slate">
            If an account exists for <strong>{sentTo}</strong>, we&apos;ve
            sent a link to reset your password. It may take a minute to
            arrive — check your spam folder too.
          </p>
        ) : (
          <>
            {linkExpired && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                That reset link has expired or was already used. Request a
                new one below.
              </p>
            )}
            <p className="mt-3 text-center text-sm leading-relaxed text-brand-slate">
              Enter the email for your research account and we&apos;ll send
              you a link to choose a new password.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <Field
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                required
              />
              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary min-h-11 w-full disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center">
          <Link
            href="/register?mode=signin"
            className="text-sm font-medium text-brand-navy hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
