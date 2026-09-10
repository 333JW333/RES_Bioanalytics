import { NextRequest, NextResponse } from "next/server";
import { createPayramPayment } from "@/lib/payments/payram";

interface CheckoutItem {
  name: string;
  sizeLabel: string;
  qty: number;
  unitPrice: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CheckoutItem[] = body.items ?? [];
    const email: string | undefined = body.email;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const total = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
    if (total <= 0) {
      return NextResponse.json({ error: "Invalid order total." }, { status: 400 });
    }

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
