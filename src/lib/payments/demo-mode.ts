import { NextResponse } from "next/server";

/**
 * Demo mode: when a payment processor has no keys, its checkout route fakes a
 * successful payment so the purchase flow can be clicked through before the
 * account is set up.
 *
 * It's off unless ALLOW_DEMO_PAYMENTS=true, and always off on the live site
 * (VERCEL_ENV=production). There, a fake "Order Received" would tell a
 * customer they'd ordered when nothing was charged or saved.
 */
export function demoPaymentsAllowed(): boolean {
  return (
    process.env.ALLOW_DEMO_PAYMENTS === "true" &&
    process.env.VERCEL_ENV !== "production"
  );
}

/** Returned when a processor has no keys and demo mode is off. */
export function paymentMethodUnavailable(): NextResponse {
  return NextResponse.json(
    { error: "This payment method isn't available right now. Please choose another one." },
    { status: 503 }
  );
}
