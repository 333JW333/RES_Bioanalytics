import { NextResponse, type NextRequest } from "next/server";
import { MAX_REPORT_BYTES, summarizeCspReports } from "@/lib/csp";

/**
 * Receives the reports browsers send for the report-only Content Security
 * Policy (next.config.ts, src/lib/csp.ts) and writes one line per violation
 * to the function logs (Vercel: Logs, search "CSP report-only"). Stores
 * nothing and reads no session. Page and script addresses are logged without
 * their query strings, which can hold sign-in tokens.
 */
export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_REPORT_BYTES) return done;

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_REPORT_BYTES) return done;
    body = JSON.parse(text);
  } catch {
    return done;
  }
  for (const v of summarizeCspReports(body)) {
    console.warn("CSP report-only violation", JSON.stringify(v));
  }
  return done;
}
