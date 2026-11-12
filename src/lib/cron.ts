import { NextResponse, type NextRequest } from "next/server";
import type { ReportPeriod } from "@/lib/email/report-emails";
import { retentionCutoff } from "@/lib/page-views";
import { sendStaffReport, type ReportWindow } from "@/lib/staff-reports";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The scheduled jobs in vercel.json. Only Vercel's scheduler, which sends
 * CRON_SECRET, can call them; a deployment without the secret refuses. Repeated calls are harmless: each
 * summary is sent once (staff_reports), and the cleanup is idempotent.
 */

export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  // Without a secret, only a developer's own machine may run the jobs.
  if (!secret) return process.env.NODE_ENV === "development";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** Sends a staff summary; reports the result, or a 500 so the next run retries it. */
export async function runReport(period: ReportPeriod, window: ReportWindow) {
  try {
    return { report: window.key, result: await sendStaffReport(period, window) };
  } catch (err) {
    console.error(`Staff ${period} summary failed`, err);
    return { report: window.key, error: `${period} summary failed` };
  }
}

/**
 * Deletes page views older than the Privacy Policy's 12-month limit.
 * Returns how many were deleted, or null if it failed (the next day retries).
 */
export async function deleteOldPageViews(admin = createAdminClient(), now = Date.now()): Promise<number | null> {
  const { error, count } = await admin
    .from("page_views")
    .delete({ count: "exact" })
    .lt("viewed_at", retentionCutoff(now));
  if (error) {
    console.error("Deleting old page views failed", error.message);
    return null;
  }
  return count ?? 0;
}
