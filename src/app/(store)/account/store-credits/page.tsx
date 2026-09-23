import type { Metadata } from "next";
import AccountEmptyState from "@/components/AccountEmptyState";
import { formatUSD } from "@/lib/format";

export const metadata: Metadata = { title: "Store Credits" };

export default function AccountStoreCreditsPage() {
  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-brand-navy">Store Credits</h2>
      <AccountEmptyState title="No store credit">
        Your store credit balance is {formatUSD(0)}.
      </AccountEmptyState>
    </>
  );
}
