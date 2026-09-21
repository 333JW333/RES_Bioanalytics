import Link from "next/link";
import { ShieldCheckIcon } from "@/components/icons";

export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success">
) {
  const searchParams = await props.searchParams;
  const order = typeof searchParams.order === "string" ? searchParams.order : undefined;
  const demo = searchParams.demo === "1";
  const method = typeof searchParams.method === "string" ? searchParams.method : "crypto";

  return (
    <div className="container-page py-24 text-center">
      <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/15 text-brand-teal-dark">
        <ShieldCheckIcon className="h-7 w-7" />
      </span>
      <h1 className="text-3xl font-bold text-brand-navy mb-3">Order Received</h1>
      <p className="text-brand-slate-light max-w-md mx-auto mb-2">
        Thank you for your order via{" "}
        {method === "ach" ? "ACH bank transfer" : method === "card" ? "card" : "crypto"}.
        A confirmation email with tracking details will follow once payment
        is verified.
      </p>
      {order && (
        <p className="text-sm text-brand-slate-light mb-8">
          Order reference: <span className="font-mono text-brand-navy">{order}</span>
        </p>
      )}
      {demo && (
        <p className="max-w-md mx-auto mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Demo mode: no live payment processor keys are configured yet, so
          this order was simulated. Add your Coinbase Commerce / Plaid /
          Dwolla / PayRam credentials to process real payments.
        </p>
      )}
      <Link href="/shop" className="btn-primary">Continue Shopping</Link>
    </div>
  );
}
