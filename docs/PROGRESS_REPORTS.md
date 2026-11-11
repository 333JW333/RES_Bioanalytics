# Progress reports

Two emails go to support@ecopeps.com from `EcoPeps Reports
<reports@ecopeps.com>` (replies go to support@ecopeps.com):

- **Daily**, every night at 9 p.m. Mountain Time: what shipped today, what
  needs a decision, and the task list for tomorrow.
- **Weekly**, Saturday at 7 a.m. Mountain Time: the week from Saturday
  through Friday night.

They are about work on the site. The store's own activity (orders, new
accounts, traffic) is in the 5 p.m. staff summary the site sends itself.

Each report is written by a scheduled Claude session that follows this
page. It gathers the facts, writes them into a data file, and
`scripts/progress-report/render.mjs` turns that into the email, so every
report looks the same. Examples of the data file are in
`scripts/progress-report/examples/`.

## Rules for the session writing a report

- Read only. Do not change the repo, the site, Stripe, Supabase or Vercel.
  The one outward action is sending one email to support@ecopeps.com.
- Send exactly one email per run. If something is missing (a connector
  that will not answer, for example), still send the report, and say what
  is missing under `problems`.
- Never guess. A number you could not check is left out, not estimated.
- All times and day boundaries are Mountain Time (`America/Denver`).
- Write for the owner of the business, not a developer: plain words, what
  changed for customers or staff, no file names or code terms.

## The week

A week runs Saturday 00:00 to Friday 23:59 Mountain Time. Saturday's work
belongs to the week that follows the Saturday-morning report. The chart
always shows seven days, Sat to Fri. The goal is **6 active days** a week.
An active day is one where at least one item shipped.

## What counts as shipped

1. Pull requests merged into `main` of `333JW333/RES_Bioanalytics` in the
   period (`git log origin/main --merges` with `TZ=America/Denver`, or the
   GitHub tools). Read each pull request's description.
2. Split each pull request into the separate things it delivered, as its
   description lists them. One item is one thing a customer, staff member
   or the business would notice. Tiny follow-up fixes fold into their item.
3. Lines dated in the period under **Done outside the code** in
   `docs/BACKLOG.md`.

Give each item one area: Security, Customers, Staff tools, Payments,
Compliance (terms, privacy, research-use wording, product claims),
Catalog & content (products, COAs, photos, copy), or Infrastructure. Order
the list by area in that order. Each item gets a title of under ten words
and one `why` sentence saying what it means in practice.

## Decisions and tasks

- `decisions` are the open lines under **Needs a decision** in the
  backlog, in order. `waiting` is "New today" on the day it was added,
  otherwise "Waiting N days" counted from its `added` date.
- `tasks.items` are the open lines under **Up next**, in order, at most
  seven. `owner` is `you` or `claude` from the line. When a task has been
  on the list three days or more, set `carried` to "On the list N days".
- Also add an open pull request that is ready to merge but not merged as a
  task for `you` ("Merge ..."), and mention work still in draft under
  `inProgress`.

## Problems

Add an entry to `problems` only when something is wrong. Leave it empty
otherwise, so the red box means something. Check:

- Vercel: a production deployment of the `website` project in the period
  that failed, or runtime errors on the live site.
- Resend: emails in the period that bounced or failed.
- Stripe (live mode): a new dispute, or a failed payout.
- Anything this run could not check.

## Payments and site health

- Vercel: state and time of the latest production deployment; number of
  production deployments in the period and how many failed (the "Deploys
  OK" figure).
- Stripe, live mode, account "Regenerative Ecosystem Services LLC":
  successful payments (count and total), refunds, disputes and payouts
  created in the period. Keep it to one or two lines. If another payment
  processor is added in `src/lib/payments/processors.ts`, add a line for
  it when its data can be read.

## Daily report

Period: today, 00:00 to now. Use `examples/daily.json` as the pattern.

- `eyebrow`: "Wednesday · Day 5 of the week". `title`: the date.
- `summary`: two sentences on what kind of day it was.
- `stats`: Shipped, Decisions, Up next, Deploys OK (leave Deploys OK out
  on a day with no deployments).
- `chart.days`: Sat to Fri with the shipped count for each day so far and
  `null` for days still to come; `chart.today` is today's position (Sat is
  0). `chart.right`: "N shipped" for the week.
- `subject`: "EcoPeps daily: N shipped, M decisions waiting".

**Quiet day.** When nothing shipped, still send, using
`examples/daily-quiet.json` as the pattern: no `shipped`, a summary that
says how many active days the week has and how many days are left to add
to them, and the single easiest task first with `tasks.top` set to 1. Keep
the tone encouraging and factual. Subject: "EcoPeps daily: nothing
shipped, N tasks waiting".

## Weekly report

Period: the Saturday-to-Friday week that ended last night. Use
`examples/weekly.json` as the pattern.

- `title`: a headline for the week. `summary`: two or three sentences,
  ending with the comparison to the week before ("15 shipped, up from 9").
  Count the week before the same way; say so if there was none.
- `stats`: Shipped, Pull requests, Deploys OK, Payments.
- `highlights`: the three things that mattered most.
- `areas`: every shipped item as a short phrase, grouped by area.
- `decisions`: as above. `tasks`: title "Carried into next week", `right`
  "N of M planned" when that can be worked out from the week's backlog
  history (`git log -p docs/BACKLOG.md`).
- `subject`: "EcoPeps weekly: N shipped, M decisions waiting".

## Building and sending

```bash
node scripts/progress-report/render.mjs data.json out
```

This writes `out/report.html`, `out/report.txt` and `out/subject.txt`.
Keep the data file and output outside the repo. Send with the Resend
connector's send-email tool:

- from: `EcoPeps Reports <reports@ecopeps.com>`
- to: `support@ecopeps.com`
- replyTo: `support@ecopeps.com`
- subject, html and text from the three files, unchanged
- idempotencyKey: `progress-daily-YYYY-MM-DD` or
  `progress-weekly-YYYY-MM-DD` (the report's date), so a retry cannot
  send it twice

## Changing the reports

- Look and layout: `scripts/progress-report/render.mjs`
  (`tests/progress-report.test.mts` covers it).
- What goes in them: this page.
- When they run: the two scheduled tasks named "EcoPeps daily progress
  report" and "EcoPeps weekly progress report" in Claude Code.
