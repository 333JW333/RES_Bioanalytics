"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Reports each page a visitor opens to /api/track (path only). Uses
 * sendBeacon so it never delays navigation, and sets no cookies.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const firstView = useRef(true);

  useEffect(() => {
    if (!pathname) return;
    // The referring site only matters for the first page of a visit.
    const referrer = firstView.current ? document.referrer : "";
    firstView.current = false;

    const body = JSON.stringify({ path: pathname, referrer });
    try {
      if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) return;
    } catch {
      // Fall through to fetch.
    }
    fetch("/api/track", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
