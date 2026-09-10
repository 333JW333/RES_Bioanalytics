"use client";

import { useEffect, useState } from "react";
import { ShieldCheckIcon } from "@/components/icons";

const CONSENT_KEY = "ecopeps-ruo-consent";

export default function RuoGateModal() {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // One-time check on mount (SSR-safe: window is unavailable server-side).
    try {
      const consent = window.localStorage.getItem(CONSENT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (consent !== "true") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function handleEnter() {
    if (!checked) return;
    try {
      window.localStorage.setItem(CONSENT_KEY, "true");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ruo-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/80 backdrop-blur-sm px-4"
    >
      <div className="card max-w-lg w-full p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal-dark">
            <ShieldCheckIcon className="h-5 w-5" />
          </span>
          <h2 id="ruo-gate-title" className="text-lg font-semibold text-brand-navy">
            Research Use Only — Please Confirm
          </h2>
        </div>
        <p className="text-sm text-brand-slate leading-relaxed mb-4">
          EcoPeps supplies laboratory reagents and reference compounds
          exclusively for in-vitro research, analytical testing, and
          non-clinical laboratory use by qualified professionals and
          institutions. Products sold on this site are{" "}
          <strong>not drugs, dietary supplements, cosmetics, or food</strong>{" "}
          and are <strong>not intended for human or animal consumption</strong>,
          diagnostic use, or any in-vivo clinical application in humans.
        </p>
        <label className="flex items-start gap-3 text-sm text-brand-navy mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-brand-line accent-teal-600"
          />
          <span>
            I am at least 18 years old, I am purchasing solely for laboratory
            or research purposes, and I have read and agree to the{" "}
            <a href="/legal/ruo-policy" className="text-brand-teal-dark underline underline-offset-2">
              Research Use Only Policy
            </a>{" "}
            and{" "}
            <a href="/legal/terms" className="text-brand-teal-dark underline underline-offset-2">
              Terms of Sale
            </a>
            .
          </span>
        </label>
        <button
          type="button"
          onClick={handleEnter}
          disabled={!checked}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enter Site
        </button>
      </div>
    </div>
  );
}
