"use client";

import Link from "next/link";
import { REGISTRATION_TERMS } from "@/lib/registration-terms";

export function RequiredMark() {
  return (
    <span className="ml-0.5 text-red-600" aria-hidden>
      *
    </span>
  );
}

export function AcknowledgmentBlock({
  checked,
  onChange,
  showWarning,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  showWarning: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate-light">
        Acknowledgment &amp; research use certification
        <RequiredMark />
      </p>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-brand-navy">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-line accent-teal-600"
          required
        />
        <span>
          I certify that all information provided is accurate, that I am 21
          years of age or older, and that I am a qualified professional. I
          acknowledge that products are sold strictly for in-vitro laboratory
          research and are not for human consumption or clinical use. I
          understand that misuse constitutes a material breach of terms
          resulting in account termination. I agree to indemnify EcoPeps and
          accept the{" "}
          <Link
            href="/legal/terms"
            className="font-semibold text-brand-teal-dark underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full Terms &amp; Conditions
          </Link>
          .
        </span>
      </label>
      {showWarning ? (
        <div className="space-y-1.5" role="alert">
          <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <span aria-hidden>⚠</span>
            Must confirm to proceed with registration.
          </p>
          <p className="flex items-center gap-2 text-sm text-red-600">
            <span aria-hidden>⚠</span>
            This field is required.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function TermsScrollBox() {
  return (
    <div className="overflow-hidden rounded-lg border border-brand-line bg-[#f8fafb]">
      <div className="border-b border-brand-line px-3.5 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate-light">
          Terms of Service Agreement
          <RequiredMark />
        </p>
      </div>
      <div className="h-40 overflow-y-auto px-3.5 py-3 text-xs leading-relaxed text-brand-slate sm:h-48">
        <p className="mb-3 font-semibold text-brand-navy">
          Terms of Service Agreement
        </p>
        <div className="space-y-3">
          {REGISTRATION_TERMS.map((section) => (
            <div key={section.title}>
              <p className="font-semibold text-brand-navy">{section.title}</p>
              <p className="mt-1">{section.body}</p>
              {"bullets" in section && section.bullets ? (
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-brand-navy">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate-light">
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input min-h-11"
      />
    </label>
  );
}

export function DualField({
  label,
  left,
  right,
  required,
}: {
  label: string;
  left: {
    id: string;
    subLabel: string;
    type?: string;
    autoComplete?: string;
    value: string;
    onChange: (v: string) => void;
  };
  right: {
    id: string;
    subLabel: string;
    type?: string;
    autoComplete?: string;
    value: string;
    onChange: (v: string) => void;
  };
  required?: boolean;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate-light">
        {label}
        {required ? <RequiredMark /> : null}
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="min-w-0 block text-sm text-brand-navy">
          <input
            id={left.id}
            name={left.id}
            type={left.type ?? "text"}
            autoComplete={left.autoComplete}
            required={required}
            value={left.value}
            onChange={(e) => left.onChange(e.target.value)}
            className="input min-h-11"
          />
          <span className="mt-1.5 block text-[10px] font-medium uppercase tracking-[0.1em] text-brand-slate-light">
            {left.subLabel}
          </span>
        </label>
        <label className="min-w-0 block text-sm text-brand-navy">
          <input
            id={right.id}
            name={right.id}
            type={right.type ?? "text"}
            autoComplete={right.autoComplete}
            required={required}
            value={right.value}
            onChange={(e) => right.onChange(e.target.value)}
            className="input min-h-11"
          />
          <span className="mt-1.5 block text-[10px] font-medium uppercase tracking-[0.1em] text-brand-slate-light">
            {right.subLabel}
          </span>
        </label>
      </div>
    </fieldset>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm text-brand-navy">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate-light">
        {label}
        {required ? <RequiredMark /> : null}
      </span>
      <select
        id={id}
        name={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input min-h-11 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2364748b%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.6rem_center] bg-no-repeat pr-10"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {hint ? (
        <span className="mt-1.5 block text-xs leading-relaxed text-brand-slate-light">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
