import type { Metadata } from "next";
import Link from "next/link";
import AccountNav from "@/components/AccountNav";
import { getStaffUser } from "@/lib/staff";

// No title here: a layout title would stop the root "%s | EcoPeps"
// template from reaching the account pages' own titles.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  // Staff (STAFF_EMAILS) get a way into the staff pages.
  const staff = await getStaffUser();
  return (
    <div className="container-page py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-brand-navy">My Account</h1>
        {staff && (
          <Link href="/admin" className="btn-secondary text-sm">
            Staff tools
          </Link>
        )}
      </div>
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
