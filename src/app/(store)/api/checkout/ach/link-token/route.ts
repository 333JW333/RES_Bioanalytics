import { NextRequest, NextResponse } from "next/server";
import { createLinkToken, isPlaidConfigured } from "@/lib/payments/plaid";
import { isDwollaConfigured } from "@/lib/payments/dwolla";
import { demoPaymentsAllowed, paymentMethodUnavailable } from "@/lib/payments/demo-mode";
import { isMethodEnabled } from "@/lib/payments/methods";

export async function POST(req: NextRequest) {
  // Turned off until this method is set up (src/lib/payments/methods.ts).
  if (!isMethodEnabled("ach")) return paymentMethodUnavailable();

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
