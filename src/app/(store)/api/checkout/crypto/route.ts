import { NextRequest, NextResponse } from "next/server";
import { createCoinbaseCharge } from "@/lib/payments/coinbase";
import { priceOrder } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string | undefined = body.email;

    const order = priceOrder(body.items);
    if (!order.ok) {
      return NextResponse.json({ error: order.error }, { status: 400 });
    }
    const { lines, total } = order;

    const orderId = crypto.randomUUID();
    const origin = req.nextUrl.origin;
    const description = lines
      .map((i) => `${i.qty}x ${i.name} (${i.sizeLabel})`)
      .join(", ");

    const charge = await createCoinbaseCharge({
      name: "EcoPeps Order",
      description,
      amountUsd: total,
      orderId,
      customerEmail: email,
      redirectUrl: `${origin}/checkout/success`,
      cancelUrl: `${origin}/checkout`,
    });

    return NextResponse.json({
      url: charge.hostedUrl,
      orderId,
      demo: charge.demo,
    });
  } catch (err) {
    console.error("Crypto checkout error:", err);
    return NextResponse.json(
      { error: "Unable to start crypto checkout. Please try again." },
      { status: 500 }
    );
  }
}
