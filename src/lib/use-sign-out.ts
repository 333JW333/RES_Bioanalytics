import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useSignOut() {
  const router = useRouter();

  return useCallback(async () => {
    await createClient().auth.signOut();
    router.replace("/enter");
    // Drop cached store pages so the proxy re-checks the session next visit.
    router.refresh();
  }, [router]);
}
