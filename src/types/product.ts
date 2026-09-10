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
}
