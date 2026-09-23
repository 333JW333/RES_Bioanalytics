import type { Metadata } from "next";
import Link from "next/link";
import InquiryForm from "./InquiryForm";

export const metadata: Metadata = {
  title: "Submit an inquiry",
  description:
    "Questions about specifications, documentation, orders, bulk allocation, or the site — send the EcoPeps team an inquiry.",
};

export default function ContactPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-slate-light">
        Contact
      </p>
      <h1 className="mt-2 text-3xl font-bold text-brand-navy">
        Submit an inquiry
      </h1>
      <p className="mt-3 mb-8 leading-relaxed text-brand-slate">
        Questions about specifications, certificates of analysis, order
        status, bulk research allocation, or a technical issue with the site?
        Send us the details and we&apos;ll respond within one business day.
      </p>

      <InquiryForm />

      <div className="card mt-8 space-y-4 p-6">
        <ContactRow label="Email" value="support@ecopeps.com" />
        <ContactRow label="Hours" value="Mon–Fri, 9am–5pm ET" />
        <ContactRow label="Purpose" value="Laboratory & institutional research inquiries only" />
      </div>

      <p className="mt-6 text-xs text-brand-slate-light">
        EcoPeps does not provide medical, dosing, or health advice. For
        research-use inquiries only.
      </p>

      <p className="mt-6 text-sm text-brand-slate">
        Already have an account?{" "}
        <Link
          href="/register?mode=signin"
          className="font-semibold text-brand-navy underline underline-offset-2 hover:text-brand-teal-dark"
        >
          Sign in →
        </Link>
      </p>
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-brand-line pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-brand-slate-light">{label}</span>
      <span className="text-right text-sm font-medium text-brand-navy">{value}</span>
    </div>
  );
}
