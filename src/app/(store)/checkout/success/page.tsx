import Link from "next/link";
import { ShieldCheckIcon } from "@/components/icons";
import ClearCartOnMount from "@/components/ClearCartOnMount";
import { refreshPendingOrder } from "@/lib/order-lifecycle";
import { formatOrderRef, type OrderStatus } from "@/lib/orders";
import { SUPPORT_EMAIL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

interface OwnOrder {
  id: string;
  status: OrderStatus;
  email: string;
  processor: string;
  processor_checkout_id: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The signed-in buyer's own order. RLS returns nothing for anyone else's. */
async function loadOwnOrder(orderId: string): Promise<OwnOrder | null> {
  if (!UUID_RE.test(orderId)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, status, email, processor, processor_checkout_id")
    .eq("id", orderId)
    .maybeSingle<OwnOrder>();
  return data;
}

interface View {
  heading: string;
  body: string;
  success: boolean;
}

function viewFor(order: OwnOrder): View {
  switch (order.status) {
    case "paid":
      return {
        heading: "Order Confirmed",
        body: `Thank you! Your payment went through, and we've emailed your confirmation to ${order.email}. We'll email tracking details when your order ships.`,
        success: true,
      };
    case "processing":
      return {
        heading: "Payment Processing",
        body: `Your bank payment is processing; it usually clears within 4 business days. We've emailed ${order.email} and will email again once it clears. Your order ships after that.`,
        success: true,
      };
    case "pending":
      return {
        heading: "Confirming Your Payment",
        body: `We're still confirming your payment. We'll email ${order.email} as soon as it's confirmed, usually within a minute.`,
        success: true,
      };
    case "invoice_requested":
      return {
        heading: "Invoice Requested",
        body: `We'll review your order and email a Net 30 invoice to ${order.email}. Your order ships once the invoice is paid.`,
        success: true,
      };
    case "payment_failed":
    case "canceled":
      return {
        heading: "Payment Not Completed",
        body: "This order wasn't paid, so it won't ship. Your cart is still saved; return to checkout to try again.",
        success: false,
      };
    default:
      return {
        heading: "Order Status",
        body: `Questions about this order? Email ${SUPPORT_EMAIL} with the reference below.`,
        success: false,
      };
  }
}

export default async function CheckoutSuccessPage(props: PageProps<"/checkout/success">) {
  const searchParams = await props.searchParams;

  if (searchParams.demo === "1") {
    return (
      <div className="container-page py-24 text-center">
        <ClearCartOnMount />
        <h1 className="text-3xl font-bold text-brand-navy mb-3">Order Received (Demo)</h1>
        <p className="max-w-md mx-auto mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Demo mode: this payment method has no processor keys here, so the
          order was simulated. Nothing was charged or saved.
        </p>
        <Link href="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const orderId = typeof searchParams.order === "string" ? searchParams.order : "";
  let order = orderId ? await loadOwnOrder(orderId) : null;

  // Back before the processor's webhook? Ask the processor directly.
  if (order?.status === "pending") {
    try {
      await refreshPendingOrder(order);
      order = (await loadOwnOrder(order.id)) ?? order;
    } catch (err) {
      console.error(`Could not refresh order ${order.id}`, err);
    }
  }

  if (!order) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold text-brand-navy mb-3">Order Not Found</h1>
        <p className="text-brand-slate-light max-w-md mx-auto mb-8">
          We couldn&apos;t find this order on your account. If you were charged,
          you&apos;ll receive a confirmation email shortly. Otherwise, please
          return to checkout and try again, or email {SUPPORT_EMAIL}.
        </p>
        <Link href="/checkout" className="btn-primary">Back to Checkout</Link>
      </div>
    );
  }

  const view = viewFor(order);
  return (
    <div className="container-page py-24 text-center">
      {view.success && <ClearCartOnMount />}
      {view.success && (
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal-dark">
          <ShieldCheckIcon className="h-7 w-7" />
        </span>
      )}
      <h1 className="text-3xl font-bold text-brand-navy mb-3">{view.heading}</h1>
      <p className="text-brand-slate-light max-w-md mx-auto mb-2">{view.body}</p>
      <p className="text-sm text-brand-slate-light mb-8">
        Order reference: <span className="font-mono text-brand-navy">{formatOrderRef(order.id)}</span>
      </p>
      <Link href={view.success ? "/shop" : "/checkout"} className="btn-primary">
        {view.success ? "Continue Shopping" : "Back to Checkout"}
      </Link>
    </div>
  );
}
