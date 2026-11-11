"use server";

import { revalidatePath } from "next/cache";
import {
  readDetails,
  validateDetails,
  validateNewEmail,
  validateNewPassword,
  type DetailsErrors,
  type DetailsInput,
} from "@/lib/account-details";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * My Account → Account Details: customers change their own details, email
 * and password here. Each action works on the signed-in customer's own
 * account only (their session, and the profiles row-level security).
 */

export type FormState =
  | { status: "idle" }
  | { status: "done"; message: string; saved?: DetailsInput }
  | { status: "error"; message: string; errors?: DetailsErrors };

const SIGNED_OUT: FormState = { status: "error", message: "Your session ended. Please sign in again." };

async function signedIn() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { supabase, userId: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
}

export async function updateDetails(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await signedIn();
  if (!me) return SIGNED_OUT;

  const result = validateDetails(readDetails(formData));
  if (!result.ok) {
    return { status: "error", message: "Please check the highlighted fields.", errors: result.errors };
  }

  const { error } = await me.supabase.from("profiles").update(result.update).eq("id", me.userId);
  if (error) {
    console.error("Updating account details failed", error.message);
    return { status: "error", message: `We couldn't save your changes. Please try again, or email ${SUPPORT_EMAIL}.` };
  }
  revalidatePath("/account", "layout");
  const u = result.update;
  return {
    status: "done",
    message: "Your details are saved.",
    // As stored, e.g. the EIN as 12-3456789.
    saved: {
      firstName: u.first_name,
      lastName: u.last_name,
      phone: u.phone,
      website: u.website ?? "",
      businessType: u.business_type,
      industry: u.industry,
      ein: u.ein ?? "",
    },
  };
}

export async function changeEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await signedIn();
  if (!me) return SIGNED_OUT;

  const check = validateNewEmail(formData.get("newEmail"), me.email);
  if (!check.ok) return { status: "error", message: check.error };

  const { error } = await me.supabase.auth.updateUser(
    { email: check.email },
    { emailRedirectTo: `${SITE_URL}/auth/callback` }
  );
  if (error) {
    if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
      return { status: "error", message: "That email address already has an EcoPeps account." };
    }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) {
      return { status: "error", message: "Too many emails were sent just now. Please wait a few minutes and try again." };
    }
    console.error("Email change request failed", error.code, error.message);
    return { status: "error", message: `We couldn't start the change. Please try again, or email ${SUPPORT_EMAIL}.` };
  }

  await logChange(me.userId, "email (change requested)", me.email, check.email);
  return {
    status: "done",
    message:
      `We've emailed a confirmation link to ${check.email}. Your email address changes once you click it. ` +
      "If we also emailed your current address, click the link in that email too. Until then, keep signing in with your current email.",
  };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await signedIn();
  if (!me) return SIGNED_OUT;

  const check = validateNewPassword(formData.get("newPassword"), formData.get("confirmPassword"));
  if (!check.ok) return { status: "error", message: check.error };

  const { error } = await me.supabase.auth.updateUser({ password: check.password });
  if (error) {
    if (error.code === "same_password") {
      return { status: "error", message: "That's your current password. Choose a different one." };
    }
    if (error.code === "weak_password") {
      return { status: "error", message: "That password is too easy to guess. Try a longer one, mixing words, numbers and symbols." };
    }
    if (error.code === "reauthentication_needed") {
      return {
        status: "error",
        message: "For your security, please sign out and back in, then try again. Or use \"Reset it by email\" below.",
      };
    }
    console.error("Password change failed", error.code, error.message);
    return { status: "error", message: "We couldn't change your password. Please try again, or reset it by email." };
  }

  await logChange(me.userId, "password", null, "changed");
  return { status: "done", message: "Your password is changed." };
}

/** Recorded for staff (staff.customer_timeline and the daily summary). Never blocks the customer. */
async function logChange(userId: string, field: string, oldValue: string | null, newValue: string | null) {
  try {
    const { error } = await createAdminClient()
      .from("profile_changes")
      .insert({ user_id: userId, field, old_value: oldValue, new_value: newValue });
    if (error) console.error(`Recording the ${field} change failed`, error.message);
  } catch (err) {
    console.error(`Recording the ${field} change failed`, err);
  }
}
