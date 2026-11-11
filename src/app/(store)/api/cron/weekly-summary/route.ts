import { NextResponse, type NextRequest } from "next/server";
import { lastFullWeek, sendWeeklySummary } from "@/lib/weekly-summary";

/**
 * Emails last week's summary to support@ecopeps.com. Vercel calls this every
 * Monday morning (vercel.json). With CRON_SECRET set in Vercel, only Vercel's
 * scheduler can call it. Repeated calls are harmless: each week's summary
 * is sent once.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendWeeklySummary(lastFullWeek());
    return NextResponse.json({ result });
  } catch (err) {
    console.error("Weekly summary failed", err);
    // A failed run isn't recorded as sent, so calling again retries it.
    return NextResponse.json({ error: "Weekly summary failed" }, { status: 500 });
  }
}
