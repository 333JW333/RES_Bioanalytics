import Link from "next/link";
import { LogoMark, CoinIcon, BankIcon, CardIcon } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="mt-20 bg-brand-navy text-white/80">
      <div className="container-page py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <LogoMark />
            <span className="text-white font-bold text-lg">RES Bioanalytics</span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            High-purity reference peptides and research compounds for
            laboratory, analytical, and non-clinical research applications.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-3 tracking-wide uppercase">Shop</h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li><Link href="/shop" className="hover:text-brand-teal">All Products</Link></li>
            <li><Link href="/quality" className="hover:text-brand-teal">Quality &amp; COAs</Link></li>
            <li><Link href="/shipping" className="hover:text-brand-teal">Shipping &amp; Handling</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-3 tracking-wide uppercase">Company</h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li><Link href="/about" className="hover:text-brand-teal">About Us</Link></li>
            <li><Link href="/faq" className="hover:text-brand-teal">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-brand-teal">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-3 tracking-wide uppercase">Legal</h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li><Link href="/legal/ruo-policy" className="hover:text-brand-teal">RUO Policy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-brand-teal">Terms of Sale</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-brand-teal">Privacy Policy</Link></li>
            <li><Link href="/legal/refunds" className="hover:text-brand-teal">Refund Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><CoinIcon className="h-4 w-4" /> Crypto</span>
            <span className="inline-flex items-center gap-1.5"><BankIcon className="h-4 w-4" /> ACH Bank Transfer</span>
            <span className="inline-flex items-center gap-1.5"><CardIcon className="h-4 w-4" /> Card</span>
            <span className="inline-flex items-center gap-1.5 opacity-40"><CardIcon className="h-4 w-4" /> PayPal (coming soon)</span>
          </div>
          <p>© {new Date().getFullYear()} RES Bioanalytics. All rights reserved.</p>
        </div>
        <div className="container-page pb-8">
          <p className="text-[11px] leading-relaxed text-white/40">
            All products sold by RES Bioanalytics are intended strictly for
            laboratory, analytical, and in-vitro research use by qualified
            professionals and institutions. These products are not drugs,
            biologics, dietary supplements, cosmetics, or foods, are not
            approved by the FDA or any regulatory body for human or animal
            use, and are not intended to diagnose, treat, cure, or prevent
            any disease. Not for human or animal consumption. See our{" "}
            <Link href="/legal/ruo-policy" className="underline hover:text-brand-teal">
              Research Use Only Policy
            </Link>{" "}
            for full terms.
          </p>
        </div>
      </div>
    </footer>
  );
}
