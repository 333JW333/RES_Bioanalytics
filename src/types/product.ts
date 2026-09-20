export interface ProductSize {
  label: string;
  mg: number;
  price: number;
  sku: string;
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
}

export interface ProductImages {
  front: string;
  back: string;
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
  lot: string;
  searchCode: string;
  /** Certificate of Analysis PDF hosted on this site. */
  pdfUrl: string;
  /** Official third-party lab page to independently verify this result. */
  verifyUrl: string;
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
  /** Dashboard summary of the most recent lab test, shown near Add to Cart. */
  coaPanel?: CoaPanel;
  /** Per-quantity discount tiers, shown under Add to Cart and applied to cart pricing. */
  volumeTiers?: VolumeTier[];
}
