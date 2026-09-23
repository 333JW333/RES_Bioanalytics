import type { Metadata } from "next";
import Link from "next/link";
import { getAccount } from "@/lib/account";
import { ACCOUNT_LINKS } from "@/lib/account-nav";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountDashboardPage() {
  const { email, profile } = await getAccount();
  const sections = ACCOUNT_LINKS.filter((link) => link.href !== "/account");

  return (
    <>
      <h2 className="text-xl font-semibold text-brand-navy">
        {profile?.first_name ? `Welcome back, ${profile.first_name}` : "Welcome back"}
      </h2>
      {email && (
        <p className="mt-1 text-sm text-brand-slate-light">Signed in as {email}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="card p-5 transition-colors hover:border-brand-teal"
          >
            <p className="font-semibold text-brand-navy">{section.label}</p>
            <p className="mt-1 text-xs text-brand-slate-light">{section.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
