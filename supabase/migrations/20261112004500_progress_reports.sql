-- progress_reports: the daily and weekly progress reports, for Staff -> Progress --
-- One row per report sent to support@ecopeps.com. `data` is the report's data
-- file (docs/PROGRESS_REPORTS.md); the staff page turns it back into the email
-- with scripts/progress-report/render.mjs. Server-side only.

create table public.progress_reports (
  kind text not null check (kind in ('daily', 'weekly')),
  report_date date not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  sent_at timestamptz not null default now(),
  primary key (kind, report_date)
);

alter table public.progress_reports enable row level security;
revoke all on public.progress_reports from anon, authenticated;
grant select, insert, update on public.progress_reports to service_role;
