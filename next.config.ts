import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { checkVialCodes } from "./src/data/check-vial-codes";
import { CSP_REPORT_GROUP, CSP_REPORT_PATH, contentSecurityPolicy } from "./src/lib/csp";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Report-only: browsers report what the policy would block to
  // /api/csp-report and block nothing. See src/lib/csp.ts before enforcing.
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicy({
      dev: process.env.NODE_ENV === "development",
      preview: process.env.VERCEL_ENV === "preview",
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }),
  },
  { key: "Reporting-Endpoints", value: `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"` },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Staff -> Progress reads the backlog file at request time.
  outputFileTracingIncludes: {
    "/admin/progress": ["./docs/BACKLOG.md"],
  },
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
    // from "retatrutide". Keep links to the old locations (bookmarks, search
    // results, shared links) opening the same files and page. The PDF's rule
    // comes before its folder's, since the first match wins.
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
      // EP-GLP2-T's product page was renamed the same way.
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
