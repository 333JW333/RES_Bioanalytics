import { NextRequest, NextResponse } from "next/server";
import { initiateAchTransfer, isDwollaConfigured } from "@/lib/payments/dwolla";
import { demoPaymentsAllowed, paymentMethodUnavailable } from "@/lib/payments/demo-mode";
import { isMethodEnabled } from "@/lib/payments/methods";
import { priceOrder } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  // Turned off until this method is set up (src/lib/payments/methods.ts).
  if (!isMethodEnabled("ach")) return paymentMethodUnavailable();

  try {
    const body = await req.json();
    const { fundingSourceUrl } = body as { fundingSourceUrl?: string };

    if (!fundingSourceUrl) {
      return NextResponse.json({ error: "Invalid transfer request." }, { status: 400 });
    }

    const order = priceOrder(body.items);
    if (!order.ok) {
      return NextResponse.json({ error: order.error }, { status: 400 });
    }

    const orderId = crypto.randomUUID();

    // The funding source URL comes from the browser, so a "demo-" one is only
    // honored where demo mode is allowed.
    if (!isDwollaConfigured() || fundingSourceUrl.includes("demo-")) {
      if (!demoPaymentsAllowed()) return paymentMethodUnavailable();
      return NextResponse.json({
        transferUrl: `https://api-sandbox.dwolla.com/transfers/demo-${orderId}`,
        orderId,
        demo: true,
      });
    }

    const transferUrl = await initiateAchTransfer({
      sourceFundingSourceUrl: fundingSourceUrl,
      amountUsd: order.total,
      orderId,
    });

    return NextResponse.json({ transferUrl, orderId, demo: false });
  } catch (err) {
    console.error("ACH transfer error:", err);
    return NextResponse.json(
      { error: "Unable to complete the bank transfer. Please try again." },
      { status: 500 }
    );
  }
}
