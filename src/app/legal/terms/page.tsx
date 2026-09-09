import { Metadata } from "next";
import LegalNotice from "@/components/LegalNotice";

export const metadata: Metadata = {
  title: "Terms of Sale",
  description: "RES Bioanalytics Terms of Sale.",
};

export default function TermsPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">Terms of Sale</h1>
      <p className="text-sm text-brand-slate-light mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <LegalNotice />

      <div className="space-y-6 text-brand-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">1. Agreement to Terms</h2>
          <p>
            By accessing this website or purchasing from RES Bioanalytics,
            you agree to be bound by these Terms of Sale, our{" "}
            <a href="/legal/ruo-policy" className="text-brand-teal-dark underline">Research Use Only Policy</a>,
            and our{" "}
            <a href="/legal/privacy" className="text-brand-teal-dark underline">Privacy Policy</a>.
            If you do not agree, do not use this site or purchase our products.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">2. Eligibility</h2>
          <p>
            You must be at least 18 years old and purchasing on behalf of
            yourself, your laboratory, or your institution for lawful
            research purposes only.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">3. Product Descriptions</h2>
          <p>
            We strive to ensure product descriptions, purity data, and
            specifications are accurate. Research applications listed on
            product pages summarize published literature discussing a
            compound class and are provided for scientific context only —
            they are not performance, safety, or efficacy claims about our
            specific products.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">4. Pricing &amp; Payment</h2>
          <p>
            Prices are listed in U.S. Dollars and are subject to change
            without notice. We currently accept payment via cryptocurrency
            (processed by Coinbase Commerce) and ACH bank transfer
            (processed via Plaid and Dwolla). Additional payment methods,
            including credit card and PayPal, may be added in the future.
            Orders are not confirmed or shipped until payment has been
            received and, where applicable, settled.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">5. Cryptocurrency Payments</h2>
          <p>
            Cryptocurrency payments are final once confirmed on the
            applicable blockchain network. Due to the volatility of digital
            assets, the USD-equivalent price is locked at the time the
            invoice is generated; payments must be completed within the
            time window shown at checkout.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">6. ACH Bank Transfers</h2>
          <p>
            By initiating an ACH transfer you authorize RES Bioanalytics and
            our payment processors (Plaid and Dwolla) to debit the linked
            bank account for the order total. Returned or reversed
            transfers may result in order cancellation and additional fees.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">7. Research Use Only</h2>
          <p>
            All purchases are subject to our{" "}
            <a href="/legal/ruo-policy" className="text-brand-teal-dark underline">Research Use Only Policy</a>.
            Placing an order constitutes your certification that the
            products will be used solely for permitted research purposes.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">8. Limitation of Liability</h2>
          <p>
            Products are sold &ldquo;as is&rdquo; for research use only. To
            the maximum extent permitted by law, RES Bioanalytics disclaims
            all warranties, express or implied, and is not liable for any
            indirect, incidental, or consequential damages arising from use
            or misuse of our products, including any use inconsistent with
            our RUO Policy.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">9. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction in
            which RES Bioanalytics is incorporated, without regard to
            conflict-of-law principles.
          </p>
        </section>
      </div>
    </div>
  );
}
