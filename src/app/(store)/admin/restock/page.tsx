import type { Metadata } from "next";
import Link from "next/link";
import AdminNotice from "@/components/AdminNotice";
import { getAllProducts, getProductBySlug } from "@/data/products";
import { mountainTime } from "@/lib/email/account-emails";
import { isSoldOut } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailBackInStock } from "../actions";

export const metadata: Metadata = { title: { absolute: "Back in stock | Staff | EcoPeps" } };

interface Demand {
  waiting: number;
  notified: number;
  lastNotified: string | null;
}

function noticeFor(params: Record<string, string | string[] | undefined>) {
  const str = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const name = getProductBySlug(str("slug"))?.name ?? "that product";
  const sent = Number(str("sent")) || 0;
  const failed = Number(str("failed")) || 0;
  switch (str("notice")) {
    case "sent":
      return { tone: "good" as const, text: `Emailed ${sent} ${sent === 1 ? "person" : "people"} that ${name} is back in stock.` };
    case "partial":
      return {
        tone: "bad" as const,
        text: `Emailed ${sent} about ${name}, but ${failed} didn't send. They're still on the list; click Email again to retry them.`,
      };
    case "confirm":
      return { tone: "bad" as const, text: `Tick the box to confirm ${name} shows as in stock on the site, then click Email.` };
    case "still_sold_out":
      return { tone: "bad" as const, text: `${name} still shows as out of stock on the site, so nothing was sent.` };
    case "nobody_waiting":
      return { tone: "good" as const, text: `Nobody is waiting for ${name} any more.` };
    case "email_off":
      return { tone: "bad" as const, text: "Email isn't set up (RESEND_API_KEY), so nothing was sent." };
    case "failed":
    case "unknown_product":
      return { tone: "bad" as const, text: `The emails for ${name} didn't send. Nobody was marked as emailed; please try again.` };
    default:
      return null;
  }
}

export default async function StaffRestockPage(props: PageProps<"/admin/restock">) {
  const params = await props.searchParams;
  const admin = createAdminClient();
  const { data, error } = await admin.from("restock_requests").select("product_slug, notified_at");
  if (error) console.error("Restock requests query failed", error.message);

  const demand = new Map<string, Demand>();
  for (const r of (data ?? []) as { product_slug: string; notified_at: string | null }[]) {
    const d = demand.get(r.product_slug) ?? { waiting: 0, notified: 0, lastNotified: null };
    if (r.notified_at) {
      d.notified += 1;
      if (!d.lastNotified || r.notified_at > d.lastNotified) d.lastNotified = r.notified_at;
    } else {
      d.waiting += 1;
    }
    demand.set(r.product_slug, d);
  }

  const products = getAllProducts()
    .map((p) => ({ product: p, soldOut: isSoldOut(p), demand: demand.get(p.slug) }))
    .sort((a, b) => (b.demand?.waiting ?? 0) - (a.demand?.waiting ?? 0));

  return (
    <>
      <AdminNotice notice={noticeFor(params)} />
      <h2 className="text-xl font-semibold text-brand-navy">Back-in-stock emails</h2>
      <p className="mt-1 max-w-3xl text-sm text-brand-slate">
        Customers who clicked &quot;Notify me when available&quot; on a sold-out product. Once a new batch passes
        its COA and the site shows the product in stock (README: &quot;Adding a batch&quot;), email everyone waiting.
        Each person gets one email, then leaves the list.
      </p>

      <ul className="mt-6 space-y-4">
        {products.map(({ product, soldOut, demand: d }) => (
          <li key={product.slug} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-brand-navy">
                  <Link href={`/shop/${product.slug}`} className="hover:underline">
                    {product.name}
                  </Link>
                </p>
                <p className={`text-xs ${soldOut ? "text-amber-800" : "text-brand-teal-dark"}`}>
                  {soldOut ? "Out of stock on the site" : "In stock on the site"}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-brand-navy">{d?.waiting ?? 0} waiting</p>
                {d?.lastNotified && (
                  <p className="text-xs text-brand-slate-light">
                    {d.notified} emailed, last {mountainTime(d.lastNotified)}
                  </p>
                )}
              </div>
            </div>

            {(d?.waiting ?? 0) > 0 &&
              (soldOut ? (
                <p className="mt-4 border-t border-brand-line pt-3 text-xs text-brand-slate-light">
                  The email button appears here once the site shows {product.name} in stock.
                </p>
              ) : (
                <form
                  action={emailBackInStock}
                  className="mt-4 flex flex-wrap items-center gap-4 border-t border-brand-line pt-4"
                >
                  <input type="hidden" name="slug" value={product.slug} />
                  <label className="flex items-center gap-2 text-sm text-brand-slate">
                    <input type="checkbox" name="confirm" value="yes" required className="h-4 w-4" />
                    I checked the product page: it shows in stock with the new batch&apos;s COA.
                  </label>
                  <button type="submit" className="btn-primary text-sm">
                    Email {d?.waiting} {d?.waiting === 1 ? "person" : "people"}
                  </button>
                </form>
              ))}
          </li>
        ))}
      </ul>
    </>
  );
}
