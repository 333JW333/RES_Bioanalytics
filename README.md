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

- **Product catalog** (`src/data/products.ts`) — research peptide
  listings with vial photos and lab COAs, all on one product page
  template. The data model is designed to scale past 30+ products; just
  append new entries to the `products` array.
- **Notify me when available** on products with nothing in stock (see
  [Restock requests](#restock-requests)).
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
  - **Card** via [Stripe Checkout](https://docs.stripe.com/payments/checkout)
    (the Card tab). PayRam's route and client remain in the codebase but
    are no longer linked from checkout.
  - **Net 30 invoices** via [Stripe Invoicing](https://docs.stripe.com/invoicing)
    for business/institution accounts with an EIN on file (the Invoice
    tab). Requests create a *draft* invoice; staff review and send it
    from the Stripe Dashboard.

## Stripe setup

1. Apply `supabase/migrations/20260926170000_stripe_orders.sql` (creates
   `orders`, `stripe_customers`, `stripe_events`).
2. Set `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY` (test key first) and
   `STRIPE_WEBHOOK_SECRET` in Vercel.
3. In Stripe → Developers → Webhooks, add
   `https://www.ecopeps.com/api/webhooks/stripe` with the events listed at
   the top of `src/app/(store)/api/webhooks/stripe/route.ts`. Locally:
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
4. In Stripe → Settings → Payment methods, turn on ACH Direct Debit and
   bank transfers for invoices.
5. Test with card `4242 4242 4242 4242`, then check the order row moves
   `pending` → `paid`.

Every Stripe order stores the buyer's research-use attestation (time, IP,
user agent, policy version) on its `orders` row — use it as evidence if a
payment is disputed.

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
| `SUPABASE_SECRET_KEY` | Supabase secret key (server-only); used to write orders and in the Stripe webhook. |
| `STRIPE_SECRET_KEY` | Stripe secret or restricted key. Use a test key until Stripe confirms the account in writing. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the `/api/webhooks/stripe` endpoint. |
| `STRIPE_API_VERSION` | Optional; pins the Stripe API version. |

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

## Adding a batch

A vial's QR code must always open **its own** batch's COA. Customers
holding an older batch keep scanning it long after a newer batch
arrives, so a code is never reused, repointed, or removed, and a COA file
is never replaced. `next build` enforces this and fails (on Vercel and
in CI) if any of it is broken.

1. **COA files**: put them in a new folder for the batch,
   `public/coas/<product>/<size>/<batch number>/` (e.g.
   `public/coas/retatrutide/15mg/PSRETA15-2/`). Never overwrite, rename, or
   delete an older batch's files. (Batch PSRETA15-1 predates this and sits
   directly in `public/coas/retatrutide/15mg/`.)
2. **Vial code**: add a **new** entry to `src/data/vial-codes.ts` with the
   next code, the batch number, and the full COA PDF. EP-GLP3-R uses `R1`,
   `R2`, `R3`, …, Thymosin Alpha-1 uses `T1`, `T2`, `T3`, …, SS-31 uses
   `S1`, `S2`, `S3`, … and BPC-157 uses `B1`, `B2`, `B3`, … (1–3 capital
   letters or digits). Leave `sha256` empty and the build prints the
   value to fill in. Never edit or remove an existing entry.
3. **Product page**: add the batch to the **top** of the product's
   `batches` list in `src/data/products.ts` (lab results, `reportUrl` set
   to the same COA PDF, `verifyLinks`, `batchCode`). The page shows the
   newest batch. Also point the product's `documents` and `images.extra`
   at the new batch's files, and give the batch's size a price and drop
   its `inStock: false`.
4. **Vial label**: in Nimbot, encode `HTTPS://ECOPEPS.COM/C/<code>` in
   capitals (e.g. `HTTPS://ECOPEPS.COM/C/R2`). Capitals keep the QR at the
   smallest 21×21 size, which scans on a 3 mL vial. It should have only the
   three corner squares; a small fourth square means it came out larger.

Once deployed, check that `https://www.ecopeps.com/C/<code>` opens the
new COA and that every older code (e.g. `/C/R1`) still opens its own.

## Restock requests

A product with no size in stock shows **Notify Me When Available**
instead of Add to Cart. Clicking it saves the signed-in customer's
account and sign-in email to the Supabase `restock_requests` table (one
row per customer per product; `src/lib/restock.ts`). RLS only lets
customers add themselves, and they can't read the list.

- **Demand**: the `restock_demand` view shows, per product, how many
  people are `waiting` (not yet emailed) and the latest request.
- **Back in stock**: once the batch is added (above) and deployed, email
  everyone waiting for that product that it has passed its COAs and is
  ready, then mark them sent so they aren't emailed twice:

  ```sql
  select id, email from restock_requests
  where product_slug = 'tb-500' and notified_at is null;
  -- after the emails go out, for the ids you emailed:
  update restock_requests set notified_at = now() where id in (...);
  ```

## Legal pages

`src/app/legal/*` contains starting-point Research Use Only, Terms of Sale,
Privacy, and Refund policies. **These are templates, not legal advice** —
have them reviewed by an attorney familiar with research-chemical
regulations before launch.

## Deploying

This is a standard Next.js app and can be deployed to
[Vercel](https://vercel.com/new) or any Node.js hosting platform. Production
currently ships to [www.ecopeps.com](https://www.ecopeps.com) via the Vercel
**EcoPeps** team. Set the environment variables above in the project
dashboard before enabling live payments (unset keys keep checkout in demo
mode).

CI runs lint + build on pushes and pull requests to `main`
(`.github/workflows/ci.yml`).
