import type { Metadata } from "next";
import TermsBody from "@/components/TermsBody";
import { TERMS_LAST_UPDATED, TERMS_OF_SERVICE } from "@/lib/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "EcoPeps Terms of Service.",
};

export default function TermsPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">Terms of Service</h1>
      <p className="text-sm text-brand-slate-light mb-8">Last updated: {TERMS_LAST_UPDATED}</p>

      <div className="space-y-6 text-brand-slate leading-relaxed">
        {TERMS_OF_SERVICE.map((section, i) => (
          <section key={section.title}>
            <h2 className="font-semibold text-brand-navy text-lg mb-2">
              {i + 1}. {section.title}
            </h2>
            <p>
              <TermsBody body={section.body} linkClassName="text-brand-teal-dark underline" />
            </p>
            {section.bullets ? (
              <ul className="list-disc list-inside mt-2 space-y-1">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
