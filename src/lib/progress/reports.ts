import type { SupabaseClient } from "@supabase/supabase-js";
import { renderReport } from "../../../scripts/progress-report/render.mjs";

/**
 * The saved daily and weekly progress reports (table progress_reports), for
 * Staff -> Progress. Each row holds the report's data file; the email is
 * rebuilt from it with the same code that built the one that was sent.
 */

export type ReportKind = "daily" | "weekly";

/** The conversation with Claude that writes the reports and takes new tasks. */
export const CLAUDE_SESSION_URL = "https://claude.ai/code/session_01PTzKkutj1ajmADLeaS4mry";
export const BACKLOG_URL = "https://github.com/333JW333/RES_Bioanalytics/blob/main/docs/BACKLOG.md";
export const RUNBOOK_URL = "https://github.com/333JW333/RES_Bioanalytics/blob/main/docs/PROGRESS_REPORTS.md";

export interface ReportData {
  kind: ReportKind;
  subject: string;
  title: string;
  summary: string;
  stats?: { value: string | number; label: string }[];
  activeDays?: { done: number; goal: number };
  chart?: { right?: string; today?: number; days: { label: string; count: number | null }[] };
  problems?: { title: string; detail?: string }[];
  [key: string]: unknown;
}

export interface SavedReport {
  kind: ReportKind;
  /** YYYY-MM-DD. */
  date: string;
  sentAt: string;
  data: ReportData;
}

interface Row {
  kind: ReportKind;
  report_date: string;
  sent_at: string;
  data: ReportData;
}

const toReport = (row: Row): SavedReport => ({ kind: row.kind, date: row.report_date, sentAt: row.sent_at, data: row.data });

export const isReportKind = (value: string): value is ReportKind => value === "daily" || value === "weekly";
export const isReportDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

/** Newest first. Null if the query failed, so the page can say so. */
export async function listReports(admin: SupabaseClient, limit = 60): Promise<SavedReport[] | null> {
  const { data, error } = await admin
    .from("progress_reports")
    .select("kind, report_date, sent_at, data")
    .order("report_date", { ascending: false })
    .order("kind", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Progress reports query failed", error.message);
    return null;
  }
  return ((data ?? []) as Row[]).map(toReport);
}

export async function getReport(admin: SupabaseClient, kind: ReportKind, date: string): Promise<SavedReport | null> {
  const { data, error } = await admin
    .from("progress_reports")
    .select("kind, report_date, sent_at, data")
    .eq("kind", kind)
    .eq("report_date", date)
    .maybeSingle();
  if (error) console.error("Progress report query failed", error.message);
  return data ? toReport(data as Row) : null;
}

/** The figure under a label like "Shipped" in the report's headline numbers. */
export function statValue(data: ReportData, label: string): string | null {
  const stat = data.stats?.find((s) => s.label.toLowerCase() === label.toLowerCase());
  return stat ? String(stat.value) : null;
}

/**
 * The report as the email that was sent, for showing in a frame. Links open
 * in a new tab. Null if the saved data can't be turned into a report.
 */
export function reportHtml(data: ReportData): string | null {
  try {
    return renderReport(data).html.replace("<head>", '<head><base target="_blank">');
  } catch (error) {
    console.error("Couldn't render a saved progress report", error instanceof Error ? error.message : error);
    return null;
  }
}

/** "Wed, Nov 11, 2026" from YYYY-MM-DD. */
export function longDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
