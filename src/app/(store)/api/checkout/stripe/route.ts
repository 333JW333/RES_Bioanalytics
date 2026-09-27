import { NextRequest, NextResponse } from "next/server";
import { priceOrder } from "@/lib/pricing";
import { createCheckoutSession, isStripeConfigured, toCents } from "@/lib/payments/stripe";
import {
  attestationEvidence,
  getOrCreateStripeCustomer,
  insertOrder,
  requireBuyer,
  updateOrder,
} from "@/lib/orders";

/**
 * Card checkout through a Stripe-hosted Checkout page.
 *
 * Order of operations: verify the buyer → price the cart from the catalog →
 * save a `pending` order with the research-use attestation → create the
 * Checkout Session tagged with that order id. The order only becomes `paid`
 * when the webhook (api/webhooks/stripe) hears from Stripe, never from the
 * browser landing on the success page.
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
    const amountCents = lines.reduce((sum, l) => sum + toCents(l.unitPrice) * l.qty, 0);

    const origin = req.nextUrl.origin;

    if (!isStripeConfigured()) {
      const demoUrl = new URL(`${origin}/checkout/success`);
      demoUrl.searchParams.set("method", "card");
      demoUrl.searchParams.set("demo", "1");
      return NextResponse.json({ url: demoUrl.toString(), demo: true });
    }

    const customerId = await getOrCreateStripeCustomer(buyer);
    const orderId = await insertOrder({
      buyer,
      provider: "stripe_checkout",
      status: "pending",
      lines,
      amountCents,
      customerId,
      evidence: attestationEvidence(req),
    });

    const metadata = { order_id: orderId, user_id: buyer.userId };
    const session = await createCheckoutSession(
      {
        mode: "payment",
        customer: customerId,
        client_reference_id: buyer.userId,
        line_items: lines.map((l) => ({
          quantity: l.qty,
          price_data: {
            currency: "usd",
            unit_amount: toCents(l.unitPrice),
            product_data: {
              name: `${l.name} (${l.sizeLabel})`,
              description: "For laboratory research use only. Not for human or animal consumption.",
              metadata: { sku: l.sku },
            },
          },
        })),
        // Shipping page: U.S. addresses only; international is case-by-case via Contact.
        shipping_address_collection: { allowed_countries: ["US"] },
        custom_text: {
          submit: {
            message:
              "By paying you confirm this purchase is for laboratory research use only, per the EcoPeps RUO Policy you accepted.",
          },
        },
        metadata,
        payment_intent_data: {
          metadata,
          description: `EcoPeps order ${orderId}`,
        },
        success_url: `${origin}/checkout/success?method=card&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout`,
      },
      `checkout-${orderId}`
    );

    await updateOrder(orderId, { stripe_checkout_session_id: session.id });

    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return NextResponse.json({ url: session.url, orderId, demo: false });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Unable to start card checkout. Please try again." },
      { status: 500 }
    );
  }
}
