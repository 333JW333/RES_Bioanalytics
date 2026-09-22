import { NextRequest, NextResponse } from "next/server";
import { createPayramPayment } from "@/lib/payments/payram";
import { priceOrder } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string | undefined = body.email;

    const order = priceOrder(body.items);
    if (!order.ok) {
      return NextResponse.json({ error: order.error }, { status: 400 });
    }
    const { total } = order;

    const orderId = crypto.randomUUID();
    const origin = req.nextUrl.origin;

    const payment = await createPayramPayment({
      amountUsd: total,
      orderId,
      customerEmail: email,
      redirectUrl: `${origin}/checkout/success?method=card`,
    });

    return NextResponse.json({
      url: payment.paymentUrl,
      orderId,
      demo: payment.demo,
    });
  } catch (err) {
    console.error("PayRam checkout error:", err);
    return NextResponse.json(
      { error: "Unable to start card checkout. Please try again." },
      { status: 500 }
    );
  }
}
