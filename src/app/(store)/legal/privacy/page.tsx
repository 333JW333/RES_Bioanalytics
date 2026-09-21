import { Metadata } from "next";
import LegalNotice from "@/components/LegalNotice";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "EcoPeps Privacy Policy.",
};

export default function PrivacyPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">Privacy Policy</h1>
      <p className="text-sm text-brand-slate-light mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <LegalNotice />

      <div className="space-y-6 text-brand-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">1. Information We Collect</h2>
          <p>
            When you place an order or contact us, we may collect your
            name, email address, shipping address, and order details. When
            you pay by ACH, our payment partners Plaid and Dwolla collect
            and process bank account information directly; we receive only
            a tokenized reference, not your raw banking credentials. When
            you pay by cryptocurrency, Coinbase Commerce processes the
            transaction and shares limited order and payment status
            information with us.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">2. How We Use Information</h2>
          <p>
            We use your information to process and fulfill orders, provide
            customer support, comply with legal and regulatory obligations,
            and communicate with you about your order.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">3. Sharing of Information</h2>
          <p>
            We share information with payment processors (Coinbase
            Commerce, Plaid, Dwolla) solely to complete transactions, and
            with shipping carriers to fulfill orders. We do not sell your
            personal information to third parties.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">4. Data Retention</h2>
          <p>
            We retain order and transaction records as required for
            accounting, tax, and regulatory compliance purposes.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">5. Your Choices</h2>
          <p>
            You may contact us at support@ecopeps.com to request
            access to, correction of, or deletion of your personal
            information, subject to our legal recordkeeping obligations.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">6. Cookies &amp; Local Storage</h2>
          <p>
            We use browser local storage to remember your shopping cart and
            RUO policy acknowledgment. This data stays on your device and is
            not transmitted to our servers.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">7. Contact</h2>
          <p>Questions about this policy can be directed to support@ecopeps.com.</p>
        </section>
      </div>
    </div>
  );
}
