-- "Notify me when available" sign-ups for out-of-stock products. One row per
-- signed-in customer per product; notified_at is set once they've been
-- emailed that the product passed its COAs and is back in stock.
create table public.restock_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  product_slug text not null check (char_length(product_slug) between 1 and 100),
  notified_at timestamptz,
  constraint restock_requests_user_product_key unique (user_id, product_slug)
);

create index restock_requests_product_waiting_idx
  on public.restock_requests (product_slug)
  where notified_at is null;

alter table public.restock_requests enable row level security;

-- Customers can only sign themselves up, with their own sign-in email, so
-- nobody can add someone else's address to a list. There is no select,
-- update or delete policy: the lists are read and worked from the
-- dashboard / service role.
create policy "Customers can request a restock notice for themselves"
  on public.restock_requests
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and email = (select auth.jwt() ->> 'email')
  );

-- Demand per product, for the dashboard. security_invoker keeps it behind
-- the table's RLS, so customers can't read it through the API.
create view public.restock_demand
  with (security_invoker = true)
as
select
  product_slug,
  count(*) filter (where notified_at is null) as waiting,
  count(*) as total_requests,
  max(created_at) as latest_request
from public.restock_requests
group by product_slug;

revoke all on public.restock_demand from anon, authenticated;

