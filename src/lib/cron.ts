import { NextResponse, type NextRequest } from "next/server";
import type { ReportPeriod } from "@/lib/email/report-emails";
import { sendStaffReport, type ReportWindow } from "@/lib/staff-reports";

/**
 * Runs a staff summary for Vercel's scheduler (vercel.json). With CRON_SECRET
 * set in Vercel, only Vercel's scheduler can call these routes. Repeated
 * calls are harmless: each summary is sent once (staff_reports).
 */
export async function runScheduledReport(
  req: NextRequest,
  period: ReportPeriod,
  window: ReportWindow
): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendStaffReport(period, window);
    return NextResponse.json({ result, report: window.key });
  } catch (err) {
    console.error(`Staff ${period} summary failed`, err);
    // A failed run isn't recorded as sent, so the next call retries it.
    return NextResponse.json({ error: `${period} summary failed` }, { status: 500 });
  }
}
