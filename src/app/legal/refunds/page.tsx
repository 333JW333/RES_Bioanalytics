import { Metadata } from "next";
import LegalNotice from "@/components/LegalNotice";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "RES Bioanalytics Refund Policy.",
};

export default function RefundsPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">Refund Policy</h1>
      <p className="text-sm text-brand-slate-light mb-8">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <LegalNotice />

      <div className="space-y-6 text-brand-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">1. Damaged or Incorrect Orders</h2>
          <p>
            If your order arrives damaged, incorrect, or fails to meet the
            purity/identity specifications on its certificate of analysis,
            contact us within 7 days of delivery at
            support@resbioanalytics.com with your order number and photos
            of the issue. We will replace the item or issue a refund at our
            discretion.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">2. Non-Returnable Items</h2>
          <p>
            For safety and quality-control reasons, opened or reconstituted
            research chemicals cannot be returned. Unopened, sealed items
            may be eligible for return within 14 days of delivery, subject
            to a restocking evaluation.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">3. Cryptocurrency Refunds</h2>
          <p>
            Approved refunds for cryptocurrency payments are issued in the
            equivalent USD value at the time of the original transaction,
            sent to a wallet address you provide, less any network fees.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">4. ACH Refunds</h2>
          <p>
            Approved refunds for ACH payments are returned to the original
            linked bank account via Dwolla and may take 1-3 business days
            to appear.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">5. Contact</h2>
          <p>To request a refund or replacement, email support@resbioanalytics.com with your order number.</p>
        </section>
      </div>
    </div>
  );
}
