import { NextRequest, NextResponse } from "next/server";
import { createCoinbaseCharge } from "@/lib/payments/coinbase";

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
    const description = items
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
