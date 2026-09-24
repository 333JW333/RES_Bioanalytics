import { NextResponse, type NextRequest } from "next/server";
import { getVialCoa } from "@/data/vial-codes";
import { SITE_URL } from "@/lib/site";

// Short redirect for vial QR codes: ECOPEPS.COM/C/<code> -> that batch's
// hosted Certificate of Analysis, as fixed in src/data/vial-codes.ts, so
// an older batch's vials never open a newer batch's COA. Exists because a
// QR code encoding this short URL prints small enough to scan reliably on
// a 3 mL vial; one encoding the full /coas/... path does not. The
// uppercase /C/ path is sent here by src/proxy.ts.
export async function GET(_req: NextRequest, ctx: RouteContext<"/c/[code]">) {
  const coa = getVialCoa((await ctx.params).code);
  const destination = `${SITE_URL}${coa ?? "/shop"}`;

  return NextResponse.redirect(destination, 307);
}
