import type { NextRequest } from "next/server";
import { runScheduledReport } from "@/lib/cron";
import { lastFullWeek } from "@/lib/staff-reports";

/** Emails support@ecopeps.com last week's summary. Vercel calls this every Monday morning (vercel.json). */
export async function GET(req: NextRequest) {
  return runScheduledReport(req, "weekly", lastFullWeek());
}
