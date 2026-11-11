import type { Metadata } from "next";
import { getAccount } from "@/lib/account";
import AccountDetailsForms from "./AccountDetailsForms";

export const metadata: Metadata = { title: "Account Details" };

// Set by /auth/confirm after an email-change link (src/app/(gate)/auth/confirm/actions.ts).
const EMAIL_NOTICES: Record<string, string> = {
  changed: "Your email address is updated. Sign in with the new address from now on.",
  pending:
    "Thanks, that link is confirmed. If we also emailed your other address, click the link there too; your email changes once both are confirmed.",
  expired: "That email-change link has expired or was already used. You can request a new one below.",
};

export default async function AccountDetailsPage(props: PageProps<"/account/details">) {
  const { email: emailNotice } = await props.searchParams;
  const { email, profile } = await getAccount();
  const notice = typeof emailNotice === "string" ? EMAIL_NOTICES[emailNotice] : undefined;

  return (
    <>
      <h2 className="mb-1 text-xl font-semibold text-brand-navy">Account Details</h2>
      <p className="mb-5 text-sm text-brand-slate">Keep your details up to date. Changes save right away.</p>
      {notice && (
        <p role="status" className="mb-5 rounded-md border border-brand-teal/30 bg-brand-teal/10 px-3 py-2 text-sm text-brand-teal-dark">
          {notice}
        </p>
      )}
      <AccountDetailsForms
        email={email ?? ""}
        details={{
          firstName: profile?.first_name ?? "",
          lastName: profile?.last_name ?? "",
          phone: profile?.phone ?? "",
          website: profile?.website ?? "",
          businessType: profile?.business_type ?? "",
          industry: profile?.industry ?? "",
          ein: profile?.ein ?? "",
        }}
      />
    </>
  );
}
