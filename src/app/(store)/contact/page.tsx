import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the EcoPeps team.",
};

export default function ContactPage() {
  return (
    <div className="container-page py-16 max-w-xl">
      <h1 className="text-3xl font-bold text-brand-navy mb-4">Contact Us</h1>
      <p className="text-brand-slate leading-relaxed mb-8">
        Have a question about an order, a certificate of analysis, or bulk
        research pricing? Reach out and our team will respond within one
        business day.
      </p>

      <div className="card p-6 space-y-4">
        <ContactRow label="Email" value="support@ecopeps.com" />
        <ContactRow label="Hours" value="Mon–Fri, 9am–5pm ET" />
        <ContactRow label="Purpose" value="Laboratory & institutional research inquiries only" />
      </div>

      <p className="text-xs text-brand-slate-light mt-6">
        EcoPeps does not provide medical, dosing, or health advice.
        For research-use inquiries only.
      </p>
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-line pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-brand-slate-light">{label}</span>
      <span className="text-sm font-medium text-brand-navy">{value}</span>
    </div>
  );
}
