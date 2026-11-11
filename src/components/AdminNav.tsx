"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders to ship" },
  { href: "/admin/restock", label: "Back in stock" },
] as const;

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Staff pages" className="flex flex-wrap gap-2 border-b border-brand-line pb-3">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              active ? "bg-brand-navy text-white" : "text-brand-slate hover:bg-brand-ice hover:text-brand-navy"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
