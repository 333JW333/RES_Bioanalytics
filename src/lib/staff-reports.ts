import { getProductBySlug } from "@/data/products";
import { supabaseDashboardUrl } from "@/lib/account-notifications";
import { staffActivityEmail, type ActivityData, type ReportPeriod } from "@/lib/email/report-emails";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import { formatOrderRef, type OrderStatus } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The staff summary emails to support@ecopeps.com:
 * - daily at 5 p.m. Mountain Time: everything new since 5 p.m. the day before;
 * - weekly on Monday morning: the Monday-to-Sunday week before.
 * Sent by the scheduled jobs in vercel.json (src/app/(store)/api/cron/*), or
 * on demand from the staff Overview page.
 */

export const REPORT_TIME_ZONE = "America/Denver";

/** The daily email covers the 24 hours up to this hour, Mountain Time. */
export const DAILY_HOUR = 17;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export interface ReportWindow {
  since: Date;
  until: Date;
  /** Recorded in staff_reports so the same report isn't sent twice. */
  key: string;
  /** Short, for the subject line, e.g. "Nov 11" or "Nov 9 – Nov 15, 2026". */
  label: string;
  /** The exact period, shown in the email. */
  range: string;
}

/** The daily window ending at the most recent 5 p.m. Mountain Time. */
export function lastDay(now = new Date()): ReportWindow {
  const today = localDate(now);
  let until = zonedTime(today.y, today.m, today.d, DAILY_HOUR);
  if (now < until) until = zonedTime(...previousDay(today), DAILY_HOUR);
  const untilDay = localDate(until);
  const since = zonedTime(...previousDay(untilDay), DAILY_HOUR);
  return {
    since,
    until,
    key: `daily:${untilDay.iso}`,
    label: dayFormat.format(until),
    range: `${dayTimeFormat.format(since)} – ${dayTimeFormat.format(until)} MT`,
  };
}

/** The last full Monday-to-Sunday week before `now`, in Mountain Time. */
export function lastFullWeek(now = new Date()): ReportWindow {
  const today = localDate(now);
  const daysSinceMonday = (today.weekday + 6) % 7;
  const monday = localDate(new Date(zonedTime(today.y, today.m, today.d, 12).getTime() - daysSinceMonday * DAY_MS));
  const until = zonedTime(monday.y, monday.m, monday.d, 0);
  const prevMonday = localDate(new Date(zonedTime(monday.y, monday.m, monday.d, 12).getTime() - 7 * DAY_MS));
  const since = zonedTime(prevMonday.y, prevMonday.m, prevMonday.d, 0);
  const label = rangeLabel(since, new Date(until.getTime() - 12 * HOUR_MS));
  return { since, until, key: `weekly:${monday.iso}`, label, range: `${label} (Mountain Time)` };
}

/** The 24 hours or 7 days up to `now`, for a summary sent by hand. */
export function lastHours(period: ReportPeriod, now = new Date()): ReportWindow {
  const since = new Date(now.getTime() - (period === "daily" ? DAY_MS : 7 * DAY_MS));
  const range = `${dayTimeFormat.format(since)} – ${dayTimeFormat.format(now)} MT`;
  return {
    since,
    until: now,
    // Keyed to the minute, so a double-click sends one email.
    key: `manual-${period}:${now.toISOString().slice(0, 16)}`,
    label: period === "daily" ? "the last 24 hours" : "the last 7 days",
    range,
  };
}

export type ReportResult = "sent" | "already_sent" | "email_off";

export async function sendStaffReport(
  period: ReportPeriod,
  window: ReportWindow,
  admin = createAdminClient()
): Promise<ReportResult> {
  if (!isEmailConfigured()) return "email_off";

  const { error: claimError } = await admin.from("staff_reports").insert({ id: window.key });
  if (claimError?.code === "23505") return "already_sent";
  if (claimError) throw new Error(`Could not record ${window.key}: ${claimError.message}`);

  try {
    const data = await loadActivity(window, admin);
    await sendEmail(staffActivityEmail(data, period, supabaseDashboardUrl()));
    return "sent";
  } catch (err) {
    // Un-record it so the next run tries again.
    await admin.from("staff_reports").delete().eq("id", window.key);
    throw err;
  }
}

export async function loadActivity(window: ReportWindow, admin = createAdminClient()): Promise<ActivityData> {
  const { data, error } = await admin.rpc("activity_summary", {
    p_since: window.since.toISOString(),
    p_until: window.until.toISOString(),
  });
  if (error) throw new Error(`activity_summary failed: ${error.message}`);
  return toActivityData(data as RawActivity, window);
}

/** What public.activity_summary() returns. */
export interface RawActivity {
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
  orders: {
    id: string;
    email: string;
    amount_cents: number;
    status: OrderStatus;
    payment_flow: "checkout" | "invoice";
    shipped_at: string | null;
  }[];
  restock_requests: { email: string; slug: string }[];
  inquiries: { email: string; name: string | null; subject: string }[];
  profile_changes?: { email: string; field: string; old_value: string | null; new_value: string | null }[];
}

export function toActivityData(raw: RawActivity, window: Pick<ReportWindow, "label" | "range">): ActivityData {
  const productName = (slug: string) => getProductBySlug(slug)?.name ?? slug;
  // Page views come from /api/track, which anyone can call with any path, so
  // only catalog products are listed: otherwise an outsider could put their
  // own text (say, a fake "verify your account at ..." link) into the staff
  // emails and Overview page as a "product".
  const inCatalog = (r: { slug: string }) => getProductBySlug(r.slug) !== undefined;
  return {
    label: window.label,
    range: window.range,
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
    topProducts: raw.top_products.filter(inCatalog).map((p) => ({
      name: productName(p.slug),
      views: Number(p.views),
      signedInViewers: Number(p.signed_in_viewers),
    })),
    countries: raw.countries.map((c) => ({ name: countryName(c.country), views: Number(c.views) })),
    restockWaiting: raw.restock_waiting.filter(inCatalog).map((r) => ({ name: productName(r.slug), waiting: Number(r.waiting) })),
    orders: (raw.orders ?? []).map((o) => ({
      ref: formatOrderRef(o.id),
      email: o.email,
      amountCents: Number(o.amount_cents),
      status: o.status,
      paymentFlow: o.payment_flow,
      shipped: Boolean(o.shipped_at),
    })),
    restockRequests: (raw.restock_requests ?? []).filter(inCatalog).map((r) => ({ email: r.email, product: productName(r.slug) })),
    inquiries: raw.inquiries ?? [],
    profileChanges: (raw.profile_changes ?? []).map((c) => ({
      email: c.email,
      field: c.field,
      oldValue: c.old_value,
      newValue: c.new_value,
    })),
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

interface LocalDate {
  y: number;
  m: number;
  d: number;
  weekday: number;
  iso: string;
  /** The same wall-clock time, read as if it were UTC. */
  wallAsUtc: number;
}

/** The calendar date and time of day at `at`, in Mountain Time. */
function localDate(at: Date): LocalDate {
  const p = Object.fromEntries(partsFormat.formatToParts(at).map((x) => [x.type, x.value]));
  const [y, m, d] = [Number(p.year), Number(p.month), Number(p.day)];
  return {
    y,
    m,
    d,
    weekday: WEEKDAYS.indexOf(p.weekday),
    iso: `${p.year}-${p.month}-${p.day}`,
    wallAsUtc: Date.UTC(y, m - 1, d, Number(p.hour), Number(p.minute), Number(p.second)),
  };
}

/** Mountain Time's offset from UTC at that moment (-6h or -7h). */
const offsetAt = (t: number) => localDate(new Date(t)).wallAsUtc - t;

/** The moment it is `hour`:00 Mountain Time on a calendar date. */
export function zonedTime(y: number, m: number, d: number, hour: number): Date {
  const asUtc = Date.UTC(y, m - 1, d, hour);
  const guess = asUtc - offsetAt(asUtc);
  // Daylight saving can change between the guess and the answer; use the offset in force then.
  return new Date(asUtc - offsetAt(guess));
}

/** Midnight Mountain Time on the day `at` falls on. */
export function startOfDay(at: Date): Date {
  const local = localDate(at);
  return zonedTime(local.y, local.m, local.d, 0);
}

function previousDay(day: LocalDate): [number, number, number] {
  const prev = localDate(new Date(zonedTime(day.y, day.m, day.d, 12).getTime() - DAY_MS));
  return [prev.y, prev.m, prev.d];
}

const dayFormat = new Intl.DateTimeFormat("en-US", { timeZone: REPORT_TIME_ZONE, month: "short", day: "numeric" });
const yearFormat = new Intl.DateTimeFormat("en-US", { timeZone: REPORT_TIME_ZONE, year: "numeric" });
const dayTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: REPORT_TIME_ZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** e.g. "Nov 3 – Nov 9, 2026" */
function rangeLabel(from: Date, to: Date): string {
  return `${dayFormat.format(from)} – ${dayFormat.format(to)}, ${yearFormat.format(to)}`;
}
