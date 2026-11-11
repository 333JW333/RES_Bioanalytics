import type { Metadata } from "next";
import Link from "next/link";
import AccountEmptyState from "@/components/AccountEmptyState";
import { formatUSD } from "@/lib/format";
import { customerOrderStatus, isVisibleToCustomer, type CustomerOrderStatus } from "@/lib/order-display";
import { formatOrderRef, type OrderStatus } from "@/lib/orders";
import type { ShippingAddress } from "@/lib/payments/types";
import type { PricedLine } from "@/lib/pricing";
import { trackingUrl } from "@/lib/shipping";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Orders" };

interface CustomerOrder {
  id: string;
  created_at: string;
  status: OrderStatus;
  payment_flow: "checkout" | "invoice";
  amount_cents: number;
  items: PricedLine[];
  shipping: ShippingAddress | null;
  po_number: string | null;
  shipped_at: string | null;
  carrier: string | null;
  tracking_number: string | null;
}

const TONE: Record<CustomerOrderStatus["tone"], string> = {
  good: "bg-brand-teal/15 text-brand-teal-dark",
  waiting: "bg-amber-50 text-amber-800",
  bad: "bg-red-50 text-red-700",
  neutral: "bg-slate-100 text-brand-slate",
};

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: "America/Denver", dateStyle: "medium" });

export default async function AccountOrdersPage() {
  // Row-level security returns only the signed-in customer's own orders.
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, status, payment_flow, amount_cents, items, shipping, po_number, shipped_at, carrier, tracking_number"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) console.error("Could not load orders", error.message);

  const orders = ((data ?? []) as CustomerOrder[]).filter((o) => isVisibleToCustomer(o.status, o.created_at));

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-brand-navy">Orders</h2>
      {orders.length === 0 ? (
        <AccountEmptyState
          title="No orders yet"
          actions={
            <>
              <Link href="/shop" className="btn-primary text-sm">Browse Catalog</Link>
              <Link href="/contact" className="btn-secondary text-sm">Contact Us</Link>
            </>
          }
        >
          Orders you place appear here, with their status and tracking once
          they ship.
        </AccountEmptyState>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <OrderCard order={o} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function OrderCard({ order: o }: { order: CustomerOrder }) {
  const status = customerOrderStatus(o.status, o.shipped_at);
  const track = trackingUrl(o.carrier, o.tracking_number);
  const ship = o.shipping;

  return (
    <article className="card p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-brand-navy">
            Order <span className="font-mono">{formatOrderRef(o.id)}</span>
          </p>
          <p className="text-xs text-brand-slate-light">
            Placed {date(o.created_at)}
            {o.payment_flow === "invoice" ? " · Net 30 invoice" : ""}
            {o.po_number ? ` · PO ${o.po_number}` : ""}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${TONE[status.tone]}`}>{status.label}</span>
      </header>

      <ul className="mt-4 divide-y divide-brand-line border-y border-brand-line text-sm">
        {o.items.map((l) => (
          <li key={l.sku} className="flex justify-between gap-3 py-2">
            <span className="text-brand-slate">
              {l.qty} × {l.name} ({l.sizeLabel})
            </span>
            <span className="whitespace-nowrap font-medium text-brand-navy">
              {formatUSD((Math.round(l.unitPrice * 100) * l.qty) / 100)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex justify-between text-sm font-semibold text-brand-navy">
        <span>Total</span>
        <span>{formatUSD(o.amount_cents / 100)}</span>
      </p>

      {(o.shipped_at || ship) && (
        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {o.shipped_at && (
            <div>
              <p className="text-xs font-medium text-brand-slate-light">Shipped {date(o.shipped_at)}</p>
              <p className="text-brand-navy">
                {o.carrier} {o.tracking_number}
              </p>
              {track && (
                <a href={track} target="_blank" rel="noopener noreferrer" className="text-brand-teal-dark underline">
                  Track package
                </a>
              )}
            </div>
          )}
          {ship && (
            <div>
              <p className="text-xs font-medium text-brand-slate-light">Shipping to</p>
              <p className="text-brand-navy">
                {[ship.name, ship.line1, ship.line2, [ship.city, [ship.state, ship.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ")]
                  .filter(Boolean)
                  .map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
