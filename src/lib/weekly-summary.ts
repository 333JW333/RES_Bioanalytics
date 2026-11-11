import { getProductBySlug } from "@/data/products";
import { supabaseDashboardUrl } from "@/lib/account-notifications";
import { staffWeeklySummaryEmail, type WeeklySummaryData } from "@/lib/email/report-emails";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The weekly summary emailed to support@ecopeps.com: sales, shipping, new
 * accounts, traffic and restock demand. Sent Monday mornings by the
 * scheduled job in vercel.json (src/app/(store)/api/cron/weekly-summary),
 * or on demand from the staff Overview page.
 */

/** Weeks run Monday to Monday, midnight Mountain Time. */
export const REPORT_TIME_ZONE = "America/Denver";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface ReportWindow {
  since: Date;
  until: Date;
  /** Recorded in staff_reports so the same report isn't sent twice. */
  key: string;
  label: string;
}

/** The last full Monday-to-Sunday week before `now`, in Mountain Time. */
export function lastFullWeek(now = new Date()): ReportWindow {
  const today = startOfDay(now);
  const daysSinceMonday = (localDate(today).weekday + 6) % 7;
  // Noon on the day in question, so a daylight-saving change can't push it onto another day.
  const until = startOfDay(new Date(today.getTime() - daysSinceMonday * DAY_MS + 12 * HOUR_MS));
  const since = startOfDay(new Date(until.getTime() - 7 * DAY_MS + 12 * HOUR_MS));
  const lastDay = new Date(until.getTime() - 12 * HOUR_MS);
  return { since, until, key: `weekly:${localDate(until).iso}`, label: rangeLabel(since, lastDay) };
}

/** The 7 days up to `now`, for a summary sent by hand. */
export function last7Days(now = new Date()): ReportWindow {
  const since = new Date(now.getTime() - 7 * DAY_MS);
  // Keyed to the minute, so a double-click sends one email.
  return { since, until: now, key: `manual:${now.toISOString().slice(0, 16)}`, label: `${rangeLabel(since, now)} (last 7 days)` };
}

export type WeeklySummaryResult = "sent" | "already_sent" | "email_off";

export async function sendWeeklySummary(
  window: ReportWindow,
  admin = createAdminClient()
): Promise<WeeklySummaryResult> {
  if (!isEmailConfigured()) return "email_off";

  const { error: claimError } = await admin.from("staff_reports").insert({ id: window.key });
  if (claimError?.code === "23505") return "already_sent";
  if (claimError) throw new Error(`Could not record ${window.key}: ${claimError.message}`);

  try {
    const { data, error } = await admin.rpc("weekly_summary", {
      p_since: window.since.toISOString(),
      p_until: window.until.toISOString(),
    });
    if (error) throw new Error(`weekly_summary failed: ${error.message}`);
    await sendEmail(staffWeeklySummaryEmail(toSummaryData(data as RawSummary, window.label), supabaseDashboardUrl()));
    return "sent";
  } catch (err) {
    // Un-record it so the next run tries again.
    await admin.from("staff_reports").delete().eq("id", window.key);
    throw err;
  }
}

/** What public.weekly_summary() returns. */
export interface RawSummary {
  accounts_total: number;
  new_accounts: { email: string; name: string | null; business_type: string | null; confirmed: boolean }[];
  paid_orders: number;
  revenue_cents: number;
  invoice_requests: number;
  unpaid_checkouts: number;
  shipped: number;
  awaiting_shipment: number;
  refunded: number;
  disputed: number;
  page_views: number;
  top_products: { slug: string; views: number; signed_in_viewers: number }[];
  countries: { country: string; views: number }[];
  restock_waiting: { slug: string; waiting: number }[];
}

export function toSummaryData(raw: RawSummary, label: string): WeeklySummaryData {
  const productName = (slug: string) => getProductBySlug(slug)?.name ?? slug;
  return {
    label,
    accountsTotal: Number(raw.accounts_total),
    newAccounts: raw.new_accounts.map((a) => ({
      email: a.email,
      name: a.name,
      businessType: a.business_type,
      confirmed: a.confirmed,
    })),
    paidOrders: Number(raw.paid_orders),
    revenueCents: Number(raw.revenue_cents),
    invoiceRequests: Number(raw.invoice_requests),
    unpaidCheckouts: Number(raw.unpaid_checkouts),
    shipped: Number(raw.shipped),
    awaitingShipment: Number(raw.awaiting_shipment),
    refunded: Number(raw.refunded),
    disputed: Number(raw.disputed),
    pageViews: Number(raw.page_views),
    topProducts: raw.top_products.map((p) => ({
      name: productName(p.slug),
      views: Number(p.views),
      signedInViewers: Number(p.signed_in_viewers),
    })),
    countries: raw.countries.map((c) => ({ name: countryName(c.country), views: Number(c.views) })),
    restockWaiting: raw.restock_waiting.map((r) => ({ name: productName(r.slug), waiting: Number(r.waiting) })),
  };
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "Unknown";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

// ---- Mountain Time dates ---------------------------------------------------------

const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: REPORT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The calendar date and time of day at `at`, in Mountain Time. */
function localDate(at: Date) {
  const p = Object.fromEntries(partsFormat.formatToParts(at).map((x) => [x.type, x.value]));
  const [y, m, d] = [Number(p.year), Number(p.month), Number(p.day)];
  return {
    y,
    m,
    d,
    weekday: WEEKDAYS.indexOf(p.weekday),
    iso: `${p.year}-${p.month}-${p.day}`,
    /** The same wall-clock time, read as if it were UTC. */
    wallAsUtc: Date.UTC(y, m - 1, d, Number(p.hour), Number(p.minute), Number(p.second)),
  };
}

/** Midnight Mountain Time on the day `at` falls on. */
export function startOfDay(at: Date): Date {
  const local = localDate(at);
  const midnightAsUtc = Date.UTC(local.y, local.m - 1, local.d);
  // Mountain Time's offset from UTC at that moment (-6h or -7h).
  const offset = local.wallAsUtc - at.getTime();
  const guess = midnightAsUtc - offset;
  // If daylight saving changed between midnight and `at`, use midnight's own offset.
  const offsetAtGuess = localDate(new Date(guess)).wallAsUtc - guess;
  return new Date(midnightAsUtc - offsetAtGuess);
}

const dayFormat = new Intl.DateTimeFormat("en-US", { timeZone: REPORT_TIME_ZONE, month: "short", day: "numeric" });
const yearFormat = new Intl.DateTimeFormat("en-US", { timeZone: REPORT_TIME_ZONE, year: "numeric" });

/** e.g. "Nov 3 – Nov 9, 2026" */
function rangeLabel(from: Date, to: Date): string {
  return `${dayFormat.format(from)} – ${dayFormat.format(to)}, ${yearFormat.format(to)}`;
}
