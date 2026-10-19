import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { checkVialCodes } from "./src/data/check-vial-codes";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    // EP-GLP3-R's COA folder, full-COA PDF and product page were renamed
    // from "retatrutide", and EP-GLP2-T's product page from "tirzepatide".
    // Keep links to the old locations (bookmarks, search results, shared
    // links) opening the same files and pages. The PDF's rule comes before
    // its folder's, since the first match wins.
    return [
      {
        source: "/coas/retatrutide/15mg/retatrutide-15mg-full-coa.pdf",
        destination: "/coas/EP-GLP3-R/15mg/EP-GLP3-R-15mg-full-coa.pdf",
        permanent: true,
      },
      {
        source: "/coas/retatrutide/:path*",
        destination: "/coas/EP-GLP3-R/:path*",
        permanent: true,
      },
      {
        source: "/shop/retatrutide",
        destination: "/shop/ep-glp3-r",
        permanent: true,
      },
      {
        source: "/shop/tirzepatide",
        destination: "/shop/ep-glp2-t",
        permanent: true,
      },
    ];
  },
};

export default function config(phase: string): NextConfig {
  // Stop a deploy, not a customer's scan, when a vial QR code would open
  // the wrong batch's COA.
  if (phase === PHASE_PRODUCTION_BUILD) checkVialCodes();
  return nextConfig;
}
