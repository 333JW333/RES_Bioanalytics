import { Metadata } from "next";
import Link from "next/link";
import CertificateLibrary from "@/components/CertificateLibrary";

export const metadata: Metadata = {
  title: "Verify a Lot | Certificates of Analysis",
  description:
    "Search EcoPeps lot records by product, lot number, or laboratory. View purity, test methods, dates, and certificates of analysis.",
};

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="bg-brand-ice/40">
      <div className="container-page py-16">
        <div className="mb-10 max-w-3xl">
          <span className="badge-verified mb-4">Lot verification</span>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            Verify a Lot
          </h1>
          <p className="text-base leading-relaxed text-brand-slate">
            Every released EcoPeps lot is listed here with identity and purity
            results. Search publicly — no account required. Sample records are
            shown for development; replace with live lab-issued COAs before launch.
          </p>
          <p className="mt-3 text-sm text-brand-slate-light">
            Prefer the process overview? See{" "}
            <Link href="/quality" className="font-medium text-brand-blue hover:underline">
              Quality &amp; testing
            </Link>
            .
          </p>
        </div>

        <CertificateLibrary initialQuery={q ?? ""} />
      </div>
    </div>
  );
}
