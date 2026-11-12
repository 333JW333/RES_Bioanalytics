import { notFound } from "next/navigation";
import { SUPPORT_EMAIL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Accounts that can open the staff pages under /admin: the comma-separated
 * STAFF_EMAILS setting, or support@ecopeps.com if it isn't set. Staff sign
 * in with their normal EcoPeps account, then enter a code from an
 * authenticator app (two-step sign-in). Setting it up the first time also
 * needs a link emailed to the staff address (emailProvenRecently below).
 */
export function staffEmails(raw = process.env.STAFF_EMAILS): string[] {
  const list = (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.length ? list : [SUPPORT_EMAIL];
}

export interface StaffUser {
  id: string;
  email: string;
  /** Signed in with an authenticator code this session (Supabase "aal2"). */
  twoStepVerified: boolean;
  /** Opened a link we emailed to this address in the last few minutes. */
  emailProvenRecently: boolean;
}

/**
 * How this session signed in, per Supabase's "amr" claim. A link sent to the
 * mailbox (password reset, sign-up confirmation) is recorded as "otp".
 */
const EMAIL_LINK_METHODS = new Set(["otp", "recovery", "magiclink", "invite", "email/signup"]);

/** How long after opening an emailed link a first authenticator may be set up. */
export const EMAIL_PROOF_SECONDS = 15 * 60;

/**
 * True if this session opened an emailed link within EMAIL_PROOF_SECONDS.
 * A password alone doesn't count: setting up the first authenticator has to
 * be done by whoever controls the staff mailbox, not whoever knows (or
 * guessed) the password.
 */
export function emailProvenRecently(amr: unknown, nowSeconds = Date.now() / 1000): boolean {
  if (!Array.isArray(amr)) return false;
  return amr.some((entry) => {
    const method = (entry as { method?: unknown })?.method;
    const at = Number((entry as { timestamp?: unknown })?.timestamp);
    return (
      typeof method === "string" &&
      EMAIL_LINK_METHODS.has(method) &&
      Number.isFinite(at) &&
      at <= nowSeconds + 60 &&
      nowSeconds - at <= EMAIL_PROOF_SECONDS
    );
  });
}

/** The signed-in staff member, or null for everyone else. */
export async function getStaffUser(): Promise<StaffUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email.toLowerCase() : null;
  if (!claims?.sub || !email || !staffEmails().includes(email)) return null;
  return {
    id: claims.sub,
    email,
    twoStepVerified: claims.aal === "aal2",
    emailProvenRecently: emailProvenRecently(claims.amr),
  };
}

/**
 * For staff pages: anyone else gets a plain 404, so the pages don't advertise
 * themselves. Call it at the top of every staff page, before loading data:
 * a page renders alongside its layout, so a check in the layout alone
 * doesn't keep the page's data out of the response.
 */
export async function requireStaff(): Promise<StaffUser> {
  const staff = await getStaffUser();
  if (!staff) notFound();
  return staff;
}

/**
 * For staff actions (forms that change orders or send emails): staff who
 * have entered their authenticator code this session. Anyone else is refused.
 */
export async function requireVerifiedStaff(): Promise<StaffUser> {
  const staff = await getStaffUser();
  if (!staff?.twoStepVerified) throw new Error("Not authorized");
  return staff;
}
