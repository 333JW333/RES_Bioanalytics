"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CoaTestingPanel from "@/components/CoaTestingPanel";
import { LogoMark } from "@/components/icons";
import { writeAgeVerified } from "@/lib/gate";

export default function EnterClient() {
  const router = useRouter();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [ruoConfirmed, setRuoConfirmed] = useState(false);

  const canContinue = ageConfirmed && ruoConfirmed;

  function handleContinue() {
    if (!canContinue) return;
    writeAgeVerified();
    router.push("/register");
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
            Research Peptides
          </p>
        </header>

        <CoaTestingPanel />

        <section className="border border-t-0 border-brand-line bg-white px-4 py-5 sm:px-7 sm:py-7">
          <h1 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-slate-light">
            Research access
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-brand-slate">
            Confirm you are 21+ and purchasing for laboratory research use only
            to continue to registration.
          </p>

          <div className="mt-5 space-y-1 sm:mt-6 sm:space-y-2">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-1 py-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-line accent-teal-600"
              />
              <span>I confirm that I am at least 21 years of age.</span>
            </label>

            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-1 py-2 text-sm text-brand-navy">
              <input
                type="checkbox"
                checked={ruoConfirmed}
                onChange={(e) => setRuoConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-line accent-teal-600"
              />
              <span>
                I understand these products are for{" "}
                <strong>research use only</strong> — not for human or animal
                consumption, diagnostic use, or clinical application. I agree to
                the{" "}
                <Link
                  href="/legal/ruo-policy"
                  className="text-brand-teal-dark underline underline-offset-2"
                >
                  RUO Policy
                </Link>
                .
              </span>
            </label>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="btn-primary mt-3 min-h-11 w-full disabled:cursor-not-allowed disabled:bg-brand-line disabled:text-brand-slate-light disabled:opacity-100"
            >
              Continue to registration
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-brand-slate-light">
            Already registered?{" "}
            <Link
              href="/register?mode=signin"
              className="font-medium text-brand-teal-dark hover:underline"
            >
              Sign in
            </Link>
          </p>
        </section>

        <footer className="mt-auto pt-8 text-center sm:pt-10">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-navy">
            For research use only
          </p>
          <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-brand-slate-light">
            Products are supplied for in vitro laboratory research. Not for
            human or veterinary use, food, or household use.
          </p>
          <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-brand-slate-light">
            <Link
              href="/quality"
              className="font-medium text-brand-teal-dark hover:underline"
            >
              Quality &amp; COAs
            </Link>
            <span className="text-brand-line" aria-hidden>
              ·
            </span>
            <Link href="/about" className="hover:text-brand-navy">
              About
            </Link>
            <span className="text-brand-line" aria-hidden>
              ·
            </span>
            <Link href="/contact" className="hover:text-brand-navy">
              Contact
            </Link>
          </nav>
        </footer>
      </main>
    </div>
  );
}
