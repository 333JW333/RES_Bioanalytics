# EcoPeps

Website for EcoPeps — a research-use-only (RUO) peptide and
research-compound supplier. Built with Next.js (App Router), TypeScript,
and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## What's included

- **Product catalog** (`src/data/products.ts`) — 5 sample/placeholder
  peptide listings. The data model is designed to scale past 30+ products;
  just append new entries to the `products` array.
- **Shop, product detail, cart, and checkout flow**, with a research-use
  attestation required before payment.
- **RUO compliance UX** — an entry gate modal, disclaimer banners, and
  dedicated legal pages (RUO Policy, Terms of Sale, Privacy Policy, Refund
  Policy).
- **Payments**:
  - **Crypto** via [Coinbase Commerce](https://commerce.coinbase.com/) —
    hosted checkout, supports BTC/ETH/USDC and more.
  - **ACH bank transfer** via [Plaid](https://plaid.com/) (bank account
    linking) + [Dwolla](https://www.dwolla.com/) (ACH transfer processing).
  - **Card** via [PayRam](https://payram.com/) — accepts Visa/Mastercard
    and settles to you in stablecoin, avoiding traditional high-risk
    card-acquirer underwriting. PayRam is **self-hosted**: you run your own
    PayRam instance and point `PAYRAM_API_BASE_URL` at it. This app's
    integration (`src/lib/payments/payram.ts`) was built from publicly
    indexed integration examples, not a verified live API reference —
    confirm field names against your PayRam instance's docs before
    enabling with a real key.
  - **PayPal** — shown in the UI as "coming soon"; not yet wired up.

## Environment variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `COINBASE_COMMERCE_API_KEY` | API key from your Coinbase Commerce dashboard. |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` | From the Plaid dashboard. `PLAID_ENV` is `sandbox`, `development`, or `production`. |
| `DWOLLA_KEY` / `DWOLLA_SECRET` | From the Dwolla dashboard. `DWOLLA_ENV` is `sandbox` or `production`. |
| `DWOLLA_MASTER_FUNDING_SOURCE_URL` | The verified Dwolla funding source (your business bank account) that receives customer ACH payments. |
| `PAYRAM_API_BASE_URL` | The base URL of your **self-hosted** PayRam instance (not a shared PayRam domain). |
| `PAYRAM_API_KEY` | API key generated from your PayRam instance's dashboard. |

**Demo mode:** if any of the above are left unset, the checkout API routes
automatically fall back to a simulated "demo" response instead of failing,
so you can click through the full purchase flow before payment credentials
are configured. Order confirmations generated this way are clearly labeled
"Demo mode" on the success page.

## Adding products

Add a new object to the `products` array in `src/data/products.ts` following
the `Product` type in `src/types/product.ts`. Each product needs at least
one entry in `sizes` (label, mg, price, sku). No other code changes are
required — the shop grid, product page, cart, and checkout all read from
this single source of truth.

## Legal pages

`src/app/legal/*` contains starting-point Research Use Only, Terms of Sale,
Privacy, and Refund policies. **These are templates, not legal advice** —
have them reviewed by an attorney familiar with research-chemical
regulations before launch.

## Deploying

This is a standard Next.js app and can be deployed to
[Vercel](https://vercel.com/new) or any Node.js hosting platform. Set the
environment variables above in your hosting provider's dashboard.
