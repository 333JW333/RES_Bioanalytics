import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mountainTime } from "@/lib/email/account-emails";
import { getReport, isReportDate, isReportKind, longDate, reportHtml } from "@/lib/progress/reports";
import { requireStaff } from "@/lib/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import StaffTwoStep from "../../../StaffTwoStep";

export const metadata: Metadata = { title: { absolute: "Progress report | Staff | EcoPeps" } };

/** One saved daily or weekly report, shown as the email that was sent. */
export default async function StaffProgressReportPage(props: PageProps<"/admin/progress/[kind]/[date]">) {
  // Checked here, before any data loads: the layout's check doesn't stop the
  // page rendering alongside it.
  const staff = await requireStaff();
  const { kind, date } = await props.params;
  if (!isReportKind(kind) || !isReportDate(date)) notFound();
  if (!staff.twoStepVerified) return <StaffTwoStep returnTo={`/admin/progress/${kind}/${date}`} />;

  const report = await getReport(createAdminClient(), kind, date);
  if (!report) notFound();
  const html = reportHtml(report.data);

  return (
    <>
      <p className="text-sm">
        <Link href="/admin/progress" className="text-brand-teal-dark hover:underline">
          &larr; All progress
        </Link>
      </p>
      <h2 className="mt-3 text-xl font-semibold text-brand-navy">
        {kind === "weekly" ? "Weekly report" : "Daily report"}, {longDate(date)}
      </h2>
      <p className="mt-1 text-xs text-brand-slate-light">Sent {mountainTime(report.sentAt)}</p>
      {html ? (
        <iframe
          title={`${kind === "weekly" ? "Weekly" : "Daily"} progress report, ${longDate(date)}`}
          srcDoc={html}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          className="mt-5 h-[80vh] w-full rounded-xl border border-brand-line bg-white"
        />
      ) : (
        <p className="card mt-5 px-5 py-6 text-sm text-red-700">This report was saved in a form that can&apos;t be shown.</p>
      )}
    </>
  );
}
