/**
 * Sample lot / COA records for the public verification library.
 * Replace with real lab-issued lot data before launch. Each entry mirrors
 * the Peptidology-style evidence fields: lot, product, size, purity, lab,
 * methods, test date, quantity, and inventory status.
 */
export type LotStatus = "in_stock" | "limited" | "depleted";

export interface LotRecord {
  id: string;
  lotNumber: string;
  productSlug: string;
  productName: string;
  sizeLabel: string;
  purity: string;
  testDate: string;
  laboratory: string;
  methods: string[];
  quantityMg: number;
  status: LotStatus;
  coaUrl: string;
}

export const lots: LotRecord[] = [
  {
    id: "lot-bpc-2401",
    lotNumber: "EP-BPC-2401",
    productSlug: "bpc-157",
    productName: "BPC-157",
    sizeLabel: "5 mg",
    purity: "99.4%",
    testDate: "2026-08-14",
    laboratory: "Independent HPLC/MS Partner Lab",
    methods: ["HPLC", "MS"],
    quantityMg: 5,
    status: "in_stock",
    coaUrl: "/coas/bpc-157-coa-sample.pdf",
  },
  {
    id: "lot-bpc-2402",
    lotNumber: "EP-BPC-2402",
    productSlug: "bpc-157",
    productName: "BPC-157",
    sizeLabel: "10 mg",
    purity: "99.1%",
    testDate: "2026-09-02",
    laboratory: "Independent HPLC/MS Partner Lab",
    methods: ["HPLC", "MS"],
    quantityMg: 10,
    status: "limited",
    coaUrl: "/coas/bpc-157-coa-sample.pdf",
  },
  {
    id: "lot-tb5-2311",
    lotNumber: "EP-TB5-2311",
    productSlug: "tb-500",
    productName: "TB-500",
    sizeLabel: "5 mg",
    purity: "98.7%",
    testDate: "2026-07-28",
    laboratory: "Independent HPLC/MS Partner Lab",
    methods: ["HPLC", "MS"],
    quantityMg: 5,
    status: "in_stock",
    coaUrl: "/coas/tb-500-coa-sample.pdf",
  },
  {
    id: "lot-ipa-2403",
    lotNumber: "EP-IPA-2403",
    productSlug: "ipamorelin",
    productName: "Ipamorelin",
    sizeLabel: "5 mg",
    purity: "99.2%",
    testDate: "2026-08-30",
    laboratory: "Independent HPLC/MS Partner Lab",
    methods: ["HPLC", "MS"],
    quantityMg: 5,
    status: "in_stock",
    coaUrl: "/coas/ipamorelin-coa-sample.pdf",
  },
  {
    id: "lot-tirz-2401",
    lotNumber: "EP-TIRZ-2401",
    productSlug: "tirzepatide",
    productName: "Tirzepatide",
    sizeLabel: "10 mg",
    purity: "99.0%",
    testDate: "2026-09-05",
    laboratory: "Independent HPLC/MS Partner Lab",
    methods: ["HPLC", "MS"],
    quantityMg: 10,
    status: "limited",
    coaUrl: "/coas/tirzepatide-coa-sample.pdf",
  },
  {
    id: "lot-ghk-2312",
    lotNumber: "EP-GHK-2312",
    productSlug: "ghk-cu",
    productName: "GHK-Cu",
    sizeLabel: "100 mg",
    purity: "99.3%",
    testDate: "2026-06-18",
    laboratory: "Independent HPLC/MS Partner Lab",
    methods: ["HPLC", "MS"],
    quantityMg: 100,
    status: "in_stock",
    coaUrl: "/coas/ghk-cu-coa-sample.pdf",
  },
  {
    id: "lot-ss31-2402",
    lotNumber: "EP-SS31-2402",
    productSlug: "ss-31",
    productName: "SS-31",
    sizeLabel: "10 mg",
    purity: "99.5%",
    testDate: "2026-08-22",
    laboratory: "Independent HPLC/MS Partner Lab",
    methods: ["HPLC", "MS"],
    quantityMg: 10,
    status: "in_stock",
    coaUrl: "/coas/ss-31-coa-sample.pdf",
  },
  {
    id: "lot-tb5-2209",
    lotNumber: "EP-TB5-2209",
    productSlug: "tb-500",
    productName: "TB-500",
    sizeLabel: "10 mg",
    purity: "98.9%",
    testDate: "2026-03-12",
    laboratory: "Independent HPLC/MS Partner Lab",
    methods: ["HPLC", "MS"],
    quantityMg: 10,
    status: "depleted",
    coaUrl: "/coas/tb-500-coa-sample.pdf",
  },
];

export function getAllLots(): LotRecord[] {
  return lots;
}

export function searchLots(query: string): LotRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return lots;
  return lots.filter((lot) => {
    const haystack = [
      lot.lotNumber,
      lot.productName,
      lot.productSlug,
      lot.sizeLabel,
      lot.laboratory,
      lot.purity,
      ...lot.methods,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
