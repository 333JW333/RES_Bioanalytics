import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/data/products";
import { isSoldOut } from "@/lib/pricing";
import { ShieldCheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Quality & Certificates of Analysis",
  description: "Learn about our batch testing process and view each product's certificates of analysis (COAs).",
};

export default function QualityPage() {
  const products = getAllProducts();

  return (
    <div className="container-page py-16">
      <div className="max-w-3xl mb-12">
        <h1 className="text-3xl font-bold text-brand-navy mb-5">Quality &amp; Certificates of Analysis</h1>
        <p className="text-brand-slate leading-relaxed mb-4">
          Every production batch is independently tested by HPLC and mass
          spectrometry to confirm identity and purity before release. Each
          batch&apos;s certificate of analysis (COA) is posted on its product
          page and linked from the QR code on every vial.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-brand-slate">
          <li>Raw material sourcing and identity verification</li>
          <li>Synthesis and lyophilization under controlled conditions</li>
          <li>Third-party HPLC purity analysis (≥98–99%, compound dependent)</li>
          <li>Mass spectrometry confirmation of molecular identity</li>
          <li>Batch-specific COA issued prior to release for sale</li>
        </ol>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.slug}#documents`}
            className="card flex items-center justify-between p-5 transition-shadow hover:shadow-lg"
          >
            <div>
              <p className="font-semibold text-brand-navy">{product.name}</p>
              <p className="text-xs text-brand-slate-light">{product.purity}</p>
            </div>
            {isSoldOut(product) ? (
              <span className="text-xs font-medium text-brand-slate-light">Coming soon</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-teal-dark">
                <ShieldCheckIcon className="h-4 w-4" />
                View COAs
              </span>
            )}
          </Link>
        ))}
      </div>
      <p className="text-xs text-brand-slate-light mt-6">
        Each in-stock product page lists the certificates of analysis for its
        current batch, and every vial&apos;s QR code opens its own batch&apos;s COAs.
      </p>
    </div>
  );
}
