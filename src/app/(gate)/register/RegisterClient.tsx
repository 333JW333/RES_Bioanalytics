"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LogoMark } from "@/components/icons";
import {
  BUSINESS_TYPES,
  INDUSTRY_AFFILIATIONS,
  readAgeVerified,
  readAccount,
  writeAccount,
  type BusinessType,
  type GateAccount,
  type IndustryAffiliation,
} from "@/lib/gate";
import {
  AcknowledgmentBlock,
  TermsScrollBox,
  Field,
  DualField,
  SelectField,
} from "./RegisterFormParts";


type Mode = "register" | "signin";

export default function RegisterClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(() =>
    readAccount()?.email ? "signin" : "register"
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(() => readAccount()?.email ?? "");
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

  function finish(account: GateAccount) {
    writeAccount(account);
    router.push("/shop");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

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
      setSubmitting(true);
      finish({
        name: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: trimmedEmail,
        institution: "",
        businessType,
        industry,
        website: website.trim(),
        phone: phone.trim(),
      });
      return;
    }

    const existing = readAccount();
    if (existing && existing.email !== trimmedEmail) {
      setError(
        "No account found for that email on this device. Create one instead."
      );
      return;
    }
    setSubmitting(true);
    finish(
      existing ?? {
        name: trimmedEmail.split("@")[0] ?? "Researcher",
        firstName: "",
        lastName: "",
        email: trimmedEmail,
        institution: "Research laboratory",
        businessType: "",
        industry: "",
        website: "",
        phone: "",
      }
    );
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
              </>
            )}

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
