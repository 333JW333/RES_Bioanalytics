"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LogoMark } from "@/components/icons";
import Turnstile from "@/components/Turnstile";
import { createClient } from "@/lib/supabase/client";
import {
  BUSINESS_TYPES,
  INDUSTRY_AFFILIATIONS,
  readAgeVerified,
  type BusinessType,
  type IndustryAffiliation,
} from "@/lib/gate";
import {
  AcknowledgmentBlock,
  TermsScrollBox,
  Field,
  DualField,
  SelectField,
} from "./RegisterFormParts";

export type Mode = "register" | "signin";

// Supabase answers a resend with success even when it sends nothing
// (the account is already confirmed), so "email resent" would be untrue
// in that case. This wording is accurate either way.
const RESENT_NOTE =
  "If your account still needs confirming, we've sent a new link. Already confirmed? Just sign in.";
type View = "form" | "confirmPending";

export default function RegisterClient({
  initialMode = "register",
}: {
  initialMode?: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [view, setView] = useState<View>("form");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [industry, setIndustry] = useState<IndustryAffiliation | "">("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ackAccepted, setAckAccepted] = useState(false);
  const [ackTouched, setAckTouched] = useState(false);

  useEffect(() => {
    // One-time client-only auth-gate check on mount (SSR-safe: readAgeVerified
    // reads localStorage/cookies, unavailable during server render).
    if (!readAgeVerified()) {
      router.replace("/enter");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, [router]);

  // Supabase rejects auth requests without a Turnstile token once captcha
  // protection is on. Each token is single-use, so the widget is reset
  // after every request that sent one.
  function takeCaptchaToken(): string | null {
    if (!captchaToken) {
      setError(
        "Please wait for the security check below to finish, then try again."
      );
      return null;
    }
    setCaptchaResetKey((k) => k + 1);
    return captchaToken;
  }

  async function handleResend() {
    // On the sign-in form the resend button and its result live inside
    // the "confirm your email" error box, so clearing the error there
    // would hide both.
    if (view === "confirmPending") setError(null);
    const token = takeCaptchaToken();
    if (!token) return;
    setResending(true);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: { captchaToken: token },
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setResent(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsConfirmation(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const supabase = createClient();

    if (mode === "register") {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Enter your first and last name.");
        return;
      }
      if (!businessType) {
        setError("Select a business type.");
        return;
      }
      if (!industry) {
        setError("Select an industry / research affiliation.");
        return;
      }
      if (!phone.trim()) {
        setError("Enter a phone number.");
        return;
      }
      if (trimmedEmail !== confirmEmail.trim().toLowerCase()) {
        setError("Email addresses do not match.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setAckTouched(true);
      if (!ackAccepted) {
        setError("Please complete the research use certification.");
        return;
      }

      const token = takeCaptchaToken();
      if (!token) return;
      setSubmitting(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          captchaToken: token,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            business_type: businessType,
            industry,
            website: website.trim(),
            phone: phone.trim(),
            terms_accepted_at: new Date().toISOString(),
          },
        },
      });
      setSubmitting(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Email confirmations are required on this project, so a fresh
      // signUp never returns an active session — it always needs the
      // confirmation link. (Supabase also returns success-with-no-error
      // here for an email that's already registered, to avoid leaking
      // which emails have accounts — the "check your email" message
      // covers that case correctly either way.)
      if (data.session) {
        router.push("/shop");
        return;
      }
      setView("confirmPending");
      return;
    }

    const token = takeCaptchaToken();
    if (!token) return;
    setSubmitting(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
      options: { captchaToken: token },
    });
    setSubmitting(false);

    if (signInError) {
      if (signInError.code === "email_not_confirmed") {
        setNeedsConfirmation(true);
        setError(
          "Confirm your email before signing in — check your inbox for the confirmation link."
        );
        return;
      }
      setError("Incorrect email or password.");
      return;
    }

    if (data.session) {
      router.push("/shop");
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-brand-ice text-sm text-brand-slate-light">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(7,26,44,0.08) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-3.5 py-7 sm:px-6 sm:py-10">
        <header className="mb-5 flex flex-col items-center text-center sm:mb-6">
          <Link href="/enter" className="inline-flex items-center gap-2.5">
            <LogoMark className="h-9 w-9 sm:h-8 sm:w-8" />
            <span className="text-xl font-bold tracking-tight text-brand-navy">
              EcoPeps
            </span>
          </Link>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-slate-light sm:text-xs">
            Research account access
          </p>
        </header>

        {view === "confirmPending" ? (
          <section className="border border-brand-line bg-white px-4 py-6 text-center sm:px-7 sm:py-8">
            <h1 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-slate-light">
              Check your email
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-brand-slate">
              We sent a confirmation link to <strong>{email.trim()}</strong>.
              Click it to activate your account, then come back here to sign
              in.
            </p>

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-800">
                {error}
              </p>
            )}

            <div className="mt-5">
              <Turnstile
                onToken={setCaptchaToken}
                resetKey={captchaResetKey}
              />
            </div>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-3 text-sm font-medium text-brand-teal-dark hover:underline disabled:cursor-wait disabled:opacity-70"
            >
              {resending
                ? "Resending…"
                : resent
                  ? "Resend again"
                  : "Didn't get it? Resend the email"}
            </button>
            {resent && (
              <p role="status" className="mt-2 text-sm text-brand-slate">
                {RESENT_NOTE}
              </p>
            )}

            <div className="mt-6 border-t border-brand-line pt-4">
              <button
                type="button"
                onClick={() => {
                  setView("form");
                  setMode("signin");
                  setError(null);
                  setResent(false);
                }}
                className="text-sm font-medium text-brand-navy hover:underline"
              >
                Back to sign in
              </button>
            </div>
          </section>
        ) : (
          <section className="border border-brand-line bg-white px-4 py-5 sm:px-7 sm:py-7">
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-brand-line bg-brand-ice p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`min-h-10 rounded-md text-sm font-semibold transition-colors ${
                  mode === "register"
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-brand-slate-light hover:text-brand-navy"
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`min-h-10 rounded-md text-sm font-semibold transition-colors ${
                  mode === "signin"
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-brand-slate-light hover:text-brand-navy"
                }`}
              >
                Sign in
              </button>
            </div>

            <h1 className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-slate-light">
              {mode === "register" ? "Research registration" : "Account sign in"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-brand-slate">
              {mode === "register"
                ? "Register for instant catalog access. Accounts are for qualified laboratory and institutional research use only."
                : "Sign in with your research account to continue to the catalog."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {mode === "register" && (
                <>
                  <TermsScrollBox />

                  <DualField
                    label="Name"
                    left={{
                      id: "firstName",
                      subLabel: "First",
                      type: "text",
                      autoComplete: "given-name",
                      value: firstName,
                      onChange: setFirstName,
                    }}
                    right={{
                      id: "lastName",
                      subLabel: "Last",
                      type: "text",
                      autoComplete: "family-name",
                      value: lastName,
                      onChange: setLastName,
                    }}
                    required
                  />
                  <SelectField
                    id="businessType"
                    label="Business type"
                    value={businessType}
                    onChange={(v) => setBusinessType(v as BusinessType | "")}
                    placeholder="Select Entity Classification"
                    options={BUSINESS_TYPES}
                    hint="Researcher if purchasing as a qualified individual professional."
                    required
                  />
                  <SelectField
                    id="industry"
                    label="Industry / research affiliation"
                    value={industry}
                    onChange={(v) => setIndustry(v as IndustryAffiliation | "")}
                    placeholder="--- Select Industry ---"
                    options={INDUSTRY_AFFILIATIONS}
                    required
                  />
                  <Field
                    id="website"
                    label="Business website"
                    type="url"
                    autoComplete="url"
                    placeholder="https://"
                    value={website}
                    onChange={setWebsite}
                  />
                  <Field
                    id="phone"
                    label="Phone number"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={setPhone}
                    required
                  />
                </>
              )}

              {mode === "register" ? (
                <>
                  <DualField
                    label="Email"
                    left={{
                      id: "email",
                      subLabel: "Email",
                      type: "email",
                      autoComplete: "email",
                      value: email,
                      onChange: setEmail,
                    }}
                    right={{
                      id: "confirmEmail",
                      subLabel: "Confirm Email",
                      type: "email",
                      autoComplete: "email",
                      value: confirmEmail,
                      onChange: setConfirmEmail,
                    }}
                    required
                  />
                  <DualField
                    label="Password"
                    left={{
                      id: "password",
                      subLabel: "Password",
                      type: "password",
                      autoComplete: "new-password",
                      value: password,
                      onChange: setPassword,
                    }}
                    right={{
                      id: "confirmPassword",
                      subLabel: "Confirm Password",
                      type: "password",
                      autoComplete: "new-password",
                      value: confirmPassword,
                      onChange: setConfirmPassword,
                    }}
                    required
                  />

                  <AcknowledgmentBlock
                    checked={ackAccepted}
                    onChange={(v) => {
                      setAckAccepted(v);
                      setAckTouched(true);
                    }}
                    showWarning={ackTouched && !ackAccepted}
                  />
                </>
              ) : (
                <>
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                  <Field
                    id="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={setPassword}
                    required
                  />
                  <p className="-mt-2 text-right">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-brand-navy hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </p>
                </>
              )}

              <Turnstile
                onToken={setCaptchaToken}
                resetKey={captchaResetKey}
              />

              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  <p>{error}</p>
                  {needsConfirmation && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="mt-1 font-medium underline disabled:cursor-wait disabled:opacity-70"
                    >
                      {resending
                        ? "Resending…"
                        : resent
                          ? "Resend again"
                          : "Resend confirmation email"}
                    </button>
                  )}
                  {needsConfirmation && resent && (
                    <p role="status" className="mt-1">
                      {RESENT_NOTE}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary mt-2 min-h-11 w-full disabled:cursor-wait disabled:opacity-70"
              >
                {submitting
                  ? "Continuing…"
                  : mode === "register"
                    ? "Register"
                    : "Sign in"}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-2 border-t border-brand-line pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="text-sm text-brand-slate-light">
                Trouble registering, or a question about an order?
              </p>
              <Link
                href="/contact"
                className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-brand-navy underline underline-offset-2 hover:text-brand-teal-dark"
              >
                Submit an enquiry →
              </Link>
            </div>
          </section>
        )}

        <footer className="mt-auto pt-8 text-center sm:pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-navy">
            For research use only
          </p>
          <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-brand-slate-light">
            Products are supplied for in vitro laboratory research. Not for
            human or veterinary use, food, or household use.
          </p>
          <p className="mt-4 text-[11px] uppercase tracking-wide text-brand-slate-light">
            © EcoPeps {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  );
}
