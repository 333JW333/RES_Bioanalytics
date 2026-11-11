import { NextRequest, NextResponse } from "next/server";
import { priceOrder } from "@/lib/pricing";
import { demoPaymentsAllowed, paymentMethodUnavailable } from "@/lib/payments/demo-mode";
import { getActiveProcessor } from "@/lib/payments/processors";
import {
  amountCentsFor,
  attestationEvidence,
  checkoutBuyer,
  insertOrder,
  requireBuyer,
  updateOrder,
} from "@/lib/orders";

/**
 * Card (and bank) checkout on the active processor's hosted payment page.
 *
 * Order of operations: verify the buyer → price the cart from the catalog →
 * save a `pending` order with the research-use attestation → hand off to the
 * processor. The order only becomes `paid` when the processor confirms it
 * (webhook or return-page check), never from the browser alone.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireBuyer();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { buyer } = auth;

    const body = await req.json();
    if (body?.ruoAttested !== true) {
      return NextResponse.json(
        { error: "Please confirm the research-use attestation before paying." },
        { status: 400 }
      );
    }

    const order = priceOrder(body.items);
    if (!order.ok) return NextResponse.json({ error: order.error }, { status: 400 });
    const { lines } = order;

    const origin = req.nextUrl.origin;
    const processor = getActiveProcessor();

    if (!processor.isConfigured()) {
      if (!demoPaymentsAllowed()) return paymentMethodUnavailable();
      const demoUrl = new URL(`${origin}/checkout/success`);
      demoUrl.searchParams.set("method", "card");
      demoUrl.searchParams.set("demo", "1");
      return NextResponse.json({ url: demoUrl.toString(), demo: true });
    }

    const orderId = await insertOrder({
      buyer,
      processor: processor.id,
      flow: "checkout",
      status: "pending",
      lines,
      amountCents: amountCentsFor(lines),
      evidence: attestationEvidence(req),
    });

    const checkout = await processor.createCheckout({
      orderId,
      buyer: checkoutBuyer(buyer),
      lines,
      successUrl: `${origin}/checkout/success?order=${orderId}`,
      cancelUrl: `${origin}/checkout`,
    });

    await updateOrder(orderId, {
      processor_checkout_id: checkout.checkoutId,
      processor_customer_id: checkout.customerId,
    });

    return NextResponse.json({ url: checkout.redirectUrl, orderId, demo: false });
  } catch (err) {
    console.error("Card checkout error:", err);
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 }
    );
  }
}
