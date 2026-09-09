import { Metadata } from "next";
import Link from "next/link";
import { getAllProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "Research & Science",
  description: "An overview of the research areas our catalog of peptides and compounds is used to study.",
};

export default function SciencePage() {
  const products = getAllProducts();

  return (
    <div className="container-page py-16">
      <div className="max-w-3xl mb-12">
        <span className="badge-ruo mb-4">Research Use Only</span>
        <h1 className="text-3xl font-bold text-brand-navy mb-5">Research &amp; Science</h1>
        <p className="text-brand-slate leading-relaxed">
          Our catalog spans several classes of research peptides used across
          in-vitro and preclinical laboratory studies. Below is a summary of
          the research areas associated with each compound in our current
          catalog. This information is provided for scientific and
          educational context only — it is not intended to promote or
          instruct human or animal use of these products.
        </p>
      </div>

      <div className="space-y-6">
        {products.map((product) => (
          <div key={product.id} className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <Link href={`/shop/${product.slug}`} className="font-semibold text-brand-navy hover:text-brand-teal-dark">
                {product.name}
              </Link>
              <span className="text-xs font-medium text-brand-teal-dark">{product.category}</span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {product.researchAreas.map((area) => (
                <li key={area} className="rounded-full bg-brand-ice border border-brand-line px-3 py-1 text-xs text-brand-slate">
                  {area}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
