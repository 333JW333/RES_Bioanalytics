import type { Metadata } from "next";
import Link from "next/link";
import { getAccount } from "@/lib/account";

export const metadata: Metadata = { title: "Account Details" };

export default async function AccountDetailsPage() {
  const { email, profile } = await getAccount();
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");

  // Labels match the registration form, where these were entered.
  const rows = [
    { label: "Name", value: name },
    { label: "Email", value: email },
    { label: "Phone number", value: profile?.phone },
    { label: "Business website", value: profile?.website },
    { label: "Business type", value: profile?.business_type },
    // Businesses only; researchers registering as individuals have none.
    ...(profile?.ein ? [{ label: "EIN", value: profile.ein }] : []),
    { label: "Industry / research affiliation", value: profile?.industry },
  ];

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-brand-navy">Account Details</h2>
      <dl className="card divide-y divide-brand-line">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 px-5 py-3.5 sm:grid-cols-3 sm:gap-4">
            <dt className="text-xs font-medium text-brand-slate-light sm:text-sm">{row.label}</dt>
            <dd className="break-words text-sm text-brand-navy sm:col-span-2">
              {row.value || "—"}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link href="/forgot-password" className="btn-secondary text-sm">
          Change Password
        </Link>
        <p className="text-xs text-brand-slate-light">
          Need to change these details?{" "}
          <Link href="/contact" className="text-brand-teal-dark underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </>
  );
}
