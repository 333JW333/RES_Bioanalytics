import { NextResponse, type NextRequest } from "next/server";
import { getBatchByCode } from "@/data/products";
import { SITE_URL } from "@/lib/site";

// Short redirect for vial QR codes: ECOPEPS.COM/C/<qrCode> -> that
// batch's hosted Certificate of Analysis. Resolves every batch, not just
// the newest, so older vials keep working. Exists because a QR code
// encoding this short URL prints small enough to scan reliably on a
// 3 mL vial; one encoding the full /coas/... path does not. The
// uppercase /C/ path is sent here by src/proxy.ts.
export async function GET(_req: NextRequest, ctx: RouteContext<"/c/[code]">) {
  const batch = getBatchByCode((await ctx.params).code);
  const destination = `${SITE_URL}${batch ? batch.reportUrl : "/shop"}`;

  return NextResponse.redirect(destination, 307);
}
