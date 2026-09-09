import { Client } from "dwolla-v2";

export function isDwollaConfigured(): boolean {
  return Boolean(
    process.env.DWOLLA_KEY &&
      process.env.DWOLLA_SECRET &&
      process.env.DWOLLA_MASTER_FUNDING_SOURCE_URL
  );
}

let client: Client | null = null;

export function getDwollaClient(): Client {
  if (client) return client;
  client = new Client({
    key: process.env.DWOLLA_KEY ?? "",
    secret: process.env.DWOLLA_SECRET ?? "",
    environment: (process.env.DWOLLA_ENV as "production" | "sandbox") ?? "sandbox",
  });
  return client;
}

export async function findOrCreateCustomer(input: {
  email: string;
  firstName: string;
  lastName: string;
}): Promise<string> {
  const dwolla = getDwollaClient();

  const existing = await dwolla.get("customers", { search: input.email });
  const match = existing.body._embedded?.customers?.find(
    (c: { email: string }) => c.email.toLowerCase() === input.email.toLowerCase()
  );
  if (match) return match._links.self.href;

  const response = await dwolla.post("customers", {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    type: "receive-only",
  });

  const location = response.headers.get("location");
  if (!location) throw new Error("Dwolla did not return a customer location");
  return location;
}

export async function attachFundingSource(
  customerUrl: string,
  processorToken: string,
  name: string
): Promise<string> {
  const dwolla = getDwollaClient();
  const response = await dwolla.post(`${customerUrl}/funding-sources`, {
    plaidToken: processorToken,
    name,
  });

  const location = response.headers.get("location");
  if (!location) throw new Error("Dwolla did not return a funding source location");
  return location;
}

export async function initiateAchTransfer(input: {
  sourceFundingSourceUrl: string;
  amountUsd: number;
  orderId: string;
}): Promise<string> {
  const dwolla = getDwollaClient();
  const destination = process.env.DWOLLA_MASTER_FUNDING_SOURCE_URL;
  if (!destination) {
    throw new Error("DWOLLA_MASTER_FUNDING_SOURCE_URL is not configured");
  }

  const response = await dwolla.post("transfers", {
    _links: {
      source: { href: input.sourceFundingSourceUrl },
      destination: { href: destination },
    },
    amount: {
      currency: "USD",
      value: input.amountUsd.toFixed(2),
    },
    metadata: {
      orderId: input.orderId,
    },
  });

  const location = response.headers.get("location");
  if (!location) throw new Error("Dwolla did not return a transfer location");
  return location;
}
