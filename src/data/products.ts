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
    shortDescription: "A pentadecapeptide fragment widely used in in-vitro and in-vivo tissue-repair research.",
    description:
      "BPC-157 is a synthetic pentadecapeptide sequence studied in laboratory settings for its interactions with angiogenic and tissue-signaling pathways. Supplied as a sterile-filtered, lyophilized powder for research applications only.",
    researchAreas: [
      "Angiogenesis and vascular signaling models",
      "Gastrointestinal mucosal research",
      "Tendon and ligament fibroblast studies",
      "In-vitro wound-healing assays",
    ],
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
    shortDescription: "A synthetic fragment of Thymosin Beta-4 used in actin-regulation and cell-migration research.",
    description:
      "TB-500 is a short synthetic peptide fragment derived from the naturally occurring Thymosin Beta-4 protein, used by laboratories to investigate actin-binding dynamics and cell-migration mechanisms. For research use only.",
    researchAreas: [
      "Actin polymerization studies",
      "Cell migration and motility assays",
      "In-vitro angiogenesis models",
      "Extracellular matrix research",
    ],
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
    shortDescription: "A selective growth-hormone secretagogue peptide used in receptor-selectivity research.",
    description:
      "Ipamorelin is a pentapeptide studied as a selective ghrelin/growth-hormone secretagogue receptor agonist in pharmacological and endocrinology research models. Supplied strictly for laboratory and analytical research use.",
    researchAreas: [
      "Ghrelin receptor binding assays",
      "In-vitro endocrine signaling studies",
      "Receptor selectivity and pharmacodynamics research",
    ],
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
    shortDescription: "A GLP-1 receptor agonist analog used extensively in metabolic-pathway research.",
    description:
      "Semaglutide is a long-acting GLP-1 receptor agonist analog used by research institutions to study incretin signaling and metabolic pathways in cell and animal models. Not for human or veterinary use.",
    researchAreas: [
      "GLP-1 receptor signaling studies",
      "Metabolic and glycemic pathway research",
      "In-vivo animal model studies (IACUC-approved facilities)",
    ],
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
    shortDescription: "A naturally occurring copper-binding tripeptide used in dermal and gene-expression research.",
    description:
      "GHK-Cu is a naturally occurring copper-binding tripeptide complex studied for its role in extracellular matrix remodeling and gene-expression regulation in dermal fibroblast research models.",
    researchAreas: [
      "Dermal fibroblast and collagen-synthesis studies",
      "Gene-expression microarray research",
      "Copper-binding and metalloenzyme studies",
    ],
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
