import { Metadata } from "next";
import LegalNotice from "@/components/LegalNotice";

export const metadata: Metadata = {
  title: "Research Use Only Policy",
  description: "EcoPeps Research Use Only (RUO) Policy.",
};

export default function RuoPolicyPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">Research Use Only (RUO) Policy</h1>
      <p className="text-sm text-brand-slate-light mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <LegalNotice />

      <div className="prose-legal space-y-6 text-brand-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">1. Scope</h2>
          <p>
            This Research Use Only (&ldquo;RUO&rdquo;) Policy governs all
            products sold by EcoPeps (&ldquo;EcoPeps,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us&rdquo;). It applies to every visitor
            and customer of this website.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">2. Intended Use</h2>
          <p>
            All peptides, compounds, and reagents offered by EcoPeps
            are sold strictly for in-vitro laboratory research,
            analytical testing, and other non-clinical research purposes by
            qualified researchers, laboratories, and institutions. Products
            are not intended for, and may not be used for, any of the
            following:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Human consumption, ingestion, injection, or application of any kind</li>
            <li>Animal consumption or veterinary use</li>
            <li>Diagnostic, therapeutic, or clinical use</li>
            <li>Use as a food, dietary supplement, cosmetic, or drug ingredient</li>
            <li>Compounding into any product intended for human or animal use</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">3. Regulatory Status</h2>
          <p>
            Products sold on this site have not been evaluated or approved
            by the U.S. Food and Drug Administration (FDA) or any other
            regulatory authority for human or animal use. They are not
            intended to diagnose, treat, cure, or prevent any disease or
            condition.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">4. Customer Certification</h2>
          <p>
            By creating an account, placing an order, or otherwise
            purchasing from EcoPeps, you represent and warrant
            that:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>You are at least 18 years of age and legally capable of entering into a binding contract;</li>
            <li>You are purchasing solely for lawful laboratory, analytical, or research purposes;</li>
            <li>You will not resell, distribute, or transfer these products for human or animal use;</li>
            <li>You will comply with all applicable local, state, federal, and international laws and regulations governing the purchase, possession, and use of research chemicals in your jurisdiction; and</li>
            <li>You possess the appropriate training, facilities, and qualifications to safely handle laboratory chemicals.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">5. Enforcement</h2>
          <p>
            EcoPeps reserves the right to refuse service, cancel
            orders, or terminate accounts at our sole discretion, including
            where we have reason to believe a product will be used contrary
            to this policy.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">6. Contact</h2>
          <p>Questions about this policy can be directed to support@ecopeps.com.</p>
        </section>
      </div>
    </div>
  );
}
