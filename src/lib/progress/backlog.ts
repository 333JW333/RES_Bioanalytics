import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Reads docs/BACKLOG.md, the to-do list behind the progress reports, for
 * Staff -> Progress. The file ships with each deploy (next.config.ts), so
 * the page shows the backlog as of the last merge to main.
 */

export interface BacklogItem {
  text: string;
  owner: "you" | "claude" | null;
  /** YYYY-MM-DD, from "(you, added 2026-11-11)". */
  added: string | null;
}

export interface DoneItem {
  date: string;
  text: string;
}

export interface Backlog {
  upNext: BacklogItem[];
  decisions: BacklogItem[];
  later: BacklogItem[];
  done: DoneItem[];
}

const SECTIONS: Record<string, "upNext" | "decisions" | "later" | "done"> = {
  "up next": "upNext",
  "needs a decision": "decisions",
  later: "later",
  "done outside the code": "done",
};

/** "(you, added 2026-11-11)" or "(added 2026-09-28)" at the end of a line. */
const TAG = /\s*\((?:(you|claude),\s*)?added (\d{4}-\d{2}-\d{2})\)\s*$/i;

/** Drops Markdown code ticks, which the page shows as plain text. */
const plain = (text: string) => text.replace(/`/g, "").trim();

export function parseBacklog(markdown: string): Backlog {
  const backlog: Backlog = { upNext: [], decisions: [], later: [], done: [] };
  let section: keyof Backlog | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^##\s+(.*)$/.exec(line);
    if (heading) {
      section = SECTIONS[heading[1].trim().toLowerCase()] ?? null;
      continue;
    }
    if (!section) continue;

    if (section === "done") {
      const done = /^-\s+(\d{4}-\d{2}-\d{2}):\s*(.+)$/.exec(line);
      if (done) backlog.done.push({ date: done[1], text: plain(done[2]) });
      continue;
    }

    const open = /^-\s+\[ \]\s+(.+)$/.exec(line);
    if (!open) continue;
    const tag = TAG.exec(open[1]);
    backlog[section].push({
      text: plain(tag ? open[1].slice(0, tag.index) : open[1]),
      owner: tag?.[1] ? (tag[1].toLowerCase() as "you" | "claude") : null,
      added: tag?.[2] ?? null,
    });
  }
  return backlog;
}

/** Today's date in Mountain Time, as YYYY-MM-DD. */
export function mountainDate(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
}

/** Whole days from one YYYY-MM-DD date to another; null if either is missing. */
export function daysBetween(from: string | null, to: string): number | null {
  if (!from) return null;
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
  return Number.isFinite(days) ? Math.max(0, days) : null;
}

/** "New today", "Waiting 1 day", "Waiting 44 days". */
export function waitingLabel(added: string | null, today: string): string | null {
  const days = daysBetween(added, today);
  if (days === null) return null;
  return days === 0 ? "New today" : `Waiting ${days} ${days === 1 ? "day" : "days"}`;
}

/** Null if the file can't be read, so the page can say so. */
export async function loadBacklog(): Promise<Backlog | null> {
  try {
    return parseBacklog(await readFile(path.join(process.cwd(), "docs", "BACKLOG.md"), "utf8"));
  } catch (error) {
    console.error("Couldn't read docs/BACKLOG.md", error instanceof Error ? error.message : error);
    return null;
  }
}
