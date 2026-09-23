"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import Turnstile from "@/components/Turnstile";
import { submitInquiry, type InquiryState } from "./actions";

const initialState: InquiryState = { status: "idle" };

export default function InquiryForm() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    orderNumber: "",
    message: "",
    agree: false,
  });

  const [state, formAction, pending] = useActionState(
    async (prev: InquiryState, formData: FormData) => {
      const result = await submitInquiry(prev, formData);
      // The Turnstile token was spent on that attempt; issue a new one so
      // a retry can pass the check.
      if (result.status === "error") setCaptchaResetKey((k) => k + 1);
      return result;
    },
    initialState
  );

  if (state.status === "sent") {
    return (
      <div className="card p-6 text-center sm:p-8">
        <h2 className="text-lg font-semibold text-brand-navy">
          Thanks — your inquiry is on its way
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-brand-slate">
          We&apos;ll reply to <strong>{values.email}</strong> within one
          business day.
        </p>
      </div>
    );
  }

  const set =
    (key: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form action={formAction} className="card space-y-5 p-6 sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="firstName" label="First name" required autoComplete="given-name" value={values.firstName} onChange={set("firstName")} />
        <TextField id="lastName" label="Last name" autoComplete="family-name" value={values.lastName} onChange={set("lastName")} />
      </div>
      <TextField id="email" label="Email" type="email" required autoComplete="email" value={values.email} onChange={set("email")} />
      <TextField id="subject" label="Subject" required value={values.subject} onChange={set("subject")} />
      <TextField id="orderNumber" label="Order number (if applicable)" value={values.orderNumber} onChange={set("orderNumber")} />

      <label className="block">
        <FieldLabel required>Your message</FieldLabel>
        <textarea
          name="message"
          required
          rows={6}
          maxLength={5000}
          value={values.message}
          onChange={set("message")}
          className="input resize-y"
        />
      </label>

      <fieldset>
        <FieldLabel required>By sending this inquiry</FieldLabel>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-brand-navy">
          <input
            type="checkbox"
            name="agree"
            checked={values.agree}
            onChange={(e) => setValues((v) => ({ ...v, agree: e.target.checked }))}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-line accent-brand-teal-dark"
          />
          <span>
            I agree to the{" "}
            <Link href="/legal/terms" className="underline">
              Terms of Sale
            </Link>{" "}
            and understand that all EcoPeps products are supplied strictly for
            in vitro laboratory research. I understand that requesting
            human-use guidance, dosing, or administration instructions will
            result in immediate and permanent account suspension.
          </span>
        </label>
      </fieldset>

      <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />
      <input type="hidden" name="turnstileToken" value={captchaToken ?? ""} />

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary min-h-11 w-full disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate-light">
      {children}
      {required && <span className="ml-0.5 text-red-700">*</span>}
    </span>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className="input min-h-11"
      />
    </label>
  );
}
