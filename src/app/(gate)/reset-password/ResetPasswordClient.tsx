"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "../register/RegisterFormParts";

// Reached from /auth/confirm after a recovery link is verified, which
// signs the user in; updateUser() then sets the new password on that
// session. Without a session (page opened directly, or the session
// expired) updateUser fails and the user is pointed back to request a
// fresh link.
export default function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [noSession, setNoSession] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setSubmitting(false);
      setNoSession(true);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setSubmitting(false);

    if (updateError) {
      setError(
        updateError.code === "same_password"
          ? "Choose a password different from your current one."
          : updateError.message
      );
      return;
    }
    router.replace("/shop");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-3.5 py-10 sm:px-6">
      <section className="border border-brand-line bg-white px-6 py-8">
        <h1 className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-brand-slate-light">
          Choose a new password
        </h1>

        {noSession ? (
          <>
            <p className="mt-3 text-center text-sm leading-relaxed text-brand-slate">
              Your reset session has expired. Request a new reset link to
              continue.
            </p>
            <Link
              href="/forgot-password"
              className="btn-primary mt-5 flex min-h-11 w-full items-center justify-center"
            >
              Request a new link
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <Field
              id="password"
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              required
            />
            <Field
              id="confirmPassword"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
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
              {submitting ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
