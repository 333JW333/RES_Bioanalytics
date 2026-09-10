"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark, CartIcon } from "@/components/icons";
import { useCart } from "@/lib/cart-context";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/quality", label: "Quality & COAs" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-line bg-white/95 backdrop-blur">
      <div className="bg-brand-navy text-white text-xs">
        <div className="container-page flex items-center justify-center py-1.5 text-center">
          <span className="badge-ruo !border-transparent !bg-transparent !text-white/90 !px-0">
            For Laboratory &amp; Research Use Only — Not for Human or Animal Consumption
          </span>
        </div>
      </div>
      <div className="container-page flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight text-brand-navy">
            RES Bioanalytics
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-brand-slate">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-teal-dark transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-line text-brand-navy hover:border-brand-teal transition-colors"
            aria-label="View cart"
          >
            <CartIcon className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-teal px-1 text-[11px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-brand-line text-brand-navy"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            <span className="sr-only">Menu</span>
            <div className="flex flex-col gap-1">
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-brand-line bg-white">
          <div className="container-page flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2.5 text-sm font-medium text-brand-slate hover:text-brand-teal-dark"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
