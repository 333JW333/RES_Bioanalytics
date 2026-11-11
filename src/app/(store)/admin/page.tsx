import type { Metadata } from "next";
import Link from "next/link";
import AdminNotice from "@/components/AdminNotice";
import { supabaseDashboardUrl } from "@/lib/account-notifications";
import { mountainTime } from "@/lib/email/account-emails";
import { formatUSD } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { lastHours, loadActivity, type ReportWindow } from "@/lib/staff-reports";
import { sendSummaryNow } from "./actions";

export const metadata: Metadata = { title: { absolute: "Overview | Staff | EcoPeps" } };

const NOTICES: Record<string, { tone: "good" | "bad"; text: string }> = {
  summary_sent: { tone: "good", text: "The summary is on its way to support@ecopeps.com." },
  summary_already_sent: { tone: "good", text: "That summary was just sent." },
  summary_email_off: { tone: "bad", text: "Email isn't set up (RESEND_API_KEY), so nothing was sent." },
  summary_failed: { tone: "bad", text: "The summary didn't send. Please try again in a minute." },
};

export default async function StaffOverviewPage(props: PageProps<"/admin">) {
  const { notice } = await props.searchParams;
  const admin = createAdminClient();
  const window = lastHours("weekly");

  const [s, lastDaily, lastWeekly] = await Promise.all([
    loadOrNull(window, admin),
    lastSent(admin, "daily:"),
    lastSent(admin, "weekly:"),
  ]);
  const dashboard = supabaseDashboardUrl();

  return (
    <>
      <AdminNotice notice={typeof notice === "string" ? (NOTICES[notice] ?? null) : null} />

      <h2 className="text-xl font-semibold text-brand-navy">Last 7 days</h2>
      {!s ? (
        <p className="card mt-4 px-5 py-6 text-sm text-red-700">Couldn&apos;t load the numbers. Refresh to try again.</p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Ready to ship" value={s.awaitingShipment} href="/admin/orders" highlight={s.awaitingShipment > 0} />
            <Stat label="Paid orders" value={s.paidOrders} detail={formatUSD(s.revenueCents / 100)} />
            <Stat label="New accounts" value={s.newAccounts.length} detail={`${s.accountsTotal} in total`} />
            <Stat
              label="Waiting for a restock"
              value={s.restockWaiting.reduce((n, r) => n + r.waiting, 0)}
              href="/admin/restock"
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Panel title="Orders">
              <Rows
                rows={[
                  ["Invoice requests", s.invoiceRequests],
                  ["Checkouts started, not paid", s.unpaidCheckouts],
                  ["Shipped", s.shipped],
                  ["Refunded", s.refunded],
                  ["Disputed", s.disputed],
                ]}
              />
            </Panel>
            <Panel title={`Site traffic: ${s.pageViews.toLocaleString("en-US")} page views`}>
              {s.topProducts.length ? (
                <Rows rows={s.topProducts.map((p) => [p.name, `${p.views} views`])} />
              ) : (
                <p className="text-sm text-brand-slate-light">No product views yet.</p>
              )}
              {s.countries.length > 0 && (
                <p className="mt-3 text-xs text-brand-slate-light">
                  {s.countries.map((c) => `${c.name} ${c.views}`).join(" · ")}
                </p>
              )}
            </Panel>
            <Panel title="New accounts">
              {s.newAccounts.length ? (
                <ul className="space-y-2 text-sm">
                  {s.newAccounts.map((a) => (
                    <li key={a.email}>
                      <span className="text-brand-navy">{a.email}</span>
                      <span className="block text-xs text-brand-slate-light">
                        {[a.name, a.businessType, a.confirmed ? null : "email not confirmed"].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-brand-slate-light">None this week.</p>
              )}
            </Panel>
            <Panel title="Waiting for a restock">
              {s.restockWaiting.length ? (
                <Rows rows={s.restockWaiting.map((r) => [r.name, `${r.waiting} waiting`])} />
              ) : (
                <p className="text-sm text-brand-slate-light">Nobody is waiting.</p>
              )}
            </Panel>
          </div>
        </>
      )}

      <section className="card mt-10 p-5">
        <h2 className="font-semibold text-brand-navy">Summary emails to support@ecopeps.com</h2>
        <ul className="mt-2 space-y-1 text-sm text-brand-slate">
          <li>
            <strong className="text-brand-navy">Daily, 5 p.m. Mountain Time:</strong> everything new since 5 p.m.
            the day before.{lastDaily ? ` Last sent ${mountainTime(lastDaily)}.` : ""}
          </li>
          <li>
            <strong className="text-brand-navy">Weekly, Monday morning:</strong> the week before, Monday to Sunday.
            {lastWeekly ? ` Last sent ${mountainTime(lastWeekly)}.` : ""}
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={sendSummaryNow}>
            <input type="hidden" name="period" value="daily" />
            <button type="submit" className="btn-secondary text-sm">
              Email the last 24 hours now
            </button>
          </form>
          <form action={sendSummaryNow}>
            <input type="hidden" name="period" value="weekly" />
            <button type="submit" className="btn-secondary text-sm">
              Email the last 7 days now
            </button>
          </form>
        </div>
      </section>

      {dashboard && (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold text-brand-navy">Everything per customer</h2>
          <p className="mt-1 text-sm text-brand-slate">
            In Supabase&apos;s Table Editor, the &quot;staff&quot; schema has customer_activity (one row per account)
            and customer_timeline (everything each person has done; filter by email).
          </p>
          <a
            href={`${dashboard}/editor?schema=staff`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-4 inline-block text-sm"
          >
            Open Supabase
          </a>
        </section>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  detail,
  href,
  highlight,
}: {
  label: string;
  value: number;
  detail?: string;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <>
      <p className="text-xs font-medium text-brand-slate-light">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${highlight ? "text-brand-teal-dark" : "text-brand-navy"}`}>
        {value.toLocaleString("en-US")}
      </p>
      {detail && <p className="text-xs text-brand-slate">{detail}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition-colors hover:border-brand-teal">
      {body}
    </Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h3 className="mb-3 font-semibold text-brand-navy">{title}</h3>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, string | number][] }) {
  return (
    <dl className="divide-y divide-brand-line text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 py-1.5">
          <dt className="text-brand-slate">{k}</dt>
          <dd className="font-medium text-brand-navy">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

async function loadOrNull(window: ReportWindow, admin: ReturnType<typeof createAdminClient>) {
  try {
    return await loadActivity(window, admin);
  } catch (err) {
    console.error("Loading the staff overview failed", err);
    return null;
  }
}

/** When the latest scheduled summary of a kind went out. */
async function lastSent(admin: ReturnType<typeof createAdminClient>, prefix: string): Promise<string | null> {
  const { data } = await admin
    .from("staff_reports")
    .select("sent_at")
    .like("id", `${prefix}%`)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ sent_at: string }>();
  return data?.sent_at ?? null;
}
