import { NextResponse, type NextRequest } from "next/server";
import { isCronAuthorized, runReport, unauthorized } from "@/lib/cron";
import { lastFullWeek } from "@/lib/staff-reports";

/** Emails support@ecopeps.com last week's summary. Vercel calls this every Monday morning (vercel.json). */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return unauthorized();
  const summary = await runReport("weekly", lastFullWeek());
  return NextResponse.json(summary, { status: "error" in summary ? 500 : 200 });
}
