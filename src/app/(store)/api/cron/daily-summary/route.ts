import { NextResponse, type NextRequest } from "next/server";
import { deleteOldPageViews, isCronAuthorized, runReport, unauthorized } from "@/lib/cron";
import { lastDay } from "@/lib/staff-reports";

/**
 * Daily at 5 p.m. Mountain Time:
 * - emails support@ecopeps.com everything new in the 24 hours before;
 * - deletes page views past the Privacy Policy's 12-month limit.
 * Vercel's schedule is in UTC, so vercel.json calls this at both 23:00 and
 * 00:00 UTC (5 p.m. MDT and MST); the call that lands after 5 p.m. sends
 * the email, and the other finds it already sent.
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return unauthorized();
  const deletedPageViews = await deleteOldPageViews();
  const summary = await runReport("daily", lastDay());
  return NextResponse.json({ ...summary, deletedPageViews }, { status: "error" in summary ? 500 : 200 });
}
