import type { Metadata } from "next";
import AccountEmptyState from "@/components/AccountEmptyState";

export const metadata: Metadata = { title: "Addresses" };

export default function AccountAddressesPage() {
  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-brand-navy">Addresses</h2>
      <AccountEmptyState title="No saved addresses">
        Saving shipping and billing addresses to your account isn&apos;t
        available yet.
      </AccountEmptyState>
    </>
  );
}
