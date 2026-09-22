import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Target of the "Confirm your email" link. The Supabase email template
// links here directly (ecopeps.com/auth/confirm?token_hash=...&type=email)
// instead of to the project's supabase.co verify endpoint, so the link
// domain matches the sending domain. Verifying a token_hash server-side
// also works in any browser — unlike the default PKCE link, which fails
// when opened somewhere other than the browser the user signed up in.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL("/shop", request.url));
    }
  }

  // Expired, already used, or malformed. With no session, the callback
  // page shows its "link expired" screen (and a visitor who is already
  // signed in is sent on to /shop).
  return NextResponse.redirect(new URL("/auth/callback", request.url));
}

// Email security scanners (e.g. university and corporate mail gateways)
// often probe links with HEAD before the recipient clicks. Without this,
// Next.js answers HEAD by running GET, which would spend the one-time
// token and leave the real click with "link expired".
export function HEAD() {
  return new NextResponse(null, { status: 200 });
}
