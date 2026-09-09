export interface ProductSize {
  label: string;
  mg: number;
  price: number;
  sku: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  synonym?: string;
  category: "Peptide" | "Peptide Blend" | "Research Chemical";
  casNumber?: string;
  sequenceOrFormula?: string;
  purity: string;
  form: string;
  storage: string;
  shortDescription: string;
  description: string;
  researchAreas: string[];
  sizes: ProductSize[];
  featured?: boolean;
}
