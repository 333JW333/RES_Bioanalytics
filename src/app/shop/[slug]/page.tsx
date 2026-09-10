import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getAllProducts, getProductBySlug } from "@/data/products";
import AddToCartPanel from "@/components/AddToCartPanel";
import Disclosure from "@/components/Disclosure";
import ChemFormula from "@/components/ChemFormula";
import {
  VialIcon,
  ShieldCheckIcon,
  FileIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "@/components/icons";

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/shop/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductPage(props: PageProps<"/shop/[slug]">) {
  const { slug } = await props.params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const pubchemQuery = encodeURIComponent(product.casNumber ?? product.name);

  return (
    <div className="container-page py-14">
      <nav className="text-sm text-brand-slate-light mb-8">
        <Link href="/shop" className="hover:text-brand-teal-dark">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-brand-navy">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-brand-navy-2 py-24">
          <VialIcon className="h-32 w-32" />
        </div>

        <div>
          <span className="badge-ruo mb-4">Research Use Only</span>
          <h1 className="text-3xl font-bold text-brand-navy mb-1">{product.name}</h1>
          {product.synonym && (
            <p className="text-brand-slate-light mb-4">{product.synonym}</p>
          )}
          <p className="text-brand-slate leading-relaxed mb-6">{product.shortDescription}</p>

          <div className="mb-8">
            <AddToCartPanel product={product} />
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-brand-line bg-brand-ice p-4">
            <ShieldCheckIcon className="h-5 w-5 shrink-0 text-brand-teal-dark mt-0.5" />
            <p className="text-xs text-brand-slate-light leading-relaxed">
              Each lot ships with a certificate of analysis confirming
              identity and purity by HPLC/MS — see{" "}
              <a href="#documents" className="text-brand-teal-dark underline">
                Documents &amp; Files
              </a>{" "}
              below. Storage: {product.storage}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-14 space-y-6">
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-6">Product Description</h2>
          <div className="space-y-6">
            <DescriptionBlock title="Nomenclature & Synonyms">
              <p>{product.description}</p>
              {product.alsoKnownAs && product.alsoKnownAs.length > 0 && (
                <p className="mt-2">
                  Also referenced as: {product.alsoKnownAs.join(", ")}.
                </p>
              )}
            </DescriptionBlock>

            {product.structuralNotes && (
              <DescriptionBlock title="Structural Characteristics">
                <p>{product.structuralNotes}</p>
              </DescriptionBlock>
            )}

            {product.technicalNotes && (
              <DescriptionBlock title="Technical Properties">
                <p>{product.technicalNotes}</p>
              </DescriptionBlock>
            )}

            <DescriptionBlock title="Compliance">
              <p>
                For laboratory research use only. Not for human or veterinary
                use. Not intended for diagnostic, therapeutic, or preventive
                applications.
              </p>
            </DescriptionBlock>
          </div>
        </div>

        <Disclosure title="Technical Specifications">
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-brand-navy mb-3">Product Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {product.casNumber && <SpecItem label="CAS Number" value={product.casNumber} />}
                {product.sequenceOrFormula && (
                  <SpecItem label="Sequence" value={product.sequenceOrFormula} mono />
                )}
                {product.molecularFormula && (
                  <SpecItem
                    label="Molecular Formula"
                    value={<ChemFormula formula={product.molecularFormula} />}
                  />
                )}
                {product.molecularWeight && (
                  <SpecItem label="Molecular Weight" value={product.molecularWeight} />
                )}
                <SpecItem label="Purity" value={product.purity} />
                <SpecItem label="Form" value={product.form} />
                <SpecItem label="Category" value={product.category} />
                <SpecItem
                  label="Available Sizes"
                  value={
                    <ul className="space-y-0.5">
                      {product.sizes.map((s) => (
                        <li key={s.sku}>
                          {s.label} — <span className="font-mono text-xs">{s.sku}</span>
                        </li>
                      ))}
                    </ul>
                  }
                />
              </dl>
            </div>

            {product.computedProperties && (
              <div>
                <h3 className="text-sm font-semibold text-brand-navy mb-3">Computed Properties</h3>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                  {product.computedProperties.exactMass && (
                    <SpecItem label="Exact Mass" value={product.computedProperties.exactMass} />
                  )}
                  {product.computedProperties.xLogP && (
                    <SpecItem label="XLogP" value={product.computedProperties.xLogP} />
                  )}
                  {product.computedProperties.tpsa && (
                    <SpecItem label="TPSA" value={product.computedProperties.tpsa} />
                  )}
                  {product.computedProperties.complexity && (
                    <SpecItem label="Complexity" value={product.computedProperties.complexity} />
                  )}
                  {product.computedProperties.hBondDonors !== undefined && (
                    <SpecItem label="H-Bond Donors" value={String(product.computedProperties.hBondDonors)} />
                  )}
                  {product.computedProperties.hBondAcceptors !== undefined && (
                    <SpecItem label="H-Bond Acceptors" value={String(product.computedProperties.hBondAcceptors)} />
                  )}
                  {product.computedProperties.rotatableBonds !== undefined && (
                    <SpecItem label="Rotatable Bonds" value={String(product.computedProperties.rotatableBonds)} />
                  )}
                  {product.computedProperties.heavyAtoms !== undefined && (
                    <SpecItem label="Heavy Atoms" value={String(product.computedProperties.heavyAtoms)} />
                  )}
                </dl>
                <p className="text-[11px] text-brand-slate-light mt-3">Source: PubChem computed properties</p>
              </div>
            )}

            {product.alsoKnownAs && product.alsoKnownAs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-brand-navy mb-3">Also Known As</h3>
                <div className="flex flex-wrap gap-2">
                  {product.alsoKnownAs.map((name) => (
                    <span
                      key={name}
                      className="rounded-full bg-brand-ice border border-brand-line px-3 py-1 text-xs text-brand-slate"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 pt-2 border-t border-brand-line">
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/#query=${pubchemQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-teal-dark hover:underline"
              >
                View on PubChem <ExternalLinkIcon />
              </a>
            </div>
          </div>
        </Disclosure>

        <div id="documents">
          <Disclosure title="Documents & Files">
            {product.documents && product.documents.length > 0 ? (
              <ul className="space-y-3">
                {product.documents.map((doc) => (
                  <li
                    key={doc.url}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border border-brand-line p-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal-dark">
                      <FileIcon />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-brand-navy truncate">{doc.label}</p>
                      {doc.subLabel && (
                        <p className="text-xs text-brand-slate-light">{doc.subLabel}</p>
                      )}
                      <p className="text-xs text-brand-slate-light font-mono truncate">
                        {doc.fileName} · {doc.fileSizeLabel}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-1.5 !px-3 text-sm">
                        View
                      </a>
                      <a href={doc.url} download className="btn-primary !py-1.5 !px-3 text-sm">
                        <DownloadIcon /> Download
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-brand-slate-light">
                Certificate of analysis available upon request — contact{" "}
                <Link href="/contact" className="text-brand-teal-dark underline">
                  our team
                </Link>
                .
              </p>
            )}
          </Disclosure>
        </div>
      </section>
    </div>
  );
}

function DescriptionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-brand-navy mb-1.5">{title}</h3>
      <div className="text-sm text-brand-slate leading-relaxed">{children}</div>
    </div>
  );
}

function SpecItem({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-brand-slate-light text-xs uppercase tracking-wide mb-1">{label}</dt>
      <dd className={`text-brand-navy font-medium break-words ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
