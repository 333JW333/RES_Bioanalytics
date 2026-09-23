import type { Metadata } from "next";
import Link from "next/link";
import AccountEmptyState from "@/components/AccountEmptyState";

export const metadata: Metadata = { title: "Coupons" };

export default function AccountCouponsPage() {
  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-brand-navy">Coupons</h2>
      <AccountEmptyState
        title="No coupons"
        actions={<Link href="/shop" className="btn-primary text-sm">Browse Catalog</Link>}
      >
        You don&apos;t have any coupons on your account.
      </AccountEmptyState>
    </>
  );
}
