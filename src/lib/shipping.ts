/** Carriers staff can pick when marking an order shipped, with their tracking pages. */
export const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Other"] as const;
export type Carrier = (typeof CARRIERS)[number];

export function isCarrier(value: unknown): value is Carrier {
  return typeof value === "string" && (CARRIERS as readonly string[]).includes(value);
}

/** The carrier's public tracking page for a tracking number, or null for "Other". */
export function trackingUrl(carrier: string | null, trackingNumber: string | null): string | null {
  if (!carrier || !trackingNumber) return null;
  const n = encodeURIComponent(trackingNumber);
  switch (carrier) {
    case "USPS":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
    case "UPS":
      return `https://www.ups.com/track?tracknum=${n}`;
    case "FedEx":
      return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
    case "DHL":
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`;
    default:
      return null;
  }
}

/** Tracking numbers: letters, digits, spaces and dashes, 5–40 characters. */
export function cleanTrackingNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().replace(/\s+/g, " ");
  return /^[A-Za-z0-9 -]{5,40}$/.test(t) ? t : null;
}
