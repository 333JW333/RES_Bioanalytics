export interface ProductSize {
  label: string;
  mg: number;
  price: number;
  sku: string;
  /** Whether this size can currently be purchased. Defaults to true when omitted; set false to list a size as carried but not yet in stock (e.g. no COA for that batch yet). */
  inStock?: boolean;
}

export interface ComputedProperties {
  exactMass?: string;
  xLogP?: string;
  tpsa?: string;
  complexity?: string;
  hBondDonors?: number;
  hBondAcceptors?: number;
  rotatableBonds?: number;
  heavyAtoms?: number;
}

export interface ProductDocument {
  label: string;
  subLabel?: string;
  fileName: string;
  fileSizeLabel: string;
  url: string;
  /** Official third-party lab page to independently verify this report. */
  verifyUrl?: string;
}

export interface ProductGalleryImage {
  label: string;
  src: string;
}

export interface ProductImages {
  /** Vial photos. Leave out until real ones exist; the gallery then shows only `extra`. */
  front?: string;
  back?: string;
  /** Overrides the note shown under the Back shot (by default, that the current batch's details ship). */
  backCaption?: string;
  /** Extra gallery images shown after front/back, e.g. COA scans. */
  extra?: ProductGalleryImage[];
}

export interface CoaTestResult {
  label: string;
  result: string;
}

export interface CoaPanel {
  labName: string;
  /** True while the numbers below are illustrative placeholders, not a real lab result. Renders a "Sample Data" flag instead of the lab name. */
  sampleData?: boolean;
  purityPercent: number;
  testedMassMg: number;
  labeledMassMg: number;
  massVariancePercent: number;
  tests: CoaTestResult[];
  /** Certificate of Analysis file (PDF or image) hosted on this site. */
  reportUrl: string;
  /** One official lab verification link per test/report, e.g. Identity, Endotoxin, TAMC/TYMC. */
  verifyLinks: { label: string; url: string }[];
  /** Lab batch number (e.g. "PSRETA15-1"). Its vial QR code is in src/data/vial-codes.ts. */
  batchCode?: string;
}

export interface VolumeTier {
  label: string;
  minQty: number;
  discountPercent: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  synonym?: string;
  category: "Peptide" | "Peptide Blend" | "Research Chemical";
  casNumber?: string;
  sequenceOrFormula?: string;
  molecularFormula?: string;
  molecularWeight?: string;
  alsoKnownAs?: string[];
  purity: string;
  form: string;
  storage: string;
  shortDescription: string;
  description: string;
  structuralNotes?: string;
  technicalNotes?: string;
  computedProperties?: ComputedProperties;
  documents?: ProductDocument[];
  sizes: ProductSize[];
  featured?: boolean;
  /** Real product vial photos (public/products/*). Falls back to the generic icon when absent. */
  images?: ProductImages;
  /**
   * Every batch that has shipped, newest first. The product page shows the
   * first one's lab results near Add to Cart. Vial QR codes don't read
   * this: each batch's code is fixed in src/data/vial-codes.ts.
   */
  batches?: CoaPanel[];
  /** Per-quantity discount tiers, shown under Add to Cart and applied to cart pricing. */
  volumeTiers?: VolumeTier[];
  /** Overrides the note shown next to Add to Cart (by default, that each vial's QR code opens its batch's COAs). */
  infoNote?: string;
  /**
   * Alternate/generic names surfaced ONLY in JSON-LD structured data for
   * search engines — never rendered anywhere on the visible page. Use this
   * (instead of alsoKnownAs, which renders a visible badge list) when a
   * widely-searched generic name shouldn't appear on-page for legal
   * reasons but should still help the page get found.
   */
  seoAlternateNames?: string[];
}
