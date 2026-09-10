/**
 * PayRam is a self-hosted crypto payment gateway: you run your own PayRam
 * instance (e.g. via their Docker deployment) and this app calls into that
 * instance's REST API — there is no shared/global PayRam API endpoint.
 * Card payments are accepted through an embedded fiat-on-ramp inside
 * PayRam's checkout, settling to your wallet in stablecoins, which is why
 * it can accept cards without the merchant needing high-risk card-acquirer
 * underwriting.
 *
 * NOTE: this environment could not reach docs.payram.com to verify the
 * exact request/response field names at build time. The shape below is
 * assembled from publicly indexed integration examples — confirm field
 * names against your PayRam instance's live API reference before enabling
 * with a real PAYRAM_API_KEY.
 */

export function isPayramConfigured(): boolean {
  return Boolean(process.env.PAYRAM_API_BASE_URL && process.env.PAYRAM_API_KEY);
}

export interface CreatePayramPaymentInput {
  amountUsd: number;
  orderId: string;
  customerEmail?: string;
  redirectUrl: string;
}

export interface CreatePayramPaymentResult {
  paymentUrl: string;
  demo: boolean;
}

export async function createPayramPayment(
  input: CreatePayramPaymentInput
): Promise<CreatePayramPaymentResult> {
  const baseUrl = process.env.PAYRAM_API_BASE_URL;
  const apiKey = process.env.PAYRAM_API_KEY;

  if (!baseUrl || !apiKey) {
    const demoUrl = new URL(input.redirectUrl);
    demoUrl.searchParams.set("demo", "1");
    demoUrl.searchParams.set("order", input.orderId);
    return { paymentUrl: demoUrl.toString(), demo: true };
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "API-Key": apiKey,
    },
    body: JSON.stringify({
      amountInUSD: input.amountUsd,
      merchantUserId: input.orderId,
      customerEmail: input.customerEmail ?? "",
      redirectUrl: input.redirectUrl,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PayRam error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const paymentUrl = json.paymentUrl ?? json.payment_url ?? json.url ?? json.link;
  if (!paymentUrl) {
    throw new Error("PayRam response did not include a payment URL.");
  }

  return { paymentUrl, demo: false };
}
