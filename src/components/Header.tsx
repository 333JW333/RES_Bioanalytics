"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CartIcon } from "@/components/icons";
import Logo from "@/components/Logo";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/quality", label: "Quality & COAs" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { itemCount } = useCart();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setSignedIn(!!session)
    );
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await createClient().auth.signOut();
    setOpen(false);
    router.replace("/enter");
    // Drop cached store pages so the proxy re-checks the session next visit.
    router.refresh();
  }

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
        <Link href="/" className="flex items-center">
          <Logo className="h-11 w-auto sm:h-12" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-brand-slate">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-brand-teal-dark transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {signedIn && (
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden lg:inline-flex text-sm font-medium text-brand-slate hover:text-brand-teal-dark transition-colors"
            >
              Sign out
            </button>
          )}
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
            {signedIn && (
              <button
                type="button"
                onClick={handleSignOut}
                className="py-2.5 text-left text-sm font-medium text-brand-slate hover:text-brand-teal-dark"
              >
                Sign out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
