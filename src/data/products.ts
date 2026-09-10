import { Product } from "@/types/product";

/**
 * SAMPLE CATALOG DATA — placeholder listings for initial development.
 * Replace names, sequences, purities, sizes, and pricing with your verified
 * COA-backed data before launch. Add new entries to this array to scale
 * past the initial 5 SKUs (designed to comfortably hold 30+).
 *
 * `documents` point to placeholder Certificates of Analysis generated for
 * development (public/coas/*.pdf) — replace with real lab-issued COAs
 * before launch. `computedProperties` are only populated for BPC-157 using
 * confirmed PubChem values; add the rest once you pull each compound's
 * real PubChem record (leave the field undefined until then rather than
 * guessing).
 *
 * `structureImage` files (public/structures/*.png) are 2D depictions
 * generated with RDKit from each compound's known sequence/SMILES, then
 * cross-checked by confirming RDKit's computed molecular formula matches
 * the verified formula already in this file. Populated for BPC-157,
 * TB-500, Ipamorelin, and GHK-Cu. Deliberately left unset for Tirzepatide
 * (a 39-residue lipidated peptide) rather than hand-drawing a structure
 * this complex without a way to independently verify it — add a real
 * PubChem-sourced image for that one instead.
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
    molecularFormula: "C62H98N16O22",
    molecularWeight: "1419.55 g/mol",
    alsoKnownAs: ["BPC 157", "PL 14736", "PL-10", "Bepecin"],
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic pentadecapeptide reference compound supplied for laboratory research use.",
    description:
      "BPC-157 is a synthetic pentadecapeptide sequence, supplied as a sterile-filtered, lyophilized powder for laboratory and analytical research use only.",
    structuralNotes:
      "Composed of 15 amino acid residues. Does not derive from a larger parent protein and carries no N-terminal acetylation or C-terminal amidation.",
    technicalNotes:
      "Soluble in sterile water at concentrations up to ~1 mg/mL for research use. Lyophilized powder is stable at room temperature when protected from moisture; reconstituted solution should be refrigerated (< 8°C) and used promptly.",
    structureImage: "/structures/bpc-157.png",
    computedProperties: {
      exactMass: "1418.70415882 g/mol",
      xLogP: "-9",
      tpsa: "573 Å²",
      complexity: "3040",
      hBondDonors: 16,
      hBondAcceptors: 24,
      rotatableBonds: 39,
      heavyAtoms: 100,
    },
    documents: [
      {
        label: "Certificate of Analysis",
        subLabel: "Identity & Purity (HPLC/MS) — sample",
        fileName: "bpc-157-coa-sample.pdf",
        fileSizeLabel: "3.5 KB",
        url: "/coas/bpc-157-coa-sample.pdf",
      },
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
    synonym: "Thymosin Beta-4 Fragment (Ac-LKKTETQ)",
    category: "Peptide",
    // No CAS number listed: 77591-33-4 belongs to full-length Thymosin
    // Beta-4 (43 residues), not this 7-residue fragment — correcting a
    // mismatch from earlier catalog data rather than showing a CAS that
    // doesn't match the sequence below.
    sequenceOrFormula: "Ac-Leu-Lys-Lys-Thr-Glu-Thr-Gln",
    molecularFormula: "C38H68N10O14",
    molecularWeight: "≈ 889.0 g/mol (calculated from sequence)",
    alsoKnownAs: ["TB-500", "Thymosin Beta-4 Fragment"],
    purity: "≥ 98% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic peptide fragment reference compound supplied for laboratory research use.",
    description:
      "TB-500 is a short synthetic peptide fragment derived from the Thymosin Beta-4 sequence, supplied as a lyophilized powder for laboratory and analytical research use only.",
    structuralNotes:
      "A 7-residue acetylated fragment corresponding to the actin-binding region of Thymosin Beta-4, rather than the full 43-residue protein.",
    technicalNotes:
      "Soluble in sterile water for research use. Lyophilized powder is stable at room temperature when protected from moisture; reconstituted solution should be refrigerated (< 8°C) and used promptly.",
    structureImage: "/structures/tb-500.png",
    documents: [
      {
        label: "Certificate of Analysis",
        subLabel: "Identity & Purity (HPLC/MS) — sample",
        fileName: "tb-500-coa-sample.pdf",
        fileSizeLabel: "3.6 KB",
        url: "/coas/tb-500-coa-sample.pdf",
      },
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
    molecularFormula: "C38H49N9O5",
    molecularWeight: "711.86 g/mol",
    alsoKnownAs: ["Ipamorelin", "NNC 26-0161"],
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic pentapeptide reference compound supplied for laboratory research use.",
    description:
      "Ipamorelin is a synthetic pentapeptide, supplied as a lyophilized powder for laboratory and analytical research use only.",
    structuralNotes:
      "A 5-residue synthetic peptide incorporating non-standard residues (Aib, D-2-Nal, D-Phe) and a C-terminal amide.",
    technicalNotes:
      "Soluble in sterile water for research use. Lyophilized powder is stable at room temperature when protected from moisture; reconstituted solution should be refrigerated (< 8°C) and used promptly.",
    structureImage: "/structures/ipamorelin.png",
    documents: [
      {
        label: "Certificate of Analysis",
        subLabel: "Identity & Purity (HPLC/MS) — sample",
        fileName: "ipamorelin-coa-sample.pdf",
        fileSizeLabel: "3.5 KB",
        url: "/coas/ipamorelin-coa-sample.pdf",
      },
    ],
    sizes: [
      { label: "2 mg", mg: 2, price: 35, sku: "RES-IPA-2" },
      { label: "5 mg", mg: 5, price: 59, sku: "RES-IPA-5" },
      { label: "10 mg", mg: 10, price: 99, sku: "RES-IPA-10" },
    ],
  },
  {
    id: "p4",
    slug: "tirzepatide",
    name: "Tirzepatide",
    category: "Peptide",
    casNumber: "2023788-19-2",
    sequenceOrFormula: "C225H348N48O68",
    molecularFormula: "C225H348N48O68",
    molecularWeight: "4813.45 g/mol",
    alsoKnownAs: ["Tirzepatide", "LY3298176"],
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic peptide reference compound supplied for laboratory research use.",
    description:
      "Tirzepatide is a synthetic peptide analog, supplied as a lyophilized powder for laboratory and analytical research use only. Not for human or veterinary use.",
    structuralNotes:
      "A long-chain synthetic peptide analog featuring a fatty-diacid side chain used to extend the parent sequence's stability.",
    technicalNotes:
      "Soluble in sterile water for research use. Lyophilized powder is stable at room temperature when protected from moisture; reconstituted solution should be refrigerated (< 8°C) and used promptly.",
    documents: [
      {
        label: "Certificate of Analysis",
        subLabel: "Identity & Purity (HPLC/MS) — sample",
        fileName: "tirzepatide-coa-sample.pdf",
        fileSizeLabel: "3.5 KB",
        url: "/coas/tirzepatide-coa-sample.pdf",
      },
    ],
    sizes: [
      { label: "5 mg", mg: 5, price: 169, sku: "RES-TIRZ-5" },
      { label: "10 mg", mg: 10, price: 289, sku: "RES-TIRZ-10" },
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
    molecularFormula: "C14H22CuN6O4",
    molecularWeight: "403.93 g/mol",
    alsoKnownAs: ["GHK-Cu", "Copper Tripeptide-1", "Copper Tripeptide"],
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C, protected from light; reconstituted solution at 2–8°C.",
    shortDescription: "A copper-binding tripeptide reference compound supplied for laboratory research use.",
    description:
      "GHK-Cu is a copper-binding tripeptide complex, supplied as a lyophilized powder for laboratory and analytical research use only.",
    structuralNotes:
      "A naturally occurring tripeptide (Gly-His-Lys) coordinated to a divalent copper ion.",
    technicalNotes:
      "Soluble in sterile water for research use. Lyophilized powder is stable at room temperature when protected from light and moisture; reconstituted solution should be refrigerated (< 8°C) and used promptly.",
    structureImage: "/structures/ghk-cu.png",
    documents: [
      {
        label: "Certificate of Analysis",
        subLabel: "Identity & Purity (HPLC/MS) — sample",
        fileName: "ghk-cu-coa-sample.pdf",
        fileSizeLabel: "3.5 KB",
        url: "/coas/ghk-cu-coa-sample.pdf",
      },
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
