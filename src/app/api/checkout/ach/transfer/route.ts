import { NextRequest, NextResponse } from "next/server";
import { initiateAchTransfer, isDwollaConfigured } from "@/lib/payments/dwolla";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fundingSourceUrl, amount } = body as {
      fundingSourceUrl: string;
      amount: number;
    };

    if (!fundingSourceUrl || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid transfer request." }, { status: 400 });
    }

    const orderId = crypto.randomUUID();

    if (!isDwollaConfigured() || fundingSourceUrl.includes("demo-")) {
      return NextResponse.json({
        transferUrl: `https://api-sandbox.dwolla.com/transfers/demo-${orderId}`,
        orderId,
        demo: true,
      });
    }

    const transferUrl = await initiateAchTransfer({
      sourceFundingSourceUrl: fundingSourceUrl,
      amountUsd: amount,
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
