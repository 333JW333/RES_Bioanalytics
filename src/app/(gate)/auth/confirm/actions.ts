"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RETURN_TO_COOKIE, safeReturnPath } from "@/lib/return-to";
import { createClient } from "@/lib/supabase/server";

export async function confirmEmail(formData: FormData) {
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");
  const isRecovery = type === "recovery";

  if (typeof tokenHash === "string" && typeof type === "string") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) {
      // A recovery link signs the user in so they can choose a new
      // password; every other link type finishes at the page they were
      // opening when they signed up (saved on this browser by the sign-up
      // form, see src/lib/return-to.ts), or else the catalog.
      if (isRecovery) redirect("/reset-password");
      const cookieStore = await cookies();
      const returnTo = safeReturnPath(cookieStore.get(RETURN_TO_COOKIE)?.value);
      cookieStore.delete(RETURN_TO_COOKIE);
      redirect(returnTo ?? "/shop");
    }
  }

  // Expired, already used, or malformed. For signup links, with no
  // session the callback page shows its "link expired" screen (and a
  // visitor who is already signed in is sent on to /shop).
  redirect(isRecovery ? "/forgot-password?expired=1" : "/auth/callback");
}
