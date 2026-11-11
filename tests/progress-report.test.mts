import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderReport, validate } from "../scripts/progress-report/render.mjs";

const example = (name: string) =>
  JSON.parse(readFileSync(new URL(`../scripts/progress-report/examples/${name}.json`, import.meta.url), "utf8"));

test("daily report shows shipped items, decisions, tasks and links", () => {
  const { subject, html, text } = renderReport(example("daily"));
  assert.equal(subject, "EcoPeps daily: 10 shipped, 2 decisions waiting");
  assert.match(html, /Daily progress/);
  assert.match(html, /Needs your decision/);
  assert.match(html, /Waiting 44 days/);
  assert.match(html, /pull\/81"/);
  assert.match(html, /2 of 6<\/b> active days/);
  assert.match(text, /SHIPPED TODAY/);
  assert.match(text, /1\. \[You\] Set up two-step sign-in/);
  assert.doesNotMatch(html, /to look at/);
});

test("quiet day still renders, with the nudge instead of a shipped list", () => {
  const { html, text } = renderReport(example("daily-quiet"));
  assert.match(html, /Nothing shipped today\. One task/);
  assert.match(text, /Active days this week: 2 of 6/);
});

test("weekly report shows highlights and work by area", () => {
  const { html, text } = renderReport(example("weekly"));
  assert.match(html, /Weekly progress/);
  assert.match(html, /Completed by area/);
  assert.match(html, /Still waiting on you/);
  assert.match(html, /On the list 3 days/);
  assert.match(text, /Payments \(6\)/);
});

test("problems appear only when there are some", () => {
  const data = example("daily");
  data.problems = [{ title: "Production deploy failed", detail: "The 3:10 p.m. build did not finish." }];
  const { html, text } = renderReport(data);
  assert.match(html, /Production deploy failed/);
  assert.match(text, /! Production deploy failed/);
});

test("text from the data file is escaped", () => {
  const data = example("daily");
  data.summary = "<script>alert(1)</script>";
  assert.doesNotMatch(renderReport(data).html, /<script>/);
});

test("a malformed data file is refused", () => {
  assert.throws(() => validate({ kind: "monthly" }), /not valid/);
});
