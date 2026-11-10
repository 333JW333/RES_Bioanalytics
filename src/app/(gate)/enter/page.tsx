import type { Metadata } from "next";
import type { CoaSummary } from "@/components/CoaTestingPanel";
import { products } from "@/data/products";
import { isSoldOut } from "@/lib/pricing";
import { RETURN_TO_PARAM, safeReturnPath } from "@/lib/return-to";
import EnterClient from "./EnterClient";

export const metadata: Metadata = {
  title: "Enter",
  description:
    "Confirm age and research-use eligibility to continue to EcoPeps registration.",
  robots: { index: false, follow: false },
};

/** The in-stock product whose current batch tested highest for purity. */
function highestPurityCoa(): CoaSummary | null {
  let best: CoaSummary | null = null;
  for (const product of products) {
    const batch = product.batches?.[0];
    if (!batch?.batchCode || batch.sampleData || isSoldOut(product)) continue;
    if (!best || batch.purityPercent > best.purityPercent) {
      best = {
        productName: product.name,
        batchCode: batch.batchCode,
        labName: batch.labName,
        purityPercent: batch.purityPercent,
        testedMassMg: batch.testedMassMg,
        labeledMassMg: batch.labeledMassMg,
        tests: batch.tests,
        reportUrl: batch.reportUrl,
      };
    }
  }
  return best;
}

export default async function EnterPage(props: PageProps<"/enter">) {
  const searchParams = await props.searchParams;
  return (
    <EnterClient
      returnTo={safeReturnPath(searchParams[RETURN_TO_PARAM])}
      coa={highestPurityCoa()}
    />
  );
}
