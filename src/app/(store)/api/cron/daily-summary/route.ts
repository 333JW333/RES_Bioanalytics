import type { NextRequest } from "next/server";
import { runScheduledReport } from "@/lib/cron";
import { lastDay } from "@/lib/staff-reports";

/**
 * Emails support@ecopeps.com everything new in the 24 hours up to 5 p.m.
 * Mountain Time. Vercel's schedule is in UTC, so vercel.json calls this at
 * both 23:00 and 00:00 UTC (5 p.m. MDT and MST); the call that lands after
 * 5 p.m. sends it, and the other finds it already sent.
 */
export async function GET(req: NextRequest) {
  return runScheduledReport(req, "daily", lastDay());
}
