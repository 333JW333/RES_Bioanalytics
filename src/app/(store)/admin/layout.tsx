import type { Metadata } from "next";
import AdminNav from "@/components/AdminNav";
import { requireStaff } from "@/lib/staff";

export const metadata: Metadata = {
  title: { absolute: "Staff | EcoPeps" },
  robots: { index: false, follow: false },
};

/** Staff-only pages. Everyone else gets a 404 (src/lib/staff.ts). */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const staff = await requireStaff();
  return (
    <div className="container-page py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-3xl font-bold text-brand-navy">Staff</h1>
        <p className="text-xs text-brand-slate-light">Signed in as {staff.email}</p>
      </div>
      <AdminNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
