"use server";

import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";

/**
 * Two-step sign-in for the staff pages (Supabase Auth TOTP: a 6-digit code
 * from an authenticator app). Staff set it up once, then enter a code each
 * time they sign in. Only staff accounts reach these actions.
 */

export type SetupResult =
  | { status: "ready"; factorId: string; qrCode: string; secret: string }
  | { status: "error"; message: string };

export type VerifyState = { status: "idle" } | { status: "error"; message: string };

const FRIENDLY_NAME = "EcoPeps staff pages";

/** Creates a new authenticator for this staff account and returns its QR code. */
export async function startTwoStepSetup(): Promise<SetupResult> {
  if (!(await getStaffUser())) return { status: "error", message: "Please sign in with a staff account." };
  const supabase = await createClient();

  // A setup that was started but never finished blocks a new one with the same name.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp.length) {
    return { status: "error", message: "Two-step sign-in is already set up. Reload the page to enter your code." };
  }
  for (const f of factors?.all ?? []) {
    if (f.factor_type === "totp" && f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: FRIENDLY_NAME,
    issuer: "EcoPeps",
  });
  if (error || !data) {
    console.error("Two-step setup failed", error?.code, error?.message);
    return {
      status: "error",
      message:
        "Two-step sign-in couldn't be set up. Check that authenticator apps (TOTP) are turned on in Supabase: " +
        "Authentication → Multi-Factor.",
    };
  }
  return { status: "ready", factorId: data.id, qrCode: svgDataUrl(data.totp.qr_code), secret: data.totp.secret };
}

/** Checks a 6-digit code; on success the session counts as two-step verified. */
export async function verifyTwoStep(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  if (!(await getStaffUser())) return { status: "error", message: "Please sign in with a staff account." };

  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { status: "error", message: "Enter the 6-digit code from your authenticator app." };

  const supabase = await createClient();
  let factorId = String(formData.get("factorId") ?? "");
  if (!factorId) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    factorId = factors?.totp[0]?.id ?? "";
  }
  if (!factorId) return { status: "error", message: "Two-step sign-in isn't set up yet. Reload the page to set it up." };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) {
    if (error.code === "mfa_verification_failed" || error.status === 422 || error.status === 400) {
      return { status: "error", message: "That code didn't work. Codes change every 30 seconds; try the current one." };
    }
    console.error("Two-step verification failed", error.code, error.message);
    return { status: "error", message: "We couldn't check that code. Please try again." };
  }

  const back = String(formData.get("returnTo") ?? "");
  redirect(/^\/admin(\/[a-z-]*)?$/.test(back) ? back : "/admin");
}

/**
 * The QR code arrives as SVG, sometimes behind an unencoded
 * "data:image/svg+xml;utf-8," prefix; characters like "#" break that as an
 * image URL, so encode it.
 */
function svgDataUrl(qr: string): string {
  const svg = qr.replace(/^data:image\/svg\+xml;(utf-8|charset=utf-8),/, "");
  return svg.startsWith("data:") ? svg : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
