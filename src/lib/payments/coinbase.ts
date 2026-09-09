const COINBASE_API_BASE = "https://api.commerce.coinbase.com";
const COINBASE_API_VERSION = "2018-03-22";

export function isCoinbaseConfigured(): boolean {
  return Boolean(process.env.COINBASE_COMMERCE_API_KEY);
}

export interface CreateChargeInput {
  name: string;
  description: string;
  amountUsd: number;
  orderId: string;
  customerEmail?: string;
  redirectUrl: string;
  cancelUrl: string;
}

export interface CreateChargeResult {
  hostedUrl: string;
  chargeCode: string;
  demo: boolean;
}

export async function createCoinbaseCharge(
  input: CreateChargeInput
): Promise<CreateChargeResult> {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;

  if (!apiKey) {
    return {
      hostedUrl: `${input.redirectUrl}?demo=1&order=${encodeURIComponent(input.orderId)}`,
      chargeCode: `DEMO-${input.orderId}`,
      demo: true,
    };
  }

  const response = await fetch(`${COINBASE_API_BASE}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": apiKey,
      "X-CC-Version": COINBASE_API_VERSION,
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      pricing_type: "fixed_price",
      local_price: {
        amount: input.amountUsd.toFixed(2),
        currency: "USD",
      },
      metadata: {
        order_id: input.orderId,
        customer_email: input.customerEmail ?? "",
      },
      redirect_url: input.redirectUrl,
      cancel_url: input.cancelUrl,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Coinbase Commerce error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  return {
    hostedUrl: json.data.hosted_url,
    chargeCode: json.data.code,
    demo: false,
  };
}
