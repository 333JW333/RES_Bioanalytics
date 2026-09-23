import type { Metadata } from "next";
import Link from "next/link";
import AccountEmptyState from "@/components/AccountEmptyState";

export const metadata: Metadata = { title: "Orders" };

export default function AccountOrdersPage() {
  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-brand-navy">Orders</h2>
      <AccountEmptyState
        title="No orders to show"
        actions={
          <>
            <Link href="/shop" className="btn-primary text-sm">Browse Catalog</Link>
            <Link href="/contact" className="btn-secondary text-sm">Contact Us</Link>
          </>
        }
      >
        Order history isn&apos;t available in your account yet. For an update on
        an order you&apos;ve placed, contact us with your order number.
      </AccountEmptyState>
    </>
  );
}
