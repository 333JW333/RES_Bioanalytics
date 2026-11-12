import { getStaffUser } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import TwoStepForm from "./TwoStepForm";

/**
 * Shown on every staff page until the staff member enters an authenticator
 * code this session: set up two-step sign-in the first time, then enter the
 * code. Renders no staff data. The first setup needs a recently opened
 * emailed link as well as the password (src/lib/staff.ts).
 */
export default async function StaffTwoStep({ returnTo }: { returnTo: string }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const enrolled = Boolean(data?.totp.length);
  const staff = enrolled ? null : await getStaffUser();
  return (
    <TwoStepForm
      mode={enrolled ? "verify" : "setup"}
      returnTo={returnTo}
      needsEmailProof={!enrolled && !staff?.emailProvenRecently}
    />
  );
}
