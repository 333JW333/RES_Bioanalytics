import { notFound } from "next/navigation";
import { SUPPORT_EMAIL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Accounts that can open the staff pages under /admin: the comma-separated
 * STAFF_EMAILS setting, or support@ecopeps.com if it isn't set. Staff sign
 * in with their normal EcoPeps account.
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
}

/** The signed-in staff member, or null for everyone else. */
export async function getStaffUser(): Promise<StaffUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email.toLowerCase() : null;
  if (!claims?.sub || !email || !staffEmails().includes(email)) return null;
  return { id: claims.sub, email };
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
