import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/data/products";
import { SITE_URL } from "@/lib/site";

// Short redirect for vial QR codes: ecopeps.com/c/<batchCode> -> that
// batch's hosted Certificate of Analysis. Exists because a QR code
// encoding this short URL prints small enough to scan reliably on a
// 40x20mm vial label; one encoding the full /coas/... path does not.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const product = getAllProducts().find(
    (p) => p.coaPanel?.batchCode?.toLowerCase() === code.toLowerCase()
  );

  const destination = product?.coaPanel
    ? `${SITE_URL}${product.coaPanel.reportUrl}`
    : `${SITE_URL}/shop`;

  return NextResponse.redirect(destination, 307);
}
