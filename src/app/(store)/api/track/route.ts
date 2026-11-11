import { NextResponse, after, type NextRequest } from "next/server";
import { cleanPath, cleanReferrer } from "@/lib/page-views";
import { requestOrigin } from "@/lib/request-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Records a page view sent by <PageViewTracker /> on our own pages. Linked
 * to the account when the visitor is signed in (read from their session,
 * never from the request body). Always answers 204 so a tracking hiccup
 * can't affect the page.
 */
export async function POST(req: NextRequest) {
  const done = new NextResponse(null, { status: 204 });

  // Only our own pages send these.
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return done;

  let body: { path?: unknown; referrer?: unknown };
  try {
    body = await req.json();
  } catch {
    return done;
  }
  const path = cleanPath(body?.path);
  if (!path) return done;
  const referrer = cleanReferrer(body?.referrer, req.nextUrl.host);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  const { city, region, country } = requestOrigin(req.headers);

  after(async () => {
    try {
      const admin = createAdminClient();
      const { error } = await admin
        .from("page_views")
        .insert({ user_id: userId, path, referrer, city, region, country });
      // Records past the retention limit are deleted daily (src/lib/cron.ts).
      if (error) console.error("Could not record page view", error.message);
    } catch (err) {
      console.error("Could not record page view", err);
    }
  });
  return done;
}
