"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import type { DetailsErrors, DetailsInput } from "@/lib/account-details";
import { BUSINESS_TYPES, INDUSTRY_AFFILIATIONS } from "@/lib/gate";
import { changeEmail, changePassword, updateDetails, type FormState } from "./actions";

const idle: FormState = { status: "idle" };

const LABEL = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-slate-light";
const SELECT_ARROW =
  "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2364748b%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.6rem_center] bg-no-repeat pr-10";

export default function AccountDetailsForms({ email, details }: { email: string; details: DetailsInput }) {
  return (
    <div className="space-y-6">
      <DetailsForm initial={details} />
      <EmailForm email={email} />
      <PasswordForm />
    </div>
  );
}

function DetailsForm({ initial }: { initial: DetailsInput }) {
  const [values, setValues] = useState(initial);
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await updateDetails(prev, formData);
    if (result.status === "done" && result.saved) setValues(result.saved);
    return result;
  }, idle);
  const errors: DetailsErrors = state.status === "error" ? (state.errors ?? {}) : {};
  const set = (key: keyof DetailsInput) => (v: string) => setValues((s) => ({ ...s, [key]: v }));
  const isBusiness = values.businessType === BUSINESS_TYPES[0];

  return (
    <form
      // Submitted by hand, not through the form's action: a form action resets
      // the form afterwards, and the dropdowns would show their old values.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      noValidate
      className="card space-y-5 p-5 sm:p-6"
    >
      <h3 className="font-semibold text-brand-navy">Your details</h3>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput id="firstName" label="First name" autoComplete="given-name" required value={values.firstName} onChange={set("firstName")} error={errors.firstName} />
        <TextInput id="lastName" label="Last name" autoComplete="family-name" required value={values.lastName} onChange={set("lastName")} error={errors.lastName} />
        <TextInput id="phone" label="Phone number" type="tel" autoComplete="tel" required value={values.phone} onChange={set("phone")} error={errors.phone} />
        <TextInput id="website" label="Business website" type="url" autoComplete="url" placeholder="example.com" value={values.website} onChange={set("website")} error={errors.website} />
        <SelectInput id="businessType" label="Business type" required options={BUSINESS_TYPES} value={values.businessType} onChange={set("businessType")} error={errors.businessType} />
        <SelectInput id="industry" label="Industry / research affiliation" required options={INDUSTRY_AFFILIATIONS} value={values.industry} onChange={set("industry")} error={errors.industry} />
        <TextInput
          id="ein"
          label="EIN (Employer Identification Number)"
          placeholder="12-3456789"
          inputMode="numeric"
          value={values.ein}
          onChange={set("ein")}
          error={errors.ein}
          hint={
            isBusiness
              ? "Business and institution accounts with an EIN on file can request Net 30 invoices at checkout."
              : "Optional. Net 30 invoices are for business and institution accounts with an EIN."
          }
        />
      </div>
      <FormFooter state={state} pending={pending} label="Save changes" pendingLabel="Saving…" />
    </form>
  );
}

function EmailForm({ email }: { email: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await changeEmail(prev, formData);
    if (result.status === "done") setNewEmail("");
    return result;
  }, idle);

  return (
    <form action={action} noValidate className="card space-y-5 p-5 sm:p-6">
      <div>
        <h3 className="font-semibold text-brand-navy">Email address</h3>
        <p className="mt-1 text-sm text-brand-slate">
          You sign in with <strong className="break-all text-brand-navy">{email}</strong>. Order emails go here too.
        </p>
      </div>
      <TextInput
        id="newEmail"
        label="New email address"
        type="email"
        autoComplete="email"
        required
        value={newEmail}
        onChange={setNewEmail}
        hint="We'll email a link to confirm the change. Your email address doesn't change until you click it."
      />
      <FormFooter state={state} pending={pending} label="Send confirmation link" pendingLabel="Sending…" />
    </form>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await changePassword(prev, formData);
    if (result.status === "done") {
      setPassword("");
      setConfirm("");
    }
    return result;
  }, idle);

  return (
    <form action={action} noValidate className="card space-y-5 p-5 sm:p-6">
      <h3 className="font-semibold text-brand-navy">Password</h3>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput id="newPassword" label="New password" type="password" autoComplete="new-password" required value={password} onChange={setPassword} hint="At least 8 characters." />
        <TextInput id="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" required value={confirm} onChange={setConfirm} />
      </div>
      <FormFooter state={state} pending={pending} label="Change password" pendingLabel="Changing…">
        <p className="text-xs text-brand-slate-light">
          Forgot your current password?{" "}
          <Link href="/forgot-password" className="text-brand-teal-dark underline">
            Reset it by email
          </Link>
          .
        </p>
      </FormFooter>
    </form>
  );
}

function FormFooter({
  state,
  pending,
  label,
  pendingLabel,
  children,
}: {
  state: FormState;
  pending: boolean;
  label: string;
  pendingLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {state.status !== "idle" && !pending && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-md border px-3 py-2 text-sm ${
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-brand-teal/30 bg-brand-teal/10 text-brand-teal-dark"
          }`}
        >
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button type="submit" disabled={pending} className="btn-primary text-sm disabled:opacity-60">
          {pending ? pendingLabel : label}
        </button>
        {children}
      </div>
    </div>
  );
}

function TextInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  inputMode,
  required,
  error,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: "numeric" | "email" | "tel" | "url";
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <label className="block text-sm text-brand-navy">
      <span className={LABEL}>
        {label}
        {required ? <span className="ml-0.5 text-red-600" aria-hidden>*</span> : null}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`input min-h-11 ${error ? "!border-red-400" : ""}`}
      />
      <Help id={id} error={error} hint={hint} />
    </label>
  );
}

function SelectInput({
  id,
  label,
  value,
  onChange,
  options,
  required,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block text-sm text-brand-navy">
      <span className={LABEL}>
        {label}
        {required ? <span className="ml-0.5 text-red-600" aria-hidden>*</span> : null}
      </span>
      <select
        id={id}
        name={id}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input min-h-11 ${SELECT_ARROW} ${error ? "!border-red-400" : ""}`}
      >
        <option value="" disabled>
          Choose one
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <Help id={id} error={error} />
    </label>
  );
}

function Help({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <span id={`${id}-error`} className="mt-1.5 block text-xs text-red-700">
        {error}
      </span>
    );
  }
  return hint ? (
    <span id={`${id}-hint`} className="mt-1.5 block text-xs leading-relaxed text-brand-slate-light">
      {hint}
    </span>
  ) : null;
}
