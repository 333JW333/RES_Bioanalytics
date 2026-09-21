import { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "Quality & Testing",
  description:
    "How EcoPeps tests each research peptide lot — HPLC/MS identity and purity, lot release, and public COA access.",
};

export default function QualityPage() {
  const products = getAllProducts();

  return (
    <div className="container-page py-16">
      <div className="mb-12 max-w-3xl">
        <span className="badge-ruo mb-4">Research Use Only</span>
        <h1 className="mb-5 text-3xl font-bold text-brand-navy">Quality &amp; testing</h1>
        <p className="mb-4 leading-relaxed text-brand-slate">
          Every production lot is independently tested by HPLC and mass
          spectrometry to confirm identity and purity before release. Lot
          records and certificates of analysis are published in the{" "}
          <Link href="/certificates" className="font-medium text-brand-blue hover:underline">
            Verify a Lot
          </Link>{" "}
          library — searchable without an account.
        </p>
        <ol className="list-inside list-decimal space-y-2 text-sm text-brand-slate">
          <li>Raw material sourcing and identity verification</li>
          <li>Synthesis and lyophilization under controlled conditions</li>
          <li>Third-party HPLC purity analysis (≥98–99%, compound dependent)</li>
          <li>Mass spectrometry confirmation of molecular identity</li>
          <li>Lot-specific COA issued prior to release for sale</li>
        </ol>
        <div className="mt-8">
          <Link href="/certificates" className="btn-primary">
            Open COA library
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-brand-line">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-brand-navy text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Compound</th>
              <th className="px-4 py-3 font-semibold">Stated purity</th>
              <th className="px-4 py-3 font-semibold">Documentation</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.id}
                className={index % 2 === 1 ? "bg-brand-ice/80" : "bg-white"}
              >
                <td className="px-4 py-3 font-medium text-brand-navy">
                  <Link href={`/shop/${product.slug}`} className="hover:underline">
                    {product.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-brand-slate">{product.purity}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/certificates?q=${encodeURIComponent(product.name)}`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    View lots
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
