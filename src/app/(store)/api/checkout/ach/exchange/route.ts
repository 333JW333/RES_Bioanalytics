import { NextRequest, NextResponse } from "next/server";
import { createDwollaProcessorToken, isPlaidConfigured } from "@/lib/payments/plaid";
import { attachFundingSource, findOrCreateCustomer, isDwollaConfigured } from "@/lib/payments/dwolla";
import { demoPaymentsAllowed, paymentMethodUnavailable } from "@/lib/payments/demo-mode";
import { isMethodEnabled } from "@/lib/payments/methods";

export async function POST(req: NextRequest) {
  // Turned off until this method is set up (src/lib/payments/methods.ts).
  if (!isMethodEnabled("ach")) return paymentMethodUnavailable();

  try {
    const body = await req.json();
    const { publicToken, accountId, email, firstName, lastName } = body as {
      publicToken: string;
      accountId: string;
      email: string;
      firstName: string;
      lastName: string;
    };

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing billing contact information." },
        { status: 400 }
      );
    }

    const demo = !isPlaidConfigured() || !isDwollaConfigured();

    if (demo) {
      if (!demoPaymentsAllowed()) return paymentMethodUnavailable();
      return NextResponse.json({
        fundingSourceUrl: `https://api-sandbox.dwolla.com/funding-sources/demo-${crypto.randomUUID()}`,
        demo: true,
      });
    }

    const { processorToken } = await createDwollaProcessorToken(publicToken, accountId);
    const customerUrl = await findOrCreateCustomer({ email, firstName, lastName });
    const fundingSourceUrl = await attachFundingSource(
      customerUrl,
      processorToken,
      `${firstName} ${lastName} - Checking`
    );

    return NextResponse.json({ fundingSourceUrl, demo: false });
  } catch (err) {
    console.error("ACH exchange error:", err);
    return NextResponse.json(
      { error: "Unable to link bank account. Please try again." },
      { status: 500 }
    );
  }
}
