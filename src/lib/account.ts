import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  first_name: string | null;
  last_name: string | null;
  business_type: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  created_at: string;
}

/**
 * The signed-in visitor's email and profile row, for Server Components under
 * /account. The Proxy already keeps signed-out visitors off these pages; the
 * redirect is a backstop so a page never renders without a user.
 */
export async function getAccount() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/enter");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, business_type, industry, website, phone, created_at")
    .eq("id", claims.sub)
    .maybeSingle<Profile>();

  return { email: claims.email, profile };
}
