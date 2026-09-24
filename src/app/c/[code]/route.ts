import { NextResponse, type NextRequest } from "next/server";
import { getAllProducts } from "@/data/products";
import { SITE_URL } from "@/lib/site";

// Short redirect for vial QR codes: ECOPEPS.COM/C/<qrCode> -> that
// batch's hosted Certificate of Analysis. Exists because a QR code
// encoding this short URL prints small enough to scan reliably on a
// 3 mL vial; one encoding the full /coas/... path does not. The
// uppercase /C/ path is sent here by src/proxy.ts.
export async function GET(_req: NextRequest, ctx: RouteContext<"/c/[code]">) {
  const code = (await ctx.params).code.toLowerCase();
  const product = getAllProducts().find((p) =>
    [p.coaPanel?.qrCode, p.coaPanel?.batchCode].some(
      (c) => c?.toLowerCase() === code
    )
  );

  const destination = product?.coaPanel
    ? `${SITE_URL}${product.coaPanel.reportUrl}`
    : `${SITE_URL}/shop`;

  return NextResponse.redirect(destination, 307);
}
