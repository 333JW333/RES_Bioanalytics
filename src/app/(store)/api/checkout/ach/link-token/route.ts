import { NextRequest, NextResponse } from "next/server";
import { createLinkToken, isPlaidConfigured } from "@/lib/payments/plaid";
import { isDwollaConfigured } from "@/lib/payments/dwolla";
import { demoPaymentsAllowed, paymentMethodUnavailable } from "@/lib/payments/demo-mode";

export async function POST(req: NextRequest) {
  try {
    if (!(isPlaidConfigured() && isDwollaConfigured()) && !demoPaymentsAllowed()) {
      return paymentMethodUnavailable();
    }

    const body: { userId?: string } = await req.json().catch(() => ({}));
    const userId = body.userId ?? crypto.randomUUID();
    const result = await createLinkToken(userId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Plaid link token error:", err);
    return NextResponse.json(
      { error: "Unable to initialize bank connection." },
      { status: 500 }
    );
  }
}
