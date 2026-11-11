/**
 * Where a request came from, as our host (Vercel) reports it. Location is
 * approximate: Vercel derives it from the IP address.
 */
export interface RequestOrigin {
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  userAgent: string | null;
}

function decode(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function requestOrigin(headers: Headers): RequestOrigin {
  return {
    ip: headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    city: decode(headers.get("x-vercel-ip-city"))?.slice(0, 100) || null,
    region: headers.get("x-vercel-ip-country-region")?.slice(0, 10) || null,
    country: headers.get("x-vercel-ip-country")?.slice(0, 2) || null,
    userAgent: headers.get("user-agent")?.slice(0, 300) || null,
  };
}

/** "Boise, ID, US", or null if the host didn't say. */
export function formatLocation(o: Pick<RequestOrigin, "city" | "region" | "country">): string | null {
  return [o.city, o.region, o.country].filter(Boolean).join(", ") || null;
}
