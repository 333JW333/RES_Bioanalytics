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
  dedicated legal pages (RUO Policy, Terms of Service, Privacy Policy, Refund
  Policy).
- **Payments**: checkout shows two tabs, **Card or Bank** (Stripe
  Checkout) and **Invoice** (Stripe Invoicing). Crypto and ACH via
  Plaid + Dwolla are built but turned off until those accounts are set up:
  checkout doesn't show them and their routes refuse requests. To turn one
  on, add it to `ENABLED_METHODS` in `src/lib/payments/methods.ts`, after
  giving its route the sign-in, research-use attestation and order record
  the card and invoice routes have.
  - **Crypto** via [Coinbase Commerce](https://commerce.coinbase.com/) —
    hosted checkout, supports BTC/ETH/USDC and more. *(Hidden.)*
  - **ACH bank transfer** via [Plaid](https://plaid.com/) (bank account
    linking) + [Dwolla](https://www.dwolla.com/) (ACH transfer processing).
    *(Hidden. Bank payments are taken through Stripe instead: ACH Direct
    Debit on the Stripe Checkout page.)*
  - **Card** via [PayRam](https://payram.com/) — accepts Visa/Mastercard
    and settles to you in stablecoin, avoiding traditional high-risk
    card-acquirer underwriting. PayRam is **self-hosted**: you run your own
    PayRam instance and point `PAYRAM_API_BASE_URL` at it. This app's
    integration (`src/lib/payments/payram.ts`) was built from publicly
    indexed integration examples, not a verified live API reference —
    confirm field names against your PayRam instance's docs before
    enabling with a real key.
  - **Card and U.S. bank account** via
    [Stripe Checkout](https://docs.stripe.com/payments/checkout) (the Card or
    Bank tab). Stripe's page shows the payment methods turned on in the
    Stripe Dashboard. PayRam's route and client remain in the codebase but
    are no longer linked from checkout.
  - **Net 30 invoices** via [Stripe Invoicing](https://docs.stripe.com/invoicing)
    for business/institution accounts with an EIN on file (the Invoice
    tab). Requests create a *draft* invoice; staff review and send it
    from the Stripe Dashboard.

## Payments: how it fits together

Everything about an order that isn't specific to one payment processor lives
in code that doesn't know which processor is in use:

- **Orders** (`orders` table, `src/lib/orders.ts`): the items, total, the
  buyer's research-use attestation (time, IP, user agent, policy version),
  shipping address and status. `orders.processor` names the processor that
  took the payment, and `processor_checkout_id` / `processor_payment_id` /
  `processor_invoice_id` hold its own reference IDs.
- **What happens after checkout** (`src/lib/order-lifecycle.ts`): processors
  report what happened (paid, processing, failed, refunded, disputed…) and
  this file moves the order's status forward and sends the emails.
- **Order emails** (`src/lib/email/`): every customer email comes from
  EcoPeps (`orders@ecopeps.com`, replies to `support@ecopeps.com`) through
  Resend, never from the processor. Customers get: order confirmed, bank
  payment processing, payment didn't go through, refund issued, and invoice
  request received. Staff (`support@ecopeps.com`) get: new paid order ready
  to ship, invoice request to review, and payment disputed. Each email is
  sent once per order (`orders.notifications_sent`).
- **Checkout pages and copy** say "our secure payment page", not a
  processor's name. The success page reads our own order record.

Each processor plugs in through one adapter implementing `PaymentProcessor`
(`src/lib/payments/types.ts`). Stripe's is `src/lib/payments/stripe-processor.ts`
(with its API client in `stripe.ts`). `PAYMENT_PROCESSOR` picks which one new
orders use (default `stripe`). Webhooks arrive at `/api/webhooks/<processor>`.

### Switching payment processors

1. Write an adapter for the new processor implementing `PaymentProcessor`:
   create a hosted payment page for an order, optionally create invoices,
   and translate its webhooks into `PaymentUpdate`s. Use
   `stripe-processor.ts` as the model.
2. List it in `src/lib/payments/processors.ts`. Keep Stripe listed so
   refunds and disputes on earlier Stripe orders still arrive.
3. Add the new processor's keys to Vercel, point its webhooks at
   `https://www.ecopeps.com/api/webhooks/<its id>`, set
   `PAYMENT_PROCESSOR=<its id>`, and redeploy.
4. Update the Privacy Policy, Terms of Service and Refund Policy, which name
   the processors that handle customer data. Have counsel review the change.

No database change, email change or page change is needed.

### Stripe setup

1. Set `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY` (test key first),
   `STRIPE_WEBHOOK_SECRET` and `RESEND_API_KEY` in Vercel.
2. In Stripe → Webhooks, create an event destination for **Your
   account** with the **Snapshot** payload (not Thin), pointing at
   `https://www.ecopeps.com/api/webhooks/stripe`, with the events listed in
   `WEBHOOK_EVENTS` in `src/lib/payments/stripe-processor.ts`. Test mode and
   live mode each need their own destination, and `STRIPE_WEBHOOK_SECRET`
   must come from the same mode as `STRIPE_SECRET_KEY`. Locally:
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
3. In Stripe → Settings → Payment methods, turn on ACH Direct Debit and
   bank transfers for invoices.
4. In Stripe → Settings → Business → Customer emails, leave **Successful
   payments** and **Refunds** off: EcoPeps sends those emails itself.
5. Test with card `4242 4242 4242 4242`, then check the order row moves
   `pending` → `paid` and the confirmation email arrives.
6. Going live: set `STRIPE_SECRET_KEY` to a live restricted key and
   `STRIPE_WEBHOOK_SECRET` to the **live** endpoint's secret, match live
   mode's payment methods to test mode, and redeploy. Delete test rows from
   `orders` and `payment_events` (test orders have `cs_test_…` checkout
   IDs). Customers saved during testing are replaced automatically on their
   next checkout, because a test-mode Customer doesn't exist for a live key.

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
| `PAYMENT_PROCESSOR` | Which payment processor new orders use (default `stripe`). See [Switching payment processors](#switching-payment-processors). |
| `STRIPE_SECRET_KEY` | Stripe secret or restricted key. Use a test key until Stripe confirms the account in writing. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the `/api/webhooks/stripe` endpoint. |
| `STRIPE_API_VERSION` | Optional; pins the Stripe API version. |
| `ALLOW_DEMO_PAYMENTS` | Set to `true` locally to turn on demo mode (below). Ignored on the live site. |
| `RESEND_API_KEY` | Sends EcoPeps' own emails (orders, shipping, staff alerts) from orders@ecopeps.com. |
| `STAFF_EMAILS` | Comma-separated sign-in emails that can open the staff pages at `/admin` (default `support@ecopeps.com`). See [Staff pages](#staff-pages). |
| `CRON_SECRET` | Any long random string. When set, only Vercel's scheduler can trigger the daily and weekly summary emails. |

**Demo mode:** with `ALLOW_DEMO_PAYMENTS=true`, a checkout route whose
processor has no keys returns a simulated "demo" payment instead of
failing, so you can click through the purchase flow before credentials are
set up. Confirmations made this way are labeled "Demo mode" on the success
page. Demo mode is always off on the live site (`VERCEL_ENV=production`):
there, a payment method without keys returns "This payment method isn't
available right now" instead of a fake "Order Received".

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
   `public/coas/EP-GLP3-R/15mg/PSRETA15-2/`). Never overwrite, rename, or
   delete an older batch's files. (Batch PSRETA15-1 predates this and sits
   directly in `public/coas/EP-GLP3-R/15mg/`. That folder was renamed from
   `public/coas/retatrutide/`, and `next.config.ts` redirects the old
   URLs.) When a batch has both the
   manufacturer's own reports and independent third-party reports, put
   them in `manufacturer/` and `third-party/` subfolders and keep the
   combined full-COA PDF at the batch folder's top level (e.g.
   `public/coas/cartalax/40mg/CARTA40-0730/`). Upload only the report
   pages; vial photos and spectra stay on Janoshik's verify page.
2. **Vial code**: add a **new** entry to `src/data/vial-codes.ts` with the
   next code, the batch number, and the full COA PDF. EP-GLP3-R uses `R1`,
   `R2`, `R3`, …, Thymosin Alpha-1 uses `T1`, `T2`, `T3`, …, SS-31 uses
   `S1`, `S2`, `S3`, …, BPC-157 uses `B1`, `B2`, `B3`, … and Cartalax uses
   `C1`, `C2`, `C3`, … (1–3 capital letters or digits). Leave `sha256`
   empty and the build prints the value to fill in. Never edit or remove an
   existing entry.
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
- **Back in stock**: once the batch is added (above) and deployed, open
  [Staff → Back in stock](#staff-pages) and click **Email N people** next
  to the product. The button only appears once the live site shows the
  product in stock. Each person gets one email (`src/lib/restock-notify.ts`)
  and is marked `notified_at`, so nobody is emailed twice; if a send fails,
  those people stay on the list for the next try.

## Staff pages

`/admin` is for EcoPeps staff only: sign in with your normal EcoPeps
account, using an email listed in `STAFF_EMAILS` (everyone else gets a "page
not found"). Signed-in staff also see a **Staff tools** button on My Account.

- **Overview** (`/admin`): the last 7 days at a glance (orders to ship,
  sales, new accounts, traffic, restock demand), and buttons to email a
  summary now.
- **Orders to ship** (`/admin/orders`): every paid order that hasn't
  shipped, with what to pack and where to send it. Pick the carrier, enter
  the tracking number and click **Mark shipped & email buyer**: the buyer
  gets a "Your order has shipped" email with a tracking link, and My Orders
  shows the order as shipped. Recently shipped orders can have their
  tracking corrected (the buyer is emailed the new details) or the email
  resent. Orders still waiting on a bank payment or an invoice are listed
  separately; don't ship those yet. The "new paid order" alert email links
  here.
- **Back in stock** (`/admin/restock`): how many people are waiting for
  each product, and the button that emails them.
- **Summary emails** to support@ecopeps.com, each with an **Open the staff
  dashboard** button (`src/lib/staff-reports.ts`):
  - **Daily at 5 p.m. Mountain Time:** everything new in the 24 hours
    before: orders (paid, invoice requests, shipped, refunded, disputed),
    new accounts, contact-form messages, restock sign-ups, traffic and top
    products, and what needs attention. Vercel's schedule runs on UTC, so
    `vercel.json` calls `/api/cron/daily-summary` at both 23:00 and 00:00
    UTC (5 p.m. in summer and in winter); whichever call lands after 5 p.m.
    sends it.
  - **Weekly on Monday** at 14:00 UTC (7 or 8 a.m. Mountain):
    `/api/cron/weekly-summary`, the same for the week before (Monday to
    Sunday, Mountain Time).
  - Each summary is sent once (`staff_reports` table); a failed send is
    retried by the next call. With `CRON_SECRET` set, only Vercel's
    scheduler can trigger them.

## Customer accounts and activity

- **New-account alert:** when someone confirms their email
  (`src/app/(gate)/auth/confirm/actions.ts`), support@ecopeps.com gets an
  email with their registration details, approximate location, IP address
  and browser (`src/lib/account-notifications.ts`). Location comes from
  Vercel's IP lookup and is approximate.
- **Page views:** `<PageViewTracker />` (root layout) reports each page a
  visitor opens to `/api/track`, which saves the path only (never the query
  string), the referring site on the first page of a visit, and approximate
  location in `page_views`. Signed-in views are linked to the account (from
  the session, not the browser). Records older than 12 months are deleted.
  No cookies. Disclosed in the Privacy Policy, sections 1, 2, 7 and 9.
- **Views in Supabase** (Table Editor → schema `staff`; dashboard only, not
  reachable from the website):
  - `customer_activity`: one row per account (details, sign-up and last
    sign-in, page views and products viewed, orders, unpaid checkouts,
    restock requests, inquiries, last activity).
  - `customer_timeline`: everything each person has done. Filter by email
    and sort by `at`.
  - `popular_pages` and `traffic_by_country`: views in the last 30 days.

## Legal pages

`src/app/(store)/legal/*` contains the Research Use Only Policy, Terms of
Service, Privacy Policy, and Refund Policy, which have been reviewed by an
attorney. The Terms of Service text lives in `src/lib/terms-of-service.ts`,
which also feeds the Create Account scroll box.

## Deploying

This is a standard Next.js app and can be deployed to
[Vercel](https://vercel.com/new) or any Node.js hosting platform. Production
currently ships to [www.ecopeps.com](https://www.ecopeps.com) via the Vercel
**EcoPeps** team. Set the environment variables above in the project
dashboard before enabling live payments (unset keys keep checkout in demo
mode).

CI runs lint + build on pushes and pull requests to `main`
(`.github/workflows/ci.yml`).
