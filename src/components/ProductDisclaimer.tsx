export default function ProductDisclaimer() {
  return (
    <div className="rounded-xl border border-red-300 bg-white p-6 text-sm leading-relaxed text-brand-slate">
      <p className="mb-3 text-center font-semibold text-red-600">
        <span aria-hidden="true">⚠</span> Disclaimer
      </p>
      <p>
        <strong className="text-brand-navy">Research Use Only Disclaimer:</strong>{" "}
        Products from EcoPeps are strictly for laboratory and research use by
        qualified professionals. They are not pharmaceuticals, dietary
        supplements, agricultural products, or household items, and must not
        be mislabeled as such. These chemicals are not intended for human or
        veterinary use and are exempt from Title 21, Parts 100–740 of the
        CFR. The information provided is educational, not evaluated by the
        FDA, and is not intended to diagnose, treat, cure, or prevent any
        health condition.{" "}
        <strong className="text-brand-navy">
          Intellectual Property &amp; Patent Use Disclaimer:
        </strong>{" "}
        EcoPeps provides this product solely for uses that fall under
        exemptions to patent infringement as permitted by applicable law,
        including but not limited to 35 U.S.C. § 271(e)(1) in the United
        States. It is the sole responsibility of the purchaser or user to
        ensure that their use of this product complies with all applicable
        intellectual property laws and exemptions. By purchasing this
        product, the buyer agrees to use it only within the scope of those
        exemptions and to indemnify and hold harmless EcoPeps from any
        claims arising from its use, including any alleged intellectual
        property infringement.
      </p>
    </div>
  );
}
