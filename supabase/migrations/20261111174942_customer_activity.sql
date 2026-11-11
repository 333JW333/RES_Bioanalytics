-- Customer activity: page views, and dashboard-only views of what each
-- customer has done. Disclosed in the Privacy Policy (sections 1, 2, 7, 9).

-- page_views -------------------------------------------------------------------
-- One row per page a visitor opens on www.ecopeps.com (path only, never the
-- query string). Linked to the account when the visitor is signed in.
-- Written by the server (/api/track); deleted after 12 months.

create table public.page_views (
  id bigint generated always as identity primary key,
  viewed_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete cascade,
  path text not null check (char_length(path) between 1 and 300),
  referrer text check (char_length(referrer) <= 300),
  city text check (char_length(city) <= 100),
  region text check (char_length(region) <= 10),
  country text check (char_length(country) <= 2)
);

create index page_views_user_id_viewed_at_idx on public.page_views (user_id, viewed_at desc);
create index page_views_viewed_at_idx on public.page_views (viewed_at desc);

-- Server-side only: RLS on with no policies, and no grants to site visitors.
alter table public.page_views enable row level security;
revoke all on public.page_views from anon, authenticated;
grant select, insert, delete on public.page_views to service_role;
grant usage on sequence public.page_views_id_seq to service_role;

-- staff schema: for the Supabase dashboard only ----------------------------------
-- Not exposed through the Data API, and no access for site visitors' roles,
-- so these views (which read auth.users) can't be reached from the website.

create schema staff;
comment on schema staff is
  'Dashboard-only views for EcoPeps staff. Not exposed through the Data API.';
revoke all on schema staff from public, anon, authenticated;

-- One row per account: who they are and what they've done.
create view staff.customer_activity as
select
  u.email,
  nullif(concat_ws(' ', p.first_name, p.last_name), '') as name,
  p.business_type,
  p.industry,
  p.website,
  p.phone,
  coalesce(trim(p.ein), '') <> '' as ein_on_file,
  u.created_at as signed_up_at,
  u.email_confirmed_at,
  u.last_sign_in_at,
  coalesce(v.page_views, 0) as page_views,
  v.last_viewed_at,
  v.products_viewed,
  v.last_location,
  coalesce(o.orders, 0) as orders,
  coalesce(o.paid_orders, 0) as paid_orders,
  coalesce(o.paid_usd, 0) as paid_usd,
  coalesce(o.unpaid_checkouts, 0) as unpaid_checkouts,
  o.last_order_at,
  coalesce(r.restock_requests, 0) as restock_requests,
  coalesce(i.inquiries, 0) as inquiries,
  greatest(u.created_at, u.last_sign_in_at, v.last_viewed_at, o.last_order_at, r.last_at, i.last_at)
    as last_activity_at,
  u.id as user_id
from auth.users u
left join public.profiles p on p.id = u.id
left join lateral (
  select
    count(*) as page_views,
    max(pv.viewed_at) as last_viewed_at,
    string_agg(distinct substring(pv.path from '^/shop/([^/]+)$'), ', ') as products_viewed,
    (array_agg(nullif(concat_ws(', ', pv.city, pv.region, pv.country), '') order by pv.viewed_at desc))[1]
      as last_location
  from public.page_views pv
  where pv.user_id = u.id
) v on true
left join lateral (
  select
    count(*) as orders,
    count(*) filter (where o.paid_at is not null) as paid_orders,
    round(sum(o.amount_cents) filter (where o.paid_at is not null) / 100.0, 2) as paid_usd,
    count(*) filter (where o.status = 'pending') as unpaid_checkouts,
    max(o.created_at) as last_order_at
  from public.orders o
  where o.user_id = u.id
) o on true
left join lateral (
  select count(*) as restock_requests, max(r.created_at) as last_at
  from public.restock_requests r
  where r.user_id = u.id
) r on true
left join lateral (
  select count(*) as inquiries, max(i.created_at) as last_at
  from public.inquiries i
  where i.user_id = u.id or lower(i.email) = lower(u.email)
) i on true;

-- Everything each customer has done, newest first when sorted by `at`.
-- Filter by email to see one person.
create view staff.customer_timeline as
select u.email, u.created_at as at, 'signed up' as event, null::text as detail, u.id as user_id
from auth.users u
union all
select u.email, u.email_confirmed_at, 'confirmed email', null, u.id
from auth.users u where u.email_confirmed_at is not null
union all
select u.email, u.last_sign_in_at, 'signed in (most recent)', null, u.id
from auth.users u where u.last_sign_in_at is not null
union all
select u.email, pv.viewed_at, 'viewed page',
  pv.path || coalesce(' (from ' || nullif(concat_ws(', ', pv.city, pv.region, pv.country), '') || ')', ''),
  u.id
from public.page_views pv join auth.users u on u.id = pv.user_id
union all
select o.email, o.created_at,
  case o.payment_flow when 'invoice' then 'requested invoice' else 'started checkout' end,
  format('order %s, $%s, now %s', upper(left(o.id::text, 8)), to_char(o.amount_cents / 100.0, 'FM999,990.00'), o.status),
  o.user_id
from public.orders o
union all
select o.email, o.paid_at, 'paid',
  format('order %s, $%s', upper(left(o.id::text, 8)), to_char(o.amount_cents / 100.0, 'FM999,990.00')),
  o.user_id
from public.orders o where o.paid_at is not null
union all
select r.email, r.created_at, 'asked to be notified of a restock', r.product_slug, r.user_id
from public.restock_requests r
union all
select i.email, i.created_at, 'sent an inquiry', i.subject, i.user_id
from public.inquiries i;

-- Which pages get attention.
create view staff.popular_pages as
select
  pv.path,
  count(*) filter (where pv.viewed_at > now() - interval '30 days') as views_30d,
  count(distinct pv.user_id) filter (where pv.viewed_at > now() - interval '30 days') as signed_in_viewers_30d,
  count(*) as views_all_time,
  max(pv.viewed_at) as last_viewed_at
from public.page_views pv
group by pv.path;

-- Where visitors are, approximately.
create view staff.traffic_by_country as
select
  coalesce(pv.country, '??') as country,
  count(*) filter (where pv.viewed_at > now() - interval '30 days') as views_30d,
  count(distinct pv.user_id) filter (where pv.viewed_at > now() - interval '30 days') as signed_in_viewers_30d,
  count(*) as views_all_time
from public.page_views pv
group by 1;

revoke all on all tables in schema staff from public, anon, authenticated;
