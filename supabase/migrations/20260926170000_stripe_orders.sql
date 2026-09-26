-- Stripe Payments + Invoicing: orders, Stripe customer mapping, and webhook
-- event log.
--
-- Every row here is written server-side with the Supabase secret key
-- (src/lib/supabase/admin.ts). Signed-in users can only READ their own
-- orders; they can't insert or change an order, its status, or the Stripe
-- customer mapping — tables with RLS on and no write policies are
-- unreachable to the anon/authenticated roles.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id),
  email text not null check (char_length(email) between 3 and 254),

  status text not null default 'pending' check (status in (
    'pending',            -- Checkout Session created, not yet paid
    'processing',         -- paid with a delayed method (bank debit), not settled
    'paid',
    'payment_failed',
    'canceled',           -- Checkout Session expired, or invoice voided
    'refunded',
    'partially_refunded',
    'disputed',
    'invoice_requested'   -- draft invoice awaiting staff review in Stripe
  )),
  payment_provider text not null check (payment_provider in ('stripe_checkout', 'stripe_invoice')),

  currency text not null default 'usd',
  amount_cents integer not null check (amount_cents > 0),
  -- Priced server-side by src/lib/pricing.ts: [{ sku, name, sizeLabel, qty, unitPrice }]
  items jsonb not null,

  -- Research-use attestation evidence for this specific order. Stripe's
  -- policy allows research peptides only with preventive measures in place;
  -- this is the per-sale record that proves the buyer attested.
  ruo_attested_at timestamptz not null,
  ruo_attestation_ip text,
  ruo_attestation_user_agent text check (char_length(ruo_attestation_user_agent) <= 500),
  ruo_policy_version text not null,
  profile_terms_accepted_at timestamptz,

  po_number text check (char_length(po_number) <= 100),
  shipping jsonb,
  paid_at timestamptz,

  stripe_customer_id text,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_invoice_id text unique
);

create index orders_user_id_created_at_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

create policy "Users can read their own orders"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- One Stripe Customer per account. Kept out of `profiles` on purpose:
-- profiles are user-editable, and a user who could rewrite their own
-- stripe_customer_id could point checkout at someone else's customer.
create table public.stripe_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.stripe_customers enable row level security;

-- Webhook idempotency: Stripe can deliver the same event more than once.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_events enable row level security;
