import type { Metadata } from "next";
import Link from "next/link";
import { mountainTime } from "@/lib/email/account-emails";
import { daysBetween, loadBacklog, mountainDate, waitingLabel, type BacklogItem } from "@/lib/progress/backlog";
import {
  BACKLOG_URL,
  CLAUDE_SESSION_URL,
  RUNBOOK_URL,
  listReports,
  longDate,
  statValue,
  type SavedReport,
} from "@/lib/progress/reports";
import { requireStaff } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import StaffTwoStep from "../StaffTwoStep";

export const metadata: Metadata = { title: { absolute: "Progress | Staff | EcoPeps" } };

/** A task that has sat this many days is marked, as in the emails. */
const STALE_DAYS = 3;

export default async function StaffProgressPage() {
  // Checked here, before any data loads: the layout's check doesn't stop the
  // page rendering alongside it.
  const staff = await requireStaff();
  if (!staff.twoStepVerified) return <StaffTwoStep returnTo="/admin/progress" />;

  const [backlog, reports] = await Promise.all([loadBacklog(), listReports(createAdminClient())]);
  const today = mountainDate();
  const latestDaily = reports?.find((r) => r.kind === "daily") ?? null;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-navy">Progress</h2>
          <p className="mt-1 max-w-2xl text-sm text-brand-slate">
            What&apos;s been done on the site, what&apos;s next, and what&apos;s waiting on a decision. The same
            information is emailed to support@ecopeps.com every night and every Saturday morning.
          </p>
        </div>
        <a href={CLAUDE_SESSION_URL} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
          Open the Claude session
        </a>
      </div>

      {latestDaily && <ThisWeek report={latestDaily} />}

      {!backlog ? (
        <p className="card mt-8 px-5 py-6 text-sm text-red-700">Couldn&apos;t load the backlog. Refresh to try again.</p>
      ) : (
        <>
          <section className="mt-10">
            <SectionHeading title="Needs your decision" count={backlog.decisions.length} />
            {backlog.decisions.length ? (
              <ul className="mt-3 space-y-3">
                {backlog.decisions.map((item) => (
                  <li key={item.text} className="rounded-md border-l-4 border-amber-600 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-semibold text-brand-navy">{item.text}</p>
                    {waitingLabel(item.added, today) && (
                      <p className="mt-2">
                        <Pill tone="amber">{waitingLabel(item.added, today)}</Pill>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Nothing is waiting on a decision.</Empty>
            )}
          </section>

          <section className="mt-10">
            <SectionHeading title="Up next" count={backlog.upNext.length} />
            {backlog.upNext.length ? (
              <ol className="card mt-3 divide-y divide-brand-line">
                {backlog.upNext.map((item, i) => (
                  <Task key={item.text} item={item} position={i + 1} today={today} />
                ))}
              </ol>
            ) : (
              <Empty>The list is empty. Tell Claude what to add.</Empty>
            )}
          </section>

          {backlog.later.length > 0 && (
            <section className="mt-10">
              <SectionHeading title="Later" count={backlog.later.length} />
              <ol className="card mt-3 divide-y divide-brand-line">
                {backlog.later.map((item, i) => (
                  <Task key={item.text} item={item} position={i + 1} today={today} muted />
                ))}
              </ol>
            </section>
          )}

          {backlog.done.length > 0 && (
            <section className="mt-10">
              <SectionHeading title="Done outside the code" count={backlog.done.length} />
              <ul className="card mt-3 divide-y divide-brand-line">
                {backlog.done.map((item) => (
                  <li key={`${item.date}${item.text}`} className="flex gap-4 px-5 py-3 text-sm">
                    <span className="shrink-0 text-brand-slate-light">{longDate(item.date)}</span>
                    <span className="text-brand-navy">{item.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section className="mt-10">
        <SectionHeading title="Past reports" count={reports?.length ?? 0} />
        {!reports ? (
          <p className="card mt-3 px-5 py-6 text-sm text-red-700">Couldn&apos;t load the reports. Refresh to try again.</p>
        ) : reports.length ? (
          <ul className="card mt-3 divide-y divide-brand-line">
            {reports.map((report) => (
              <li key={`${report.kind}${report.date}`}>
                <Link
                  href={`/admin/progress/${report.kind}/${report.date}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm transition-colors hover:bg-brand-ice"
                >
                  <span className="w-36 shrink-0 font-medium text-brand-navy">{longDate(report.date)}</span>
                  <Pill tone={report.kind === "weekly" ? "navy" : "teal"}>{report.kind}</Pill>
                  <span className="min-w-0 flex-1 text-brand-slate">{report.data.summary}</span>
                  <span className="shrink-0 text-xs text-brand-slate-light">
                    {statValue(report.data, "Shipped") ?? "0"} shipped
                    {report.data.problems?.length ? ` · ${report.data.problems.length} to look at` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No reports yet. The first one arrives tonight at about 8:30 p.m. Mountain Time.</Empty>
        )}
      </section>

      <section className="card mt-10 p-5">
        <h2 className="font-semibold text-brand-navy">How this works</h2>
        <ul className="mt-2 space-y-1 text-sm text-brand-slate">
          <li>
            <strong className="text-brand-navy">To add a task or answer a decision:</strong> open the Claude session
            and say so. Claude updates the backlog, and this page follows once the change is deployed.
          </li>
          <li>
            <strong className="text-brand-navy">Daily report:</strong> every night at about 8:30 p.m. Mountain Time.
          </li>
          <li>
            <strong className="text-brand-navy">Weekly report:</strong> Saturday at about 6:30 a.m., covering
            Saturday through Friday night.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={BACKLOG_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
            Backlog file
          </a>
          <a href={RUNBOOK_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
            How the reports are built
          </a>
        </div>
      </section>
    </>
  );
}

/** The week's chart and active-days count, from the latest daily report. */
function ThisWeek({ report }: { report: SavedReport }) {
  const { activeDays, chart } = report.data;
  if (!activeDays && !chart) return null;
  const max = Math.max(1, ...(chart?.days ?? []).map((d) => d.count ?? 0));
  return (
    <section className="card mt-8 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-brand-navy">This week</h2>
        <p className="text-xs text-brand-slate-light">As of the last daily report, {mountainTime(report.sentAt)}</p>
      </div>
      {activeDays && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-brand-navy">
            <strong>
              {activeDays.done} of {activeDays.goal}
            </strong>{" "}
            active days{activeDays.done >= activeDays.goal ? ": goal met" : ""}
          </p>
          <p aria-hidden="true" className="flex gap-1.5">
            {Array.from({ length: Math.max(activeDays.goal, activeDays.done) }, (_, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full border ${
                  i < activeDays.done ? "border-brand-teal-dark bg-brand-teal-dark" : "border-brand-slate-light bg-white"
                }`}
              />
            ))}
          </p>
        </div>
      )}
      {chart && (
        <div className="mt-5 flex items-end gap-2" role="img" aria-label={`Items shipped each day. ${chart.right ?? ""}`}>
          {chart.days.map((day, i) => (
            <div key={day.label} className="flex flex-1 flex-col items-center">
              <span className="text-xs font-semibold text-brand-navy">{day.count ?? " "}</span>
              <span
                className={`mt-1 w-full rounded-t ${
                  day.count ? (i === chart.today ? "bg-brand-teal-dark" : "bg-brand-teal-dark/50") : "bg-brand-line"
                }`}
                style={{ height: `${Math.max(3, Math.round(((day.count ?? 0) / max) * 48))}px` }}
              />
              <span
                className={`mt-1 w-full border-t-2 pt-1 text-center text-xs ${
                  i === chart.today ? "border-brand-navy font-semibold text-brand-navy" : "border-brand-line text-brand-slate-light"
                }`}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Task({ item, position, today, muted }: { item: BacklogItem; position: number; today: string; muted?: boolean }) {
  const days = daysBetween(item.added, today);
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          muted || position > 3 ? "border border-brand-slate-light text-brand-slate" : "bg-brand-navy text-white"
        }`}
      >
        {position}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-brand-navy">{item.text}</p>
        {days !== null && days >= STALE_DAYS && (
          <p className="mt-1.5">
            <Pill tone="red">On the list {days} days</Pill>
          </p>
        )}
      </div>
      {item.owner && <Pill tone={item.owner === "claude" ? "teal" : "amber"}>{item.owner === "claude" ? "Claude" : "You"}</Pill>}
    </li>
  );
}

const PILL = {
  amber: "bg-amber-100 text-amber-800",
  teal: "bg-teal-100 text-teal-800",
  red: "bg-red-100 text-red-800",
  navy: "bg-slate-200 text-slate-700",
} as const;

function Pill({ tone, children }: { tone: keyof typeof PILL; children: React.ReactNode }) {
  return (
    <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PILL[tone]}`}>
      {children}
    </span>
  );
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
      {count > 0 && <p className="text-xs text-brand-slate-light">{count}</p>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="card mt-3 px-5 py-6 text-sm text-brand-slate">{children}</p>;
}
