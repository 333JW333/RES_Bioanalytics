"use client";

import { useActionState, useState, useTransition } from "react";
import { startTwoStepSetup, verifyTwoStep, type SetupResult, type VerifyState } from "./two-step-actions";

const idle: VerifyState = { status: "idle" };

export default function TwoStepForm({ mode, returnTo }: { mode: "setup" | "verify"; returnTo: string }) {
  const [setup, setSetup] = useState<SetupResult | null>(null);
  const [starting, startTransition] = useTransition();
  const [state, verify, verifying] = useActionState(verifyTwoStep, idle);
  const [code, setCode] = useState("");

  const ready = setup?.status === "ready" ? setup : null;
  const showCodeForm = mode === "verify" || ready;

  return (
    <section className="card mx-auto max-w-xl p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-brand-navy">
        {mode === "verify" ? "Enter your sign-in code" : "Set up two-step sign-in"}
      </h2>

      {mode === "verify" ? (
        <p className="mt-2 text-sm leading-relaxed text-brand-slate">
          The staff pages show customer information, so they ask for a second step each time you sign in. Open
          your authenticator app and enter the 6-digit code for EcoPeps.
        </p>
      ) : (
        <div className="mt-2 space-y-3 text-sm leading-relaxed text-brand-slate">
          <p>
            The staff pages show customer information, so they need a second step after your password: a 6-digit
            code from an authenticator app on your phone. You set this up once.
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Install an authenticator app if you don&apos;t have one: Google Authenticator, Microsoft
              Authenticator, 1Password or Authy.
            </li>
            <li>Click the button below, then scan the QR code with the app.</li>
            <li>Enter the 6-digit code the app shows.</li>
          </ol>
          {!ready && (
            <button
              type="button"
              disabled={starting}
              onClick={() => startTransition(async () => setSetup(await startTwoStepSetup()))}
              className="btn-primary text-sm disabled:opacity-60"
            >
              {starting ? "Setting up…" : "Set up two-step sign-in"}
            </button>
          )}
          {setup?.status === "error" && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {setup.message}
            </p>
          )}
        </div>
      )}

      {ready && (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border border-brand-line bg-white p-4 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL from Supabase */}
          <img src={ready.qrCode} alt="QR code to add EcoPeps to your authenticator app" className="h-44 w-44" />
          <div className="min-w-0 text-sm text-brand-slate">
            <p>Can&apos;t scan it? Add an account in the app by hand with this key:</p>
            <p className="mt-2 break-all rounded bg-brand-ice px-2 py-1.5 font-mono text-xs text-brand-navy">
              {ready.secret.replace(/(.{4})/g, "$1 ").trim()}
            </p>
            <p className="mt-2 text-xs text-brand-slate-light">
              Keep this key private. If you lose your phone, another staff member can reset your two-step sign-in
              in Supabase (README: Staff pages).
            </p>
          </div>
        </div>
      )}

      {showCodeForm && (
        <form action={verify} className="mt-5 space-y-3">
          <input type="hidden" name="returnTo" value={returnTo} />
          {ready && <input type="hidden" name="factorId" value={ready.factorId} />}
          <label className="block text-sm text-brand-navy">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate-light">
              6-digit code
            </span>
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input min-h-11 max-w-[12rem] font-mono text-lg tracking-[0.3em]"
            />
          </label>
          {state.status === "error" && !verifying && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {state.message}
            </p>
          )}
          <button type="submit" disabled={verifying} className="btn-primary text-sm disabled:opacity-60">
            {verifying ? "Checking…" : mode === "verify" ? "Continue" : "Finish setup"}
          </button>
        </form>
      )}
    </section>
  );
}
