import type { Metadata } from "next";
import Link from "next/link";
import AccountEmptyState from "@/components/AccountEmptyState";

export const metadata: Metadata = { title: "My COAs" };

export default function AccountCoasPage() {
  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-brand-navy">My COAs</h2>
      <AccountEmptyState
        title="No COAs to show"
        actions={
          <>
            <Link href="/quality" className="btn-secondary text-sm">Quality &amp; COAs</Link>
            <Link href="/contact" className="btn-secondary text-sm">Contact Us</Link>
          </>
        }
      >
        Each batch&apos;s certificates of analysis are posted on its product
        page and linked from the QR code on every vial. If you need a copy for
        a batch you&apos;ve received, contact us with your order number.
      </AccountEmptyState>
    </>
  );
}
