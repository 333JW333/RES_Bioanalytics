import { NextRequest, NextResponse } from "next/server";
import { createDwollaProcessorToken, isPlaidConfigured } from "@/lib/payments/plaid";
import { attachFundingSource, findOrCreateCustomer, isDwollaConfigured } from "@/lib/payments/dwolla";

export async function POST(req: NextRequest) {
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
