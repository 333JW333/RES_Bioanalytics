import { createHash } from "crypto";

/**
 * EXPERIMENTAL — not part of the main checkout build.
 *
 * Truevo is a Malta-licensed (MFSA-regulated) EU acquirer/PSP. This
 * integrates their Hosted Payment Page (a redirect-based checkout, the
 * standard way to accept cards without pulling raw card data into your own
 * PCI scope).
 *
 * IMPORTANT: this build environment's network egress blocked
 * docs.truevo.com, so the endpoint, field names, and signing method below
 * could not be verified against Truevo's live API reference — they're
 * assembled from public search summaries of Truevo's "Hosted Payment Page"
 * and "Digital Signature Algorithm" doc pages. Confirm the exact request
 * shape at https://docs.truevo.com/hosted-payment-page/ and
 * https://docs.truevo.com/hosted-payment-page/digital-signature-algorithm/
 * before enabling this with real credentials. This is also why the
 * feature is kept on its own branch instead of the main checkout: Truevo
 * is a high-risk-vertical EU acquirer with documented cases of abrupt
 * merchant termination and held reserves (see the ASF 115-2023 Malta
 * Financial Arbiter decision) — review those terms before going live.
 */

const TRUEVO_HOSTED_PAGE_URL = "https://pay.truevo.com/paymentpage";

export function isTruevoConfigured(): boolean {
  return Boolean(
    process.env.TRUEVO_MERCHANT_ID &&
      process.env.TRUEVO_API_KEY &&
      process.env.TRUEVO_SIGNATURE_SECRET
  );
}

export interface CreateTruevoSessionInput {
  amountUsd: number;
  orderId: string;
  customerEmail?: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreateTruevoSessionResult {
  redirectUrl: string;
  demo: boolean;
}

function signFields(fields: Record<string, string>, secret: string): string {
  const concatenated =
    Object.keys(fields)
      .sort()
      .map((key) => fields[key])
      .join("") + secret;
  return createHash("sha256").update(concatenated).digest("hex");
}

export async function createTruevoSession(
  input: CreateTruevoSessionInput
): Promise<CreateTruevoSessionResult> {
  const merchantId = process.env.TRUEVO_MERCHANT_ID;
  const apiKey = process.env.TRUEVO_API_KEY;
  const secret = process.env.TRUEVO_SIGNATURE_SECRET;

  if (!merchantId || !apiKey || !secret) {
    const demoUrl = new URL(input.returnUrl);
    demoUrl.searchParams.set("demo", "1");
    demoUrl.searchParams.set("order", input.orderId);
    return { redirectUrl: demoUrl.toString(), demo: true };
  }

  const fields: Record<string, string> = {
    merchantId,
    reference: input.orderId,
    amount: input.amountUsd.toFixed(2),
    currency: "USD",
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    customerEmail: input.customerEmail ?? "",
  };
  const signature = signFields(fields, secret);

  const response = await fetch(TRUEVO_HOSTED_PAGE_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...fields, signature }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Truevo error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const redirectUrl = json.redirectUrl ?? json.paymentPageUrl ?? json.url;
  if (!redirectUrl) {
    throw new Error("Truevo response did not include a redirect URL.");
  }

  return { redirectUrl, demo: false };
}
