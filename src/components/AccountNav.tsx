"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_LINKS, isAccountLinkActive } from "@/lib/account-nav";
import { useSignOut } from "@/lib/use-sign-out";

const ITEM = "block w-full border-l-2 px-5 py-2.5 text-left text-sm transition-colors";

// Desktop sidebar only; on smaller screens the header's My Account menu
// lists the same sections.
export default function AccountNav() {
  const pathname = usePathname();
  const signOut = useSignOut();

  return (
    <nav aria-label="My account" className="hidden lg:block">
      <ul className="card overflow-hidden py-2">
        {ACCOUNT_LINKS.map((link) => {
          const active = isAccountLinkActive(link.href, pathname);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`${ITEM} ${
                  active
                    ? "border-brand-teal bg-brand-ice font-semibold text-brand-navy"
                    : "border-transparent text-brand-slate hover:text-brand-teal-dark"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
        <li className="mt-2 border-t border-brand-line pt-2">
          <button
            type="button"
            onClick={signOut}
            className={`${ITEM} border-transparent text-brand-slate hover:text-brand-teal-dark`}
          >
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  );
}
