import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Handling",
  description: "Shipping timelines, packaging, and handling information for EcoPeps research compounds.",
};

export default function ShippingPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-navy mb-6">Shipping &amp; Handling</h1>

      <div className="space-y-6 text-brand-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-brand-navy mb-2">Processing Time</h2>
          <p>
            Orders paid via cryptocurrency are typically processed and
            dispatched within 1 business day of payment confirmation. ACH
            orders ship once the bank transfer has fully settled, usually
            1-3 business days after checkout.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy mb-2">Packaging</h2>
          <p>
            Compounds are shipped in sealed vials or containers with lot
            numbers and labeling identifying them as for research use only.
            Temperature-sensitive items are packed with appropriate cold-chain
            materials when required.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy mb-2">Domestic &amp; International Shipping</h2>
          <p>
            We currently ship within the United States to verified
            laboratory and business addresses. International shipping to
            qualified institutions is evaluated on a case-by-case basis —
            contact us before ordering if you are located outside the U.S.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy mb-2">Tracking</h2>
          <p>
            A tracking number is emailed to the address provided at checkout
            once your order ships.
          </p>
        </section>
      </div>
    </div>
  );
}
