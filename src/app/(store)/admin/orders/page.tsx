import type { Metadata } from "next";
import AdminNotice from "@/components/AdminNotice";
import { mountainTime } from "@/lib/email/account-emails";
import { addressLines } from "@/lib/email/layout";
import { formatUSD } from "@/lib/format";
import { SHIPPABLE, shippedNoticeKey } from "@/lib/order-lifecycle";
import { formatOrderRef, type OrderStatus } from "@/lib/orders";
import type { ShippingAddress } from "@/lib/payments/types";
import type { PricedLine } from "@/lib/pricing";
import { CARRIERS, trackingUrl } from "@/lib/shipping";
import { createAdminClient } from "@/lib/supabase/admin";
import { resendShipped, shipOrder } from "../actions";
import { requireStaff } from "@/lib/staff";

export const metadata: Metadata = { title: { absolute: "Orders to ship | Staff | EcoPeps" } };

interface StaffOrder {
  id: string;
  created_at: string;
  paid_at: string | null;
  email: string;
  status: OrderStatus;
  payment_flow: "checkout" | "invoice";
  amount_cents: number;
  items: PricedLine[];
  shipping: ShippingAddress | null;
  po_number: string | null;
  shipped_at: string | null;
  carrier: string | null;
  tracking_number: string | null;
  notifications_sent: string[] | null;
}

const COLUMNS =
  "id, created_at, paid_at, email, status, payment_flow, amount_cents, items, shipping, po_number, " +
  "shipped_at, carrier, tracking_number, notifications_sent";

const SHIPPED_DAYS = 30;

/** When the "Shipped" list starts. */
function shippedListStart(now = Date.now()): string {
  return new Date(now - SHIPPED_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

const NOTICES: Record<string, { tone: "good" | "bad"; text: (ref: string) => string }> = {
  shipped_sent: { tone: "good", text: (r) => `Order ${r} is marked shipped, and the buyer has been emailed the tracking details.` },
  shipped_failed: { tone: "bad", text: (r) => `Order ${r} is marked shipped, but the email to the buyer failed. Use "Resend email" below.` },
  shipped_skipped: { tone: "bad", text: (r) => `Order ${r} is marked shipped. Email isn't set up, so the buyer wasn't emailed.` },
  updated_sent: { tone: "good", text: (r) => `Tracking for order ${r} is updated, and the buyer has been emailed the new details.` },
  updated_failed: { tone: "bad", text: (r) => `Tracking for order ${r} is updated, but the email to the buyer failed. Use "Resend email" below.` },
  updated_skipped: { tone: "bad", text: (r) => `Tracking for order ${r} is updated. Email isn't set up, so the buyer wasn't emailed.` },
  resent_sent: { tone: "good", text: (r) => `The shipped email for order ${r} was sent again.` },
  resent_failed: { tone: "bad", text: (r) => `The shipped email for order ${r} failed again. Please try later, or email the buyer yourself.` },
  resent_skipped: { tone: "bad", text: (r) => `Nothing was sent for order ${r}: it has no tracking number, or email isn't set up.` },
  not_shippable: { tone: "bad", text: (r) => `Order ${r} can't be marked shipped: it isn't paid, or it was refunded in full or disputed.` },
  bad_tracking: { tone: "bad", text: (r) => `Check the tracking number for order ${r}: 5 to 40 letters, digits, spaces or dashes.` },
  save_failed: { tone: "bad", text: () => "That didn't save. Please try again." },
};

function noticeFor(code: unknown, ref: unknown) {
  const notice = typeof code === "string" ? NOTICES[code] : undefined;
  if (!notice) return null;
  const safeRef = typeof ref === "string" && /^[0-9A-F]{8}$/.test(ref) ? ref : "";
  return { tone: notice.tone, text: notice.text(safeRef) };
}

export default async function StaffOrdersPage(props: PageProps<"/admin/orders">) {
  // Checked here, before any data loads: the layout's check doesn't stop the
  // page rendering alongside it.
  await requireStaff();
  const { notice, ref } = await props.searchParams;
  const admin = createAdminClient();
  const shippedSince = shippedListStart();

  const [toShip, waiting, shipped] = await Promise.all([
    admin.from("orders").select(COLUMNS).in("status", SHIPPABLE).is("shipped_at", null).order("paid_at").limit(100),
    admin
      .from("orders")
      .select(COLUMNS)
      .in("status", ["processing", "invoice_requested"])
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("orders")
      .select(COLUMNS)
      .gte("shipped_at", shippedSince)
      .order("shipped_at", { ascending: false })
      .limit(100),
  ]);
  for (const r of [toShip, waiting, shipped]) if (r.error) console.error("Staff orders query failed", r.error.message);

  const rows = (r: { data: unknown }) => (r.data ?? []) as StaffOrder[];

  return (
    <>
      <AdminNotice notice={noticeFor(notice, ref)} />

      <Section title="Paid, ready to ship" count={rows(toShip).length} empty="Nothing to ship right now.">
        {rows(toShip).map((o) => (
          <OrderCard key={o.id} order={o}>
            <ShipForm orderId={o.id} submitLabel="Mark shipped & email buyer" />
          </OrderCard>
        ))}
      </Section>

      <Section
        title="Waiting on payment"
        count={rows(waiting).length}
        empty="No bank payments or invoices outstanding."
        note="Don't ship these yet. They move to Ready to ship once payment clears."
      >
        {rows(waiting).map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </Section>

      <Section
        title={`Shipped in the last ${SHIPPED_DAYS} days`}
        count={rows(shipped).length}
        empty="No recent shipments."
      >
        {rows(shipped).map((o) => (
          <OrderCard key={o.id} order={o}>
            <ShippedDetails order={o} />
          </OrderCard>
        ))}
      </Section>
    </>
  );
}

function Section({
  title,
  count,
  empty,
  note,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-brand-navy">
        {title} <span className="text-base font-normal text-brand-slate-light">({count})</span>
      </h2>
      {note && <p className="mt-1 text-sm text-brand-slate-light">{note}</p>}
      {count === 0 ? (
        <p className="card mt-4 px-5 py-6 text-sm text-brand-slate-light">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-4">{children}</ul>
      )}
    </section>
  );
}

const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  paid: "Paid",
  partially_refunded: "Paid, partly refunded",
  processing: "Bank payment processing",
  invoice_requested: "Invoice requested",
};

function OrderCard({ order: o, children }: { order: StaffOrder; children?: React.ReactNode }) {
  const address = o.shipping ? addressLines(o.shipping) : [];
  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-brand-navy">
            Order <span className="font-mono">{formatOrderRef(o.id)}</span>
            <span className="ml-2 text-sm font-normal text-brand-slate">{formatUSD(o.amount_cents / 100)}</span>
          </p>
          <p className="text-xs text-brand-slate-light">
            {STATUS_LABEL[o.status] ?? o.status}
            {o.paid_at ? ` ${mountainTime(o.paid_at)}` : ` · placed ${mountainTime(o.created_at)}`}
            {o.payment_flow === "invoice" ? " · Net 30 invoice" : ""}
            {o.po_number ? ` · PO ${o.po_number}` : ""}
          </p>
          <p className="mt-1 text-sm text-brand-slate">{o.email}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-brand-slate-light">Pack</p>
          <ul className="text-brand-navy">
            {o.items.map((l) => (
              <li key={l.sku}>
                <span className="font-semibold">{l.qty} ×</span> {l.name} ({l.sizeLabel}){" "}
                <span className="font-mono text-xs text-brand-slate-light">{l.sku}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-brand-slate-light">Ship to</p>
          {address.length ? (
            <p className="text-brand-navy">
              {address.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-red-700">No shipping address on file. Contact the buyer before shipping.</p>
          )}
        </div>
      </div>

      {children}
    </li>
  );
}

function ShipForm({
  orderId,
  submitLabel,
  carrier,
  trackingNumber,
}: {
  orderId: string;
  submitLabel: string;
  carrier?: string | null;
  trackingNumber?: string | null;
}) {
  return (
    <form action={shipOrder} className="mt-5 grid gap-3 border-t border-brand-line pt-4 sm:grid-cols-[9rem_1fr_auto] sm:items-end">
      <input type="hidden" name="orderId" value={orderId} />
      <label className="text-xs font-medium text-brand-slate">
        Carrier
        <select name="carrier" defaultValue={carrier ?? "USPS"} className="input mt-1" required>
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-brand-slate">
        Tracking number
        <input
          name="trackingNumber"
          defaultValue={trackingNumber ?? ""}
          className="input mt-1 font-mono"
          required
          minLength={5}
          maxLength={40}
          pattern="[A-Za-z0-9 \-]{5,40}"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <button type="submit" className="btn-primary text-sm">
        {submitLabel}
      </button>
    </form>
  );
}

function ShippedDetails({ order: o }: { order: StaffOrder }) {
  const track = trackingUrl(o.carrier, o.tracking_number);
  const emailed = (o.notifications_sent ?? []).includes(shippedNoticeKey(o.carrier, o.tracking_number));
  return (
    <div className="mt-5 border-t border-brand-line pt-4 text-sm">
      <p className="text-brand-navy">
        Shipped {o.shipped_at ? mountainTime(o.shipped_at) : ""} via {o.carrier}{" "}
        <span className="font-mono">{o.tracking_number}</span>
        {track && (
          <>
            {" · "}
            <a href={track} target="_blank" rel="noopener noreferrer" className="text-brand-teal-dark underline">
              Track
            </a>
          </>
        )}
      </p>
      <p className={`mt-1 text-xs ${emailed ? "text-brand-teal-dark" : "text-red-700"}`}>
        {emailed ? "Buyer emailed the tracking details." : "The buyer hasn't been emailed these tracking details."}
      </p>
      <div className="mt-3 flex flex-wrap items-start gap-3">
        <form action={resendShipped}>
          <input type="hidden" name="orderId" value={o.id} />
          <button type="submit" className="btn-secondary text-sm">
            {emailed ? "Resend email" : "Send email"}
          </button>
        </form>
        <details className="min-w-0 flex-1">
          <summary className="cursor-pointer py-2 text-sm text-brand-slate hover:text-brand-navy">
            Fix the carrier or tracking number
          </summary>
          <ShipForm
            orderId={o.id}
            submitLabel="Save & email buyer"
            carrier={o.carrier}
            trackingNumber={o.tracking_number}
          />
        </details>
      </div>
    </div>
  );
}
