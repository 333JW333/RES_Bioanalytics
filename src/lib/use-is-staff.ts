"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Whether the signed-in visitor is staff, for showing staff-only links.
 * Asks the server (/api/staff/me) when someone signs in, so the staff list
 * never reaches the browser. Only hides or shows links: the staff pages
 * check on the server themselves.
 */
export function useIsStaff(): boolean {
  const [staff, setStaff] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let checkedFor: string | null | undefined;

    async function check(userId: string | null) {
      if (userId === checkedFor) return;
      checkedFor = userId;
      if (!userId) {
        setStaff(false);
        return;
      }
      try {
        const res = await fetch("/api/staff/me", { cache: "no-store" });
        const body: { staff?: unknown } = await res.json();
        if (checkedFor === userId) setStaff(body.staff === true);
      } catch {
        // Leave the link hidden; the staff pages are still reachable directly.
      }
    }

    supabase.auth.getSession().then(({ data }) => check(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void check(session?.user.id ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return staff;
}
