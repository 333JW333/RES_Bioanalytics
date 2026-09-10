import { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/icons";

export default function Disclosure({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="card group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold text-brand-navy">
        {title}
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-brand-slate-light transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-brand-line px-6 pb-6 pt-4">{children}</div>
    </details>
  );
}
