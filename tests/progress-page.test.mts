import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const example = (name: string) =>
  JSON.parse(readFileSync(new URL(`../scripts/progress-report/examples/${name}.json`, import.meta.url), "utf8"));

const { daysBetween, parseBacklog, waitingLabel } = await import("@/lib/progress/backlog");
const { isReportDate, isReportKind, reportHtml, statValue } = await import("@/lib/progress/reports");

const SAMPLE = `# Backlog

## Up next

- [ ] Set up two-step sign-in. Staff pages wait on this. (you, added 2026-11-11)
- [ ] Confirm the \`account\` change is live. (claude, added 2026-11-09)
- [x] Already done, so not listed.
- [ ] No tag on this one.

## Needs a decision

- [ ] Delist EP-GLP3-R (pull request 61): merge or close? (added 2026-09-28)

## Later

## Done outside the code

One line each with the date done:
\`- 2026-11-12: what was done.\`
- 2026-11-12: Called the supplier about the next batch.

## Notes

- [ ] Not a task: notes are ignored.
`;

test("the backlog file is read into tasks, decisions and done items", () => {
  const b = parseBacklog(SAMPLE);
  assert.deepEqual(b.upNext, [
    { text: "Set up two-step sign-in. Staff pages wait on this.", owner: "you", added: "2026-11-11" },
    { text: "Confirm the account change is live.", owner: "claude", added: "2026-11-09" },
    { text: "No tag on this one.", owner: null, added: null },
  ]);
  assert.deepEqual(b.decisions, [
    { text: "Delist EP-GLP3-R (pull request 61): merge or close?", owner: null, added: "2026-09-28" },
  ]);
  assert.deepEqual(b.later, []);
  assert.deepEqual(b.done, [{ date: "2026-11-12", text: "Called the supplier about the next batch." }]);
});

test("the real backlog file parses", () => {
  const b = parseBacklog(readFileSync(new URL("../docs/BACKLOG.md", import.meta.url), "utf8"));
  assert.ok(b.upNext.length + b.decisions.length + b.later.length > 0);
  for (const item of [...b.upNext, ...b.decisions, ...b.later]) assert.match(item.added ?? "", /^\d{4}-\d{2}-\d{2}$/);
});

test("waiting times count whole days", () => {
  assert.equal(daysBetween("2026-09-28", "2026-11-11"), 44);
  assert.equal(daysBetween(null, "2026-11-11"), null);
  assert.equal(waitingLabel("2026-11-11", "2026-11-11"), "New today");
  assert.equal(waitingLabel("2026-11-10", "2026-11-11"), "Waiting 1 day");
  assert.equal(waitingLabel("2026-09-28", "2026-11-11"), "Waiting 44 days");
});

test("report addresses accept only a kind and a date", () => {
  assert.ok(isReportKind("daily") && isReportKind("weekly"));
  assert.ok(!isReportKind("monthly"));
  assert.ok(isReportDate("2026-11-11"));
  assert.ok(!isReportDate("2026-13-45") && !isReportDate("11-11-2026") && !isReportDate("../x"));
});

test("a saved report is shown as its email, with links opening in a new tab", () => {
  const html = reportHtml(example("daily"));
  assert.match(html ?? "", /<base target="_blank">/);
  assert.match(html ?? "", /Shipped today/);
  assert.equal(statValue(example("daily"), "shipped"), "10");
  assert.equal(reportHtml({ kind: "daily" } as never), null);
});
