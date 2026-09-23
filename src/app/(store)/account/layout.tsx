import type { Metadata } from "next";
import AccountNav from "@/components/AccountNav";

// No title here: a layout title would stop the root "%s | EcoPeps"
// template from reaching the account pages' own titles.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-bold text-brand-navy mb-8">My Account</h1>
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
