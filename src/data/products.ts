import { Product } from "@/types/product";

/**
 * SAMPLE CATALOG DATA — placeholder listings for initial development.
 * Replace names, sequences, purities, sizes, and pricing with your verified
 * COA-backed data before launch. Add new entries to this array to scale
 * past the initial 5 SKUs (designed to comfortably hold 30+).
 */
export const products: Product[] = [
  {
    id: "p1",
    slug: "bpc-157",
    name: "BPC-157",
    synonym: "Body Protection Compound-157",
    category: "Peptide",
    casNumber: "137525-51-0",
    sequenceOrFormula: "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val",
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic pentadecapeptide reference compound supplied for laboratory research use.",
    description:
      "BPC-157 is a synthetic pentadecapeptide sequence, supplied as a sterile-filtered, lyophilized powder for laboratory and analytical research use only.",
    sizes: [
      { label: "2 mg", mg: 2, price: 39, sku: "RES-BPC-2" },
      { label: "5 mg", mg: 5, price: 69, sku: "RES-BPC-5" },
      { label: "10 mg", mg: 10, price: 119, sku: "RES-BPC-10" },
    ],
    featured: true,
  },
  {
    id: "p2",
    slug: "tb-500",
    name: "TB-500",
    synonym: "Thymosin Beta-4 Fragment (Ac-SDKP related)",
    category: "Peptide",
    casNumber: "77591-33-4",
    sequenceOrFormula: "Ac-LKKTETQ",
    purity: "≥ 98% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic peptide fragment reference compound supplied for laboratory research use.",
    description:
      "TB-500 is a short synthetic peptide fragment derived from the Thymosin Beta-4 sequence, supplied as a lyophilized powder for laboratory and analytical research use only.",
    sizes: [
      { label: "2 mg", mg: 2, price: 45, sku: "RES-TB5-2" },
      { label: "5 mg", mg: 5, price: 79, sku: "RES-TB5-5" },
      { label: "10 mg", mg: 10, price: 139, sku: "RES-TB5-10" },
    ],
    featured: true,
  },
  {
    id: "p3",
    slug: "ipamorelin",
    name: "Ipamorelin",
    category: "Peptide",
    casNumber: "170851-70-4",
    sequenceOrFormula: "Aib-His-D-2Nal-D-Phe-Lys-NH2",
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic pentapeptide reference compound supplied for laboratory research use.",
    description:
      "Ipamorelin is a synthetic pentapeptide, supplied as a lyophilized powder for laboratory and analytical research use only.",
    sizes: [
      { label: "2 mg", mg: 2, price: 35, sku: "RES-IPA-2" },
      { label: "5 mg", mg: 5, price: 59, sku: "RES-IPA-5" },
      { label: "10 mg", mg: 10, price: 99, sku: "RES-IPA-10" },
    ],
  },
  {
    id: "p4",
    slug: "semaglutide",
    name: "Semaglutide",
    category: "Peptide",
    casNumber: "910463-68-2",
    sequenceOrFormula: "C187H291N45O59",
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic peptide reference compound supplied for laboratory research use.",
    description:
      "Semaglutide is a synthetic peptide analog, supplied as a lyophilized powder for laboratory and analytical research use only. Not for human or veterinary use.",
    sizes: [
      { label: "5 mg", mg: 5, price: 149, sku: "RES-SEMA-5" },
      { label: "10 mg", mg: 10, price: 259, sku: "RES-SEMA-10" },
    ],
    featured: true,
  },
  {
    id: "p5",
    slug: "ghk-cu",
    name: "GHK-Cu",
    synonym: "Copper Peptide",
    category: "Peptide",
    casNumber: "89030-95-5",
    sequenceOrFormula: "Gly-His-Lys : Cu2+",
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C, protected from light; reconstituted solution at 2–8°C.",
    shortDescription: "A copper-binding tripeptide reference compound supplied for laboratory research use.",
    description:
      "GHK-Cu is a copper-binding tripeptide complex, supplied as a lyophilized powder for laboratory and analytical research use only.",
    sizes: [
      { label: "50 mg", mg: 50, price: 45, sku: "RES-GHK-50" },
      { label: "100 mg", mg: 100, price: 79, sku: "RES-GHK-100" },
    ],
  },
];

export function getAllProducts(): Product[] {
  return products;
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCategories(): string[] {
  return Array.from(new Set(products.map((p) => p.category)));
}
