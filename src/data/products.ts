import type { Product } from "@/types/product";

/**
 * Catalog data for the current EcoPeps shop (8 products).
 * Replace names, sequences, purities, sizes, and pricing with verified
 * COA-backed data before treating listings as final. Add new entries to
 * this array to scale toward 30+ SKUs.
 *
 * `documents` currently point to sample Certificates of Analysis
 * (public/coas/*.pdf) — replace with real lab-issued COAs before launch.
 * `computedProperties` are only populated for BPC-157 using confirmed
 * PubChem values; add the rest once you pull each compound's real PubChem
 * record (leave the field undefined until then rather than guessing).
 */
export const products: Product[] = [
  {
    id: "p7",
    slug: "retatrutide",
    name: "EP-GLP3-R",
    // Sold under EcoPeps' internal designation rather than the INN
    // "Retatrutide" for IP/legal reasons (see ProductDisclaimer's patent-use
    // notice). The synonym line and body copy below describe the
    // pharmacological class (mechanism of action) rather than naming the
    // compound — "Retatrutide" does not appear anywhere on the rendered
    // page. It's still searchable via seoAlternateNames in this page's
    // JSON-LD structured data (invisible, read by search engines only) and
    // via the /shop/retatrutide URL slug.
    synonym: "Triple GIP/GLP-1/Glucagon Receptor Agonist",
    category: "Peptide",
    casNumber: "2381089-83-2",
    sequenceOrFormula: "C221H342N46O68",
    molecularFormula: "C221H342N46O68",
    molecularWeight: "4731.42 g/mol",
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "EcoPeps' internal designation for a triple GIP/GLP-1/glucagon receptor agonist peptide, supplied for laboratory research use.",
    description:
      "EP-GLP3-R is EcoPeps' internal designation for a synthetic triple GIP/GLP-1/glucagon receptor agonist peptide analog, supplied as a lyophilized powder for laboratory and analytical research use only. Not for human or veterinary use.",
    structuralNotes:
      "A long-chain synthetic peptide analog featuring a fatty-diacid side chain used to extend the parent sequence's stability, consistent with other incretin-class peptide analogs in this catalog.",
    technicalNotes:
      "Soluble in sterile water for research use. Lyophilized powder is stable at room temperature when protected from moisture; reconstituted solution should be refrigerated (< 8°C) and used promptly.",
    images: {
      front: "/products/ep-glp3-r-front.png",
      back: "/products/ep-glp3-r-back.png",
      backCaption: "*Batch and Expiration will be the same as the current batch's COAs",
      extra: [
        {
          label: "Identity & Purity",
          src: "/coas/retatrutide/15mg/identity-purity-214265.png",
        },
        { label: "Endotoxin", src: "/coas/retatrutide/15mg/endotoxin-214266.png" },
        { label: "Sterility", src: "/coas/retatrutide/15mg/sterility-214267.png" },
      ],
    },
    infoNote: "Each vial has a scannable QR code linking the batch to its respective COAs.",
    documents: [
      {
        label: "Certificate of Analysis — Identity & Purity",
        subLabel: "Janoshik Analytical — EP-GLP3-R 15 mg, Batch PSRETA15-1",
        fileName: "identity-purity-214265.png",
        fileSizeLabel: "208 KB",
        url: "/coas/retatrutide/15mg/identity-purity-214265.png",
        verifyUrl: "https://verify.janoshik.com/tests/214265-Reta_15mg_Rd1_5X9DNCQIS949",
      },
      {
        label: "Certificate of Analysis — Endotoxin",
        subLabel: "Janoshik Analytical — EP-GLP3-R 15 mg, Batch PSRETA15-1",
        fileName: "endotoxin-214266.png",
        fileSizeLabel: "194 KB",
        url: "/coas/retatrutide/15mg/endotoxin-214266.png",
        verifyUrl: "https://verify.janoshik.com/tests/214266-Reta_15mg_Rd1_FYUBP6FMHX1A",
      },
      {
        label: "Certificate of Analysis — Sterility",
        subLabel: "Janoshik Analytical — EP-GLP3-R 15 mg, Batch PSRETA15-1",
        fileName: "sterility-214267.png",
        fileSizeLabel: "194 KB",
        url: "/coas/retatrutide/15mg/sterility-214267.png",
        verifyUrl: "https://verify.janoshik.com/tests/214267-Reta_15mg_Rd1_HDTJ2EQMILXB",
      },
    ],
    // Newest batch first — see "Adding a batch" in README.md.
    batches: [
      {
        labName: "Janoshik Analytical",
        // Averaged across the 3 vials Janoshik tested from batch PSRETA15-1:
        // mass 17.58/17.79/17.86 mg, purity 99.269/99.699/99.618% (Task #214265).
        purityPercent: 99.53,
        testedMassMg: 17.74,
        labeledMassMg: 15,
        massVariancePercent: 18.3,
        tests: [
          { label: "Identity", result: "CONFIRMED" },
          { label: "Batch PSRETA15-1", result: "CONFIRMED" },
          { label: "USP <85> Endotoxin", result: "PASS" },
          { label: "Total Aerobic Microbial Count (TAMC)", result: "PASS" },
          { label: "Total Yeast & Mold Count (TYMC)", result: "PASS" },
          { label: "USP <61> Microbial Enumeration", result: "PASS" },
        ],
        reportUrl: "/coas/retatrutide/15mg/retatrutide-15mg-full-coa.pdf",
        verifyLinks: [
          {
            label: "Identity",
            url: "https://verify.janoshik.com/tests/214265-Reta_15mg_Rd1_5X9DNCQIS949",
          },
          {
            label: "Endotoxin",
            url: "https://verify.janoshik.com/tests/214266-Reta_15mg_Rd1_FYUBP6FMHX1A",
          },
          {
            label: "TAMC/TYMC",
            url: "https://verify.janoshik.com/tests/214267-Reta_15mg_Rd1_HDTJ2EQMILXB",
          },
        ],
        batchCode: "PSRETA15-1",
      },
    ],
    volumeTiers: [
      { label: "2 vials", minQty: 2, discountPercent: 5 },
      { label: "3–4 vials", minQty: 3, discountPercent: 10 },
      { label: "5–9 vials", minQty: 5, discountPercent: 20 },
      { label: "10+ vials", minQty: 10, discountPercent: 30 },
    ],
    // Only 15 mg is currently in stock (it's the batch we have a real,
    // lab-verified COA for — see batches/documents above). The other sizes
    // are listed so customers know we carry them, but stay disabled with no
    // price set until each has its own verified COA and goes into stock.
    sizes: [
      { label: "10 mg", mg: 10, price: 0, sku: "RES-RETA-10", inStock: false },
      { label: "15 mg", mg: 15, price: 65, sku: "RES-RETA-15" },
      { label: "20 mg", mg: 20, price: 0, sku: "RES-RETA-20", inStock: false },
      { label: "30 mg", mg: 30, price: 0, sku: "RES-RETA-30", inStock: false },
      { label: "60 mg", mg: 60, price: 0, sku: "RES-RETA-60", inStock: false },
    ],
    featured: true,
    showDisclaimer: true,
    showUsageNotice: true,
    hideSizesSpec: true,
    seoAlternateNames: ["Retatrutide", "LY3437943"],
  },
  {
    id: "p8",
    slug: "thymosin-alpha-1",
    name: "Thymosin Alpha-1",
    synonym: "Thymalfasin",
    category: "Peptide",
    casNumber: "62304-98-7",
    sequenceOrFormula:
      "Ac-Ser-Asp-Ala-Ala-Val-Asp-Thr-Ser-Ser-Glu-Ile-Thr-Thr-Lys-Asp-Leu-Lys-Glu-Lys-Lys-Glu-Val-Val-Glu-Glu-Ala-Glu-Asn",
    molecularFormula: "C129H215N33O55",
    molecularWeight: "3108.28 g/mol",
    alsoKnownAs: ["Thymalfasin", "Tα1", "TA1"],
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic 28-residue acetylated thymic peptide reference compound supplied for laboratory research use.",
    description:
      "Thymosin Alpha-1 is a synthetic 28-amino-acid peptide corresponding to the acetylated thymic peptide originally isolated from thymosin fraction 5, supplied as a lyophilized powder for laboratory and analytical research use only. Not for human or veterinary use.",
    structuralNotes:
      "A 28-residue linear peptide with an acetylated N-terminal serine and a free C-terminal carboxyl. It corresponds to the N-terminal region of prothymosin alpha, and its high proportion of acidic residues (Asp, Glu) gives it a net negative charge at neutral pH.",
    technicalNotes:
      "Soluble in sterile water for research use. Lyophilized powder is stable at room temperature when protected from moisture; reconstituted solution should be refrigerated (< 8°C) and used promptly.",
    // "-v2": a replaced photo needs a new filename, or the old one can keep
    // showing for hours from Next's image cache (minimumCacheTTL).
    images: {
      front: "/products/thymosin-alpha-1-front-v2.png",
      back: "/products/thymosin-alpha-1-back.png",
      backCaption: "*Batch and Expiration will be the same as the current batch's COAs",
      extra: [
        {
          label: "Identity & Purity",
          src: "/coas/thymosin-alpha-1/10mg/PSTA110-2/identity-purity-227167.png",
        },
        { label: "Endotoxin", src: "/coas/thymosin-alpha-1/10mg/PSTA110-2/endotoxin-227168.png" },
        { label: "Sterility", src: "/coas/thymosin-alpha-1/10mg/PSTA110-2/sterility-227169.png" },
      ],
    },
    infoNote: "Each vial has a scannable QR code linking the batch to its respective COAs.",
    documents: [
      {
        label: "Certificate of Analysis — Identity & Purity",
        subLabel: "Janoshik Analytical — Thymosin Alpha-1 10 mg, Batch PSTA110-2",
        fileName: "identity-purity-227167.png",
        fileSizeLabel: "374 KB",
        url: "/coas/thymosin-alpha-1/10mg/PSTA110-2/identity-purity-227167.png",
        verifyUrl: "https://verify.janoshik.com/tests/227167_YIZ5IJCCB8AJ",
      },
      {
        label: "Certificate of Analysis — Endotoxin",
        subLabel: "Janoshik Analytical — Thymosin Alpha-1 10 mg, Batch PSTA110-2",
        fileName: "endotoxin-227168.png",
        fileSizeLabel: "352 KB",
        url: "/coas/thymosin-alpha-1/10mg/PSTA110-2/endotoxin-227168.png",
        verifyUrl: "https://verify.janoshik.com/tests/227168_9HAXKAJJ5MFX",
      },
      {
        label: "Certificate of Analysis — Sterility",
        subLabel: "Janoshik Analytical — Thymosin Alpha-1 10 mg, Batch PSTA110-2",
        fileName: "sterility-227169.png",
        fileSizeLabel: "350 KB",
        url: "/coas/thymosin-alpha-1/10mg/PSTA110-2/sterility-227169.png",
        verifyUrl: "https://verify.janoshik.com/tests/227169_2CFUU192I3C4",
      },
    ],
    // Newest batch first — see "Adding a batch" in README.md.
    batches: [
      {
        labName: "Janoshik Analytical",
        // Averaged across the 3 vials Janoshik tested from batch PSTA110-2:
        // mass 11.10/11.09/11.11 mg, purity 99.916/99.920/99.926% (Task #227167).
        purityPercent: 99.92,
        testedMassMg: 11.1,
        labeledMassMg: 10,
        massVariancePercent: 11,
        tests: [
          { label: "Identity", result: "CONFIRMED" },
          { label: "Batch PSTA110-2", result: "CONFIRMED" },
          { label: "USP <85> Endotoxin", result: "PASS" },
          { label: "Total Aerobic Microbial Count (TAMC)", result: "PASS" },
          { label: "Total Yeast & Mold Count (TYMC)", result: "PASS" },
          { label: "USP <61> Microbial Enumeration", result: "PASS" },
        ],
        reportUrl: "/coas/thymosin-alpha-1/10mg/PSTA110-2/thymosin-alpha-1-10mg-full-coa.pdf",
        verifyLinks: [
          {
            label: "Identity",
            url: "https://verify.janoshik.com/tests/227167_YIZ5IJCCB8AJ",
          },
          {
            label: "Endotoxin",
            url: "https://verify.janoshik.com/tests/227168_9HAXKAJJ5MFX",
          },
          {
            label: "TAMC/TYMC",
            url: "https://verify.janoshik.com/tests/227169_2CFUU192I3C4",
          },
        ],
        batchCode: "PSTA110-2",
      },
    ],
    volumeTiers: [
      { label: "2 vials", minQty: 2, discountPercent: 5 },
      { label: "3–4 vials", minQty: 3, discountPercent: 10 },
      { label: "5–9 vials", minQty: 5, discountPercent: 20 },
      { label: "10+ vials", minQty: 10, discountPercent: 30 },
    ],
    // Only 10 mg is in stock (batch PSTA110-2, with a lab-verified COA —
    // see batches/documents above). 20 mg and 30 mg are listed so customers
    // know we carry them, but stay disabled with no price set until each has
    // its own verified COA and goes into stock.
    sizes: [
      { label: "10 mg", mg: 10, price: 70, sku: "RES-TA1-10" },
      { label: "20 mg", mg: 20, price: 0, sku: "RES-TA1-20", inStock: false },
      { label: "30 mg", mg: 30, price: 0, sku: "RES-TA1-30", inStock: false },
    ],
    // Featured lists follow this array's order, so it shows second on the
    // home page, as it does in the shop.
    featured: true,
    showDisclaimer: true,
    showUsageNotice: true,
    hideSizesSpec: true,
  },
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
    // Batch BP10-0719 tested 98.56–98.70% (see batches below).
    purity: "≥ 98% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C; reconstituted solution at 2–8°C, use within 14 days.",
    shortDescription: "A synthetic pentadecapeptide reference compound supplied for laboratory research use.",
    description:
      "BPC-157 is a synthetic pentadecapeptide sequence, supplied as a sterile-filtered, lyophilized powder for laboratory and analytical research use only.",
    structuralNotes:
      "Composed of 15 amino acid residues. Does not derive from a larger parent protein and carries no N-terminal acetylation or C-terminal amidation.",
    technicalNotes:
      "Soluble in sterile water at concentrations up to ~1 mg/mL for research use. Lyophilized powder is stable at room temperature when protected from moisture; reconstituted solution should be refrigerated (< 8°C) and used promptly.",
    images: {
      front: "/products/bpc-157-front.png",
      back: "/products/bpc-157-back.png",
      extra: [
        {
          label: "Identity & Purity",
          src: "/coas/bpc-157/10mg/BP10-0719/identity-purity-213018.png",
        },
      ],
    },
    infoNote: "Each vial has a scannable QR code linking the batch to its respective COAs.",
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
        label: "Certificate of Analysis — Identity & Purity",
        subLabel: "Janoshik Analytical — BPC-157 10 mg, Batch BP10-0719",
        fileName: "identity-purity-213018.png",
        fileSizeLabel: "388 KB",
        url: "/coas/bpc-157/10mg/BP10-0719/identity-purity-213018.png",
        verifyUrl: "https://verify.janoshik.com/tests/213018_TE5WQJ8L28H9",
      },
    ],
    // Newest batch first — see "Adding a batch" in README.md.
    batches: [
      {
        labName: "Janoshik Analytical",
        // Averaged across the 3 vials Janoshik tested from batch BP10-0719:
        // mass 11.24/11.20/11.07 mg, purity 98.703/98.562/98.633%
        // (Task #213018). Identity and purity only.
        purityPercent: 98.63,
        testedMassMg: 11.17,
        labeledMassMg: 10,
        massVariancePercent: 11.7,
        tests: [
          { label: "Identity", result: "CONFIRMED" },
          { label: "Batch BP10-0719", result: "CONFIRMED" },
        ],
        reportUrl: "/coas/bpc-157/10mg/BP10-0719/bpc-157-10mg-full-coa.pdf",
        verifyLinks: [
          {
            label: "Identity & Purity",
            url: "https://verify.janoshik.com/tests/213018_TE5WQJ8L28H9",
          },
        ],
        batchCode: "BP10-0719",
      },
    ],
    // Only 10 mg is in stock (batch BP10-0719, with a lab-verified COA —
    // see batches/documents above). 20 mg and 40 mg are listed so customers
    // know we carry them, but stay disabled with no price set until each has
    // its own verified COA and goes into stock.
    sizes: [
      { label: "10 mg", mg: 10, price: 79, sku: "RES-BPC-10" },
      { label: "20 mg", mg: 20, price: 0, sku: "RES-BPC-20", inStock: false },
      { label: "40 mg", mg: 40, price: 0, sku: "RES-BPC-40", inStock: false },
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
    images: {
      front: "/products/tb-500-front.png",
      back: "/products/tb-500-back.png",
    },
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
    images: {
      front: "/products/ipamorelin-front.png",
      back: "/products/ipamorelin-back.png",
    },
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
    images: {
      front: "/products/tirzepatide-front.png",
      back: "/products/tirzepatide-back.png",
    },
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
    images: {
      front: "/products/ghk-cu-front.png",
      back: "/products/ghk-cu-back.png",
    },
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
  {
    id: "p6",
    slug: "ss-31",
    name: "SS-31",
    synonym: "Mitochondria-Targeted Tetrapeptide",
    category: "Peptide",
    casNumber: "736992-21-5",
    sequenceOrFormula: "D-Arg-Dmt-Lys-Phe-NH2",
    molecularFormula: "C32H49N9O5",
    molecularWeight: "639.79 g/mol",
    alsoKnownAs: ["SS-31", "Elamipretide"],
    purity: "≥ 99% (HPLC)",
    form: "Lyophilized powder",
    storage: "Store lyophilized powder at -20°C, protected from light; reconstituted solution at 2–8°C.",
    shortDescription: "A synthetic aromatic-cationic tetrapeptide reference compound supplied for laboratory research use.",
    description:
      "SS-31 is a synthetic tetrapeptide incorporating alternating cationic and aromatic residues, supplied as a sterile-filtered, lyophilized powder for laboratory and analytical research use only.",
    structuralNotes:
      "A 4-residue synthetic peptide featuring a D-amino acid at the N-terminus, a dimethyltyrosine (Dmt) residue, and a C-terminal amide.",
    technicalNotes:
      "Soluble in sterile water for research use. Lyophilized powder is stable at room temperature when protected from light and moisture; reconstituted solution should be refrigerated (< 8°C) and used promptly.",
    images: {
      front: "/products/ss-31-front.png",
      back: "/products/ss-31-back.png",
      extra: [
        {
          label: "Identity & Purity",
          src: "/coas/ss-31/10mg/2S31-0817/identity-purity-rpt-2026-356713.png",
        },
      ],
    },
    infoNote: "Each vial has a scannable QR code linking the batch to its respective COAs.",
    documents: [
      {
        label: "Certificate of Analysis — Identity & Purity",
        subLabel: "SteriGenix — SS-31 10 mg, Batch 2S31-0817",
        fileName: "ss-31-10mg-full-coa.pdf",
        fileSizeLabel: "2.0 MB",
        url: "/coas/ss-31/10mg/2S31-0817/ss-31-10mg-full-coa.pdf",
        verifyUrl: "https://sterigenixanalytical.com/verify/RPT-2026-356713",
      },
    ],
    // Newest batch first — see "Adding a batch" in README.md.
    batches: [
      {
        labName: "SteriGenix",
        // Report RPT-2026-356713 covers identity and purity only; heavy
        // metals and batch conformity were not tested.
        purityPercent: 99.68,
        testedMassMg: 10.16,
        labeledMassMg: 10,
        massVariancePercent: 1.6,
        tests: [
          { label: "Identity (LC-MS)", result: "CONFIRMED" },
          { label: "Batch 2S31-0817", result: "CONFIRMED" },
          { label: "HPLC Purity (> 98%)", result: "PASS" },
          { label: "Net Peptide Content (10 mg ± 10%)", result: "PASS" },
        ],
        reportUrl: "/coas/ss-31/10mg/2S31-0817/ss-31-10mg-full-coa.pdf",
        verifyLinks: [
          {
            label: "Identity & Purity",
            url: "https://sterigenixanalytical.com/verify/RPT-2026-356713",
          },
        ],
        batchCode: "2S31-0817",
      },
    ],
    sizes: [{ label: "10 mg", mg: 10, price: 89, sku: "RES-SS31-10" }],
    featured: true,
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
