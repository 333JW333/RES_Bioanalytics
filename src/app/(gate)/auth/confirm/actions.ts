"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function confirmEmail(formData: FormData) {
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");

  if (typeof tokenHash === "string" && typeof type === "string") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) {
      redirect("/shop");
    }
  }

  // Expired, already used, or malformed. With no session, the callback
  // page shows its "link expired" screen (and a visitor who is already
  // signed in is sent on to /shop).
  redirect("/auth/callback");
}
