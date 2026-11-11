import { staffNewAccountEmail } from "@/lib/email/account-emails";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import type { RequestOrigin } from "@/lib/request-origin";
import { createAdminClient } from "@/lib/supabase/admin";

/** Only a confirmation made in the last few minutes is a new account (not a reused or old link). */
const FRESH_MS = 15 * 60 * 1000;

export function isFreshConfirmation(confirmedAt: string | null | undefined, now = Date.now()): boolean {
  if (!confirmedAt) return false;
  const at = Date.parse(confirmedAt);
  return Number.isFinite(at) && now - at <= FRESH_MS && at - now <= 60_000;
}

/** https://supabase.com/dashboard/project/<ref>, from NEXT_PUBLIC_SUPABASE_URL. */
export function supabaseDashboardUrl(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL): string | null {
  try {
    const host = new URL(supabaseUrl ?? "").hostname;
    return host.endsWith(".supabase.co") ? `https://supabase.com/dashboard/project/${host.split(".")[0]}` : null;
  } catch {
    return null;
  }
}

/**
 * Emails support@ecopeps.com that someone confirmed a new account, with
 * their registration details and where they signed up from. Called after
 * the confirmation response is sent, so it never slows the customer down.
 */
export async function notifyNewAccount(userId: string, origin: RequestOrigin): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn(`RESEND_API_KEY unset; new-account alert for ${userId} not sent`);
    return;
  }
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) throw new Error(`Could not load new account ${userId}: ${error?.message ?? "not found"}`);
  const user = data.user;
  if (!user.email || !isFreshConfirmation(user.email_confirmed_at)) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, business_type, industry, website, phone, ein")
    .eq("id", userId)
    .maybeSingle<{
      first_name: string | null;
      last_name: string | null;
      business_type: string | null;
      industry: string | null;
      website: string | null;
      phone: string | null;
      ein: string | null;
    }>();
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true });

  await sendEmail(
    staffNewAccountEmail({
      userId,
      email: user.email,
      firstName: profile?.first_name ?? null,
      lastName: profile?.last_name ?? null,
      businessType: profile?.business_type ?? null,
      industry: profile?.industry ?? null,
      website: profile?.website ?? null,
      phone: profile?.phone ?? null,
      einOnFile: Boolean(profile?.ein?.trim()),
      signedUpAt: user.created_at ?? null,
      confirmedAt: user.email_confirmed_at ?? null,
      accountCount: count ?? null,
      origin,
      supabaseDashboard: supabaseDashboardUrl(),
    })
  );
}
