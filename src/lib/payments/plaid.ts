import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  ProcessorTokenCreateRequestProcessorEnum,
} from "plaid";

export function isPlaidConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

let client: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (client) return client;

  const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;

  const configuration = new Configuration({
    basePath: PlaidEnvironments[env] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID ?? "",
        "PLAID-SECRET": process.env.PLAID_SECRET ?? "",
      },
    },
  });

  client = new PlaidApi(configuration);
  return client;
}

export async function createLinkToken(clientUserId: string) {
  if (!isPlaidConfigured()) {
    return { linkToken: `demo-link-token-${clientUserId}`, demo: true };
  }

  const plaid = getPlaidClient();
  const response = await plaid.linkTokenCreate({
    user: { client_user_id: clientUserId },
    client_name: "RES Bioanalytics",
    products: [Products.Auth],
    country_codes: [CountryCode.Us],
    language: "en",
  });

  return { linkToken: response.data.link_token, demo: false };
}

export async function createDwollaProcessorToken(publicToken: string, accountId: string) {
  if (!isPlaidConfigured()) {
    return { processorToken: `demo-processor-token-${accountId}`, demo: true };
  }

  const plaid = getPlaidClient();
  const exchange = await plaid.itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = exchange.data.access_token;

  const processorTokenResponse = await plaid.processorTokenCreate({
    access_token: accessToken,
    account_id: accountId,
    processor: ProcessorTokenCreateRequestProcessorEnum.Dwolla,
  });

  return { processorToken: processorTokenResponse.data.processor_token, demo: false };
}
