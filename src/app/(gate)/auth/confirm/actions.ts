"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { notifyNewAccount } from "@/lib/account-notifications";
import { requestOrigin } from "@/lib/request-origin";
import { RETURN_TO_COOKIE, safeReturnPath } from "@/lib/return-to";
import { createClient } from "@/lib/supabase/server";

export async function confirmEmail(formData: FormData) {
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");
  const isRecovery = type === "recovery";

  if (typeof tokenHash === "string" && typeof type === "string") {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) {
      // A recovery link signs the user in so they can choose a new
      // password; every other link type finishes at the page they were
      // opening when they signed up (saved on this browser by the sign-up
      // form, see src/lib/return-to.ts), or else the catalog.
      if (isRecovery) redirect("/reset-password");

      // An email change from My Account. With secure email change on, both
      // the old and new addresses get a link; the change is finished once
      // the user no longer has a pending new_email.
      if (type === "email_change") {
        const finished = Boolean(data.user) && !data.user?.new_email;
        redirect(`/account/details?email=${finished ? "changed" : "pending"}`);
      }

      // A sign-up confirmation: tell support@ecopeps.com about the new
      // account, after the customer's redirect has been sent.
      const userId = data.user?.id;
      if (userId && (type === "email" || type === "signup")) {
        const origin = requestOrigin(await headers());
        after(() =>
          notifyNewAccount(userId, origin).catch((err) =>
            console.error(`New-account alert for ${userId} failed`, err)
          )
        );
      }

      const cookieStore = await cookies();
      const returnTo = safeReturnPath(cookieStore.get(RETURN_TO_COOKIE)?.value);
      cookieStore.delete(RETURN_TO_COOKIE);
      redirect(returnTo ?? "/shop");
    }
  }

  // Expired, already used, or malformed. For signup links, with no
  // session the callback page shows its "link expired" screen (and a
  // visitor who is already signed in is sent on to /shop).
  if (type === "email_change") redirect("/account/details?email=expired");
  redirect(isRecovery ? "/forgot-password?expired=1" : "/auth/callback");
}
