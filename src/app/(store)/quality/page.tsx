import { Metadata } from "next";
import { getAllProducts } from "@/data/products";
import { ShieldCheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Quality & Certificates of Analysis",
  description: "Learn about our batch testing process and access sample certificates of analysis (COAs).",
};

export default function QualityPage() {
  const products = getAllProducts();

  return (
    <div className="container-page py-16">
      <div className="max-w-3xl mb-12">
        <span className="badge-ruo mb-4">Research Use Only</span>
        <h1 className="text-3xl font-bold text-brand-navy mb-5">Quality &amp; Certificates of Analysis</h1>
        <p className="text-brand-slate leading-relaxed mb-4">
          Every production lot is independently tested by HPLC and mass
          spectrometry to confirm identity and purity before release. A
          certificate of analysis (COA) is generated for each lot and made
          available with your order.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-brand-slate">
          <li>Raw material sourcing and identity verification</li>
          <li>Synthesis and lyophilization under controlled conditions</li>
          <li>Third-party HPLC purity analysis (≥98–99%, compound dependent)</li>
          <li>Mass spectrometry confirmation of molecular identity</li>
          <li>Lot-specific COA issued prior to release for sale</li>
        </ol>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="card flex items-center justify-between p-5">
            <div>
              <p className="font-semibold text-brand-navy">{product.name}</p>
              <p className="text-xs text-brand-slate-light">{product.purity}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-teal-dark">
              <ShieldCheckIcon className="h-4 w-4" />
              COA on request
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-brand-slate-light mt-6">
        Lot-specific COAs are issued with each shipment. Contact us if you
        need a COA for a product before purchasing.
      </p>
    </div>
  );
}
