#!/usr/bin/env node
/**
 * Turns a progress-report data file into the email that goes to
 * support@ecopeps.com: the daily report (9 p.m. MT) or the weekly one
 * (Saturday 7 a.m. MT). See docs/PROGRESS_REPORTS.md for what goes in the
 * data file and how the report is sent.
 *
 *   node scripts/progress-report/render.mjs <data.json> <output folder>
 *
 * Writes report.html, report.txt and subject.txt to the output folder.
 * No dependencies, so it runs without `npm install`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REPO_URL = "https://github.com/333JW333/RES_Bioanalytics";
const BACKLOG_URL = `${REPO_URL}/blob/main/docs/BACKLOG.md`;
const DASHBOARD_URL = "https://www.ecopeps.com/admin";

const NAVY = "#071a2c";
const TEAL = "#0d8f81";
const MINT = "#14b8a6";
const SLATE = "#475569";
const MUTE = "#94a3b8";
const LINE = "#e2e8f0";
const AMBER = "#92400e";
const GREEN = "#15803d";
const RED = "#b91c1c";

/** Pill background, pill text, side bar. Unknown areas use Infrastructure's. */
export const AREAS = {
  Security: ["#fee2e2", "#991b1b", "#dc2626"],
  Customers: ["#dbeafe", "#1e40af", "#2563eb"],
  "Staff tools": ["#ccfbf1", "#115e59", TEAL],
  Payments: ["#ede9fe", "#5b21b6", "#7c3aed"],
  Compliance: ["#ffedd5", "#9a3412", "#ea580c"],
  "Catalog & content": ["#fce7f3", "#9d174d", "#db2777"],
  Infrastructure: ["#e2e8f0", "#334155", "#64748b"],
};
const areaColors = (area) => AREAS[area] ?? AREAS.Infrastructure;

const TONES = { teal: TEAL, amber: "#b45309", green: GREEN, red: RED, navy: NAVY };

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const prLink = (n) =>
  `<a href="${REPO_URL}/pull/${Number(n)}" style="color:${TEAL};text-decoration:none;white-space:nowrap">#${Number(n)}</a>`;
const prLinks = (prs) => (prs?.length ? " " + prs.map(prLink).join(" ") : "");
const prText = (prs) => (prs?.length ? " (" + prs.map((n) => `#${n}`).join(", ") + ")" : "");

const pill = (label, bg, fg) =>
  `<span style="display:inline-block;background:${bg};color:${fg};font-size:10px;font-weight:bold;letter-spacing:.4px;text-transform:uppercase;padding:2px 8px;border-radius:10px;white-space:nowrap">${esc(label)}</span>`;

const heading = (title, right = "") =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0 10px"><tr>` +
  `<td style="font-size:12px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:${TEAL}">${esc(title)}</td>` +
  `<td align="right" style="font-size:12px;color:${MUTE}">${esc(right)}</td></tr></table>`;

const spacer = (colspan = 1) =>
  `<tr><td colspan="${colspan}" style="height:8px;font-size:0;line-height:0">&nbsp;</td></tr>`;

function statsRow(stats) {
  const width = Math.floor(100 / stats.length);
  const cells = stats
    .map(
      (s) =>
        `<td width="${width}%" align="center" style="padding:14px 4px 12px;background:#f8fafc;border-radius:10px">` +
        `<div style="font-size:26px;font-weight:bold;color:${TONES[s.tone] ?? NAVY}">${esc(s.value)}</div>` +
        `<div style="font-size:10px;color:${SLATE};text-transform:uppercase;letter-spacing:.6px;padding-top:3px">${esc(s.label)}</div></td>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="border-collapse:separate"><tr>${cells}</tr></table>`;
}

/** One bar per day. `count: null` is a day that hasn't happened yet. */
function chart(days, todayIndex) {
  const max = Math.max(1, ...days.map((d) => d.count ?? 0));
  const cells = days
    .map((d, i) => {
      const future = d.count === null || d.count === undefined;
      const today = i === todayIndex;
      const height = future ? 3 : Math.max(3, Math.round((d.count / max) * 46));
      const bar = future ? "#f1f5f9" : d.count ? (today ? TEAL : "#7dd3c8") : LINE;
      return (
        `<td width="${(100 / days.length).toFixed(2)}%" align="center" valign="bottom" style="padding:0 3px">` +
        `<div style="font-size:12px;font-weight:bold;color:${NAVY};padding-bottom:4px">${future ? "&nbsp;" : esc(d.count)}</div>` +
        `<div style="height:${height}px;background:${bar};border-radius:4px 4px 0 0;font-size:0;line-height:0">&nbsp;</div>` +
        `<div style="border-top:2px solid ${today ? NAVY : LINE};padding-top:5px;font-size:11px;font-weight:${today ? "bold" : "normal"};color:${today ? NAVY : MUTE}">${esc(d.label)}</div></td>`
      );
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>`;
}

/** The accountability line: a dot per day of the goal. */
function activeDays({ done, goal }) {
  const dots = Array.from({ length: Math.max(goal, done) }, (_, i) =>
    `<span style="display:inline-block;width:12px;height:12px;border-radius:6px;margin-right:5px;background:${i < done ? TEAL : "#fff"};border:1px solid ${i < done ? TEAL : MUTE}"></span>`
  ).join("");
  const met = done >= goal;
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0"><tr>` +
    `<td style="padding:10px 14px;background:${met ? "#f0fdf4" : "#f8fafc"};border-radius:10px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
    `<td style="font-size:13px;color:${NAVY}"><b>${done} of ${goal}</b> active days this week${met ? " &mdash; goal met" : ""}</td>` +
    `<td align="right" style="white-space:nowrap">${dots}</td></tr></table></td></tr></table>`
  );
}

function card(bar, bg, title, detail, tag) {
  return (
    `<tr><td style="padding:12px 14px;background:${bg};border-left:4px solid ${bar};border-radius:6px">` +
    `<div style="font-size:14px;font-weight:bold;line-height:1.45;color:${NAVY}">${title}</div>` +
    (detail ? `<div style="font-size:13px;line-height:1.5;color:${SLATE};padding-top:3px">${detail}</div>` : "") +
    (tag ? `<div style="padding-top:7px">${tag}</div>` : "") +
    `</td></tr>${spacer()}`
  );
}

const table = (rows) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;

function taskRow(task, i, top) {
  const owner =
    task.owner === "claude" ? pill("Claude", "#ccfbf1", "#115e59") : pill("You", "#fef3c7", AMBER);
  const carried = task.carried ? `<div style="padding-top:5px">${pill(task.carried, "#fee2e2", "#991b1b")}</div>` : "";
  return (
    `<tr><td width="34" valign="top" style="padding:9px 0;border-bottom:1px solid ${LINE}">` +
    `<div style="width:24px;height:24px;line-height:24px;border-radius:12px;background:${top ? NAVY : "#fff"};border:1px solid ${top ? NAVY : MUTE};color:${top ? "#fff" : SLATE};font-size:12px;font-weight:bold;text-align:center">${i + 1}</div></td>` +
    `<td style="padding:9px 8px 9px 0;border-bottom:1px solid ${LINE}">` +
    `<div style="font-size:14px;line-height:1.45;color:${NAVY}">${esc(task.text)}</div>` +
    (task.note ? `<div style="font-size:12px;line-height:1.45;color:${SLATE};padding-top:2px">${esc(task.note)}</div>` : "") +
    carried +
    `</td><td align="right" valign="top" style="padding:11px 0;border-bottom:1px solid ${LINE}">${owner}</td></tr>`
  );
}

function shippedRow(item) {
  const [bg, fg, bar] = areaColors(item.area);
  return (
    `<tr><td width="4" style="background:${bar};border-radius:3px;font-size:0;line-height:0">&nbsp;</td>` +
    `<td style="padding:8px 0 8px 12px">` +
    `<div style="font-size:14px;line-height:1.45;color:${NAVY}"><b>${esc(item.title)}</b>${prLinks(item.prs)}</div>` +
    (item.why ? `<div style="font-size:13px;line-height:1.45;color:${SLATE};padding-top:1px">${esc(item.why)}</div>` : "") +
    `<div style="padding-top:5px">${pill(item.area, bg, fg)}</div></td></tr>${spacer(2)}`
  );
}

function highlightRow(item, i) {
  return (
    `<tr><td width="34" valign="top" style="padding:8px 0">` +
    `<div style="width:24px;height:24px;line-height:24px;border-radius:12px;background:${TEAL};color:#fff;font-size:12px;font-weight:bold;text-align:center">${i + 1}</div></td>` +
    `<td style="padding:8px 0"><div style="font-size:14px;font-weight:bold;line-height:1.45;color:${NAVY}">${esc(item.title)}${prLinks(item.prs)}</div>` +
    (item.detail ? `<div style="font-size:13px;line-height:1.45;color:${SLATE}">${esc(item.detail)}</div>` : "") +
    `</td></tr>`
  );
}

function areaRow(row) {
  const [bg, fg] = areaColors(row.area);
  return (
    `<tr><td valign="top" width="120" style="padding:10px 0;border-bottom:1px solid ${LINE}">${pill(row.area, bg, fg)}` +
    `<div style="font-size:22px;font-weight:bold;color:${NAVY};padding-top:6px">${row.items.length}</div></td>` +
    `<td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:13px;line-height:1.6;color:${NAVY}">${row.items.map(esc).join("<br>")}</td></tr>`
  );
}

const STATUS = { ok: "#16a34a", warn: "#d97706", bad: "#dc2626" };

function healthRow(row) {
  const dot = row.status ? `<span style="color:${STATUS[row.status] ?? MUTE}">&#9679;</span> ` : "";
  return (
    `<tr><td valign="top" style="padding:5px 14px 5px 0;font-size:13px;color:${SLATE};white-space:nowrap">${esc(row.label)}</td>` +
    `<td style="padding:5px 0;font-size:13px;color:${NAVY}">${dot}${esc(row.value)}</td></tr>`
  );
}

const button = (label, url, solid) =>
  `<a href="${url}" style="display:inline-block;background:${solid ? TEAL : "#fff"};color:${solid ? "#fff" : TEAL};border:1px solid ${TEAL};text-decoration:none;font-size:14px;font-weight:bold;padding:10px 18px;border-radius:8px;margin:0 8px 8px 0">${label}</a>`;

/** A few checks, so a malformed data file fails loudly instead of sending a broken email. */
export function validate(data) {
  const problems = [];
  if (data.kind !== "daily" && data.kind !== "weekly") problems.push('kind must be "daily" or "weekly"');
  for (const key of ["subject", "preheader", "eyebrow", "title", "summary"]) {
    if (typeof data[key] !== "string" || !data[key].trim()) problems.push(`${key} is required`);
  }
  if (!Array.isArray(data.stats) || data.stats.length < 2 || data.stats.length > 4) problems.push("stats needs 2 to 4 entries");
  if (!data.chart || !Array.isArray(data.chart.days) || !data.chart.days.length) problems.push("chart.days is required");
  if (problems.length) throw new Error("Progress report data is not valid:\n- " + problems.join("\n- "));
}

export function renderReport(data) {
  validate(data);
  const weekly = data.kind === "weekly";
  const html = [];
  const text = [];

  const section = (title, right) => {
    html.push(heading(title, right));
    text.push("", right ? `${title.toUpperCase()} (${right})` : title.toUpperCase());
  };

  html.push(
    `<div style="font-size:12px;color:${MUTE};text-transform:uppercase;letter-spacing:1px">${esc(data.eyebrow)}</div>`,
    `<h1 style="margin:4px 0 8px;font-size:24px;line-height:1.25;color:${NAVY}">${esc(data.title)}</h1>`,
    `<p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${SLATE}">${esc(data.summary)}</p>`,
    statsRow(data.stats)
  );
  text.push(data.eyebrow, data.title, "", data.summary, "", data.stats.map((s) => `${s.label}: ${s.value}`).join("  |  "));

  if (data.activeDays) {
    html.push(activeDays(data.activeDays));
    text.push(`Active days this week: ${data.activeDays.done} of ${data.activeDays.goal}`);
  }

  // Only present when something is wrong, so it stands out.
  if (data.problems?.length) {
    section("Problems", `${data.problems.length} to look at`);
    html.push(table(data.problems.map((p) => card("#dc2626", "#fef2f2", esc(p.title), esc(p.detail ?? ""), "")).join("")));
    for (const p of data.problems) text.push(`! ${p.title}${p.detail ? `: ${p.detail}` : ""}`);
  }

  section(data.chart.title ?? (weekly ? "Day by day" : "This week so far"), data.chart.right ?? "");
  html.push(chart(data.chart.days, data.chart.today ?? -1));
  text.push(data.chart.days.map((d) => `${d.label} ${d.count ?? "-"}`).join("  "));

  if (weekly && data.highlights?.length) {
    section("Highlights");
    html.push(table(data.highlights.map(highlightRow).join("")));
    data.highlights.forEach((item, i) => text.push(`${i + 1}. ${item.title}${prText(item.prs)}${item.detail ? `: ${item.detail}` : ""}`));
  }

  if (data.decisions?.length) {
    section(weekly ? "Still waiting on you" : "Needs your decision", `${data.decisions.length} open`);
    html.push(
      table(
        data.decisions
          .map((d) =>
            card("#d97706", "#fffbeb", esc(d.question), esc(d.context ?? "") + prLinks(d.prs), d.waiting ? pill(d.waiting, "#fef3c7", AMBER) : "")
          )
          .join("")
      )
    );
    for (const d of data.decisions) text.push(`? ${d.question}${d.waiting ? ` [${d.waiting}]` : ""}${prText(d.prs)}`);
  }

  if (data.tasks?.items?.length) {
    const top = data.tasks.top ?? 3;
    section(data.tasks.title ?? "Tomorrow", data.tasks.right ?? "");
    html.push(table(data.tasks.items.map((t, i) => taskRow(t, i, i < top)).join("")));
    data.tasks.items.forEach((t, i) =>
      text.push(`${i + 1}. [${t.owner === "claude" ? "Claude" : "You"}] ${t.text}${t.carried ? ` [${t.carried}]` : ""}`)
    );
  }

  if (!weekly) {
    if (data.shipped?.items?.length) {
      section("Shipped today", data.shipped.right ?? "");
      html.push(table(data.shipped.items.map(shippedRow).join("")));
      for (const item of data.shipped.items) text.push(`- [${item.area}] ${item.title}${prText(item.prs)}`);
    } else {
      section("Shipped today");
      const note = data.quietNote ?? "Nothing shipped today. One task from the list above keeps the week moving.";
      html.push(`<p style="margin:0;padding:14px 16px;background:#f8fafc;border-radius:10px;font-size:14px;line-height:1.5;color:${NAVY}">${esc(note)}</p>`);
      text.push(note);
    }
  } else if (data.areas?.length) {
    section("Completed by area");
    html.push(table(data.areas.map(areaRow).join("")));
    for (const row of data.areas) text.push(`${row.area} (${row.items.length}): ${row.items.join("; ")}`);
  }

  if (data.inProgress?.length) {
    section("In progress");
    for (const item of data.inProgress) {
      html.push(`<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:${NAVY}">${esc(item.text)}${prLinks(item.prs)}</p>`);
      text.push(`- ${item.text}${prText(item.prs)}`);
    }
  }

  if (data.health?.length) {
    section("Payments and site health");
    html.push(`<table role="presentation" cellpadding="0" cellspacing="0">${data.health.map(healthRow).join("")}</table>`);
    for (const row of data.health) text.push(`${row.label}: ${row.value}`);
  }

  html.push(`<p style="margin:24px 0 0">${button("Open the full backlog", BACKLOG_URL, true)}${button("Staff dashboard", DASHBOARD_URL, false)}</p>`);
  text.push("", `Backlog: ${BACKLOG_URL}`, `Staff dashboard: ${DASHBOARD_URL}`);

  const footer =
    data.footer ??
    (weekly
      ? "Sent Saturdays at 7 a.m. Mountain Time. Covers Saturday through Friday night."
      : "Sent every night at 9 p.m. Mountain Time.");
  text.push("", "--", footer, "EcoPeps · www.ecopeps.com");

  const body =
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(data.subject)}</title></head>` +
    `<body style="margin:0;padding:0;background:#eef2f6">` +
    `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#eef2f6">${esc(data.preheader)}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f6;padding:24px 12px"><tr><td align="center">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;font-family:Arial,Helvetica,sans-serif">` +
    `<tr><td style="background:${NAVY};border-radius:14px 14px 0 0;padding:18px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
    `<td style="font-size:20px;font-weight:bold;color:#ffffff">Eco<span style="color:${MINT}">Peps</span></td>` +
    `<td align="right"><span style="display:inline-block;border:1px solid #334a5e;border-radius:12px;padding:3px 10px;font-size:11px;color:#cbd5e1;text-transform:uppercase;letter-spacing:1px">${weekly ? "Weekly progress" : "Daily progress"}</span></td>` +
    `</tr></table></td></tr>` +
    `<tr><td style="height:4px;background:${MINT};font-size:0;line-height:0">&nbsp;</td></tr>` +
    `<tr><td style="padding:26px 24px 24px">${html.join("")}` +
    `<p style="margin:26px 0 0;padding-top:16px;border-top:1px solid ${LINE};font-size:12px;line-height:1.6;color:${SLATE}">${esc(footer)}<br>EcoPeps &middot; www.ecopeps.com</p>` +
    `</td></tr></table></td></tr></table></body></html>`;

  return { subject: data.subject, html: body, text: text.join("\n") };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [dataPath, outDir] = process.argv.slice(2);
  if (!dataPath || !outDir) {
    console.error("Usage: node scripts/progress-report/render.mjs <data.json> <output folder>");
    process.exit(1);
  }
  const report = renderReport(JSON.parse(readFileSync(dataPath, "utf8")));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "report.html"), report.html);
  writeFileSync(join(outDir, "report.txt"), report.text);
  writeFileSync(join(outDir, "subject.txt"), report.subject);
  console.log(`Wrote report.html, report.txt and subject.txt to ${outDir}`);
  console.log(`Subject: ${report.subject}`);
}
