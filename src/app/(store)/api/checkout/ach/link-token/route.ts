import { NextRequest, NextResponse } from "next/server";
import { createLinkToken } from "@/lib/payments/plaid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId: string = body.userId ?? crypto.randomUUID();
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
