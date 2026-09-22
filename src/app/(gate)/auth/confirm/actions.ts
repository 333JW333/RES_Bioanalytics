"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
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
      // password; every other link type finishes at the catalog.
      redirect(isRecovery ? "/reset-password" : "/shop");
    }
  }

  // Expired, already used, or malformed. For signup links, with no
  // session the callback page shows its "link expired" screen (and a
  // visitor who is already signed in is sent on to /shop).
  redirect(isRecovery ? "/forgot-password?expired=1" : "/auth/callback");
}
