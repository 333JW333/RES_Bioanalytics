"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { UserIcon } from "@/components/icons";
import { ACCOUNT_LINKS, isAccountLinkActive } from "@/lib/account-nav";
import { createClient } from "@/lib/supabase/client";
import { useSignOut } from "@/lib/use-sign-out";

// Icon-only circle on phones (matching the cart button), labeled pill from sm up.
const TRIGGER =
  "flex h-10 w-10 items-center justify-center gap-2 rounded-full bg-brand-navy text-xs font-bold uppercase tracking-wider whitespace-nowrap text-white transition-colors hover:bg-brand-navy-2 aria-expanded:bg-brand-navy-2 aria-expanded:ring-2 aria-expanded:ring-brand-teal/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal sm:w-auto sm:px-4";

const ITEM = "block w-full py-2.5 text-left text-[15px] transition-colors";

export default function AccountMenu() {
  const pathname = usePathname();
  const signOut = useSignOut();
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // null until the stored session has been read, so signed-in visitors
  // don't see "Sign in" flash in the header on every page load.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  // The pathname the menu was opened on. Navigating anywhere else closes it
  // without an effect, including via the browser's back button.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setSignedIn(!!session)
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;

    function closeIfOutside(e: Event) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpenOn(null);
    }
    function closeOnEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpenOn(null);
      triggerRef.current?.focus();
    }

    // focusin rather than blur: Safari doesn't focus links on click, so a
    // blur check would close the menu before the click on an item lands.
    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("focusin", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("focusin", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const label = (
    <>
      <span className="hidden sm:inline">{signedIn === false ? "Sign in" : "My Account"}</span>
      <UserIcon className="h-4 w-4" />
    </>
  );

  if (signedIn === null) {
    return (
      <span className={`${TRIGGER} invisible`} aria-hidden="true">
        {label}
      </span>
    );
  }

  if (!signedIn) {
    return (
      <Link href="/register?mode=signin" className={TRIGGER} aria-label="Sign in">
        {label}
      </Link>
    );
  }

  return (
    // Not positioned below sm, so on phones the panel anchors to the header's
    // right-hand button group and stays on screen.
    <div ref={wrapperRef} className="sm:relative">
      <button
        ref={triggerRef}
        type="button"
        className={TRIGGER}
        aria-label="My account"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpenOn(open ? null : pathname)}
      >
        {label}
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-brand-line bg-white px-5 py-2 shadow-lg"
        >
          <ul>
            {ACCOUNT_LINKS.map((link) => {
              const active = isAccountLinkActive(link.href, pathname);
              return (
                <li key={link.href} className="border-b border-brand-line">
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpenOn(null)}
                    className={`${ITEM} ${
                      active
                        ? "font-medium text-brand-navy"
                        : "text-brand-slate-light hover:text-brand-teal-dark"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpenOn(null);
                  signOut();
                }}
                className={`${ITEM} text-brand-slate-light hover:text-brand-teal-dark`}
              >
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
