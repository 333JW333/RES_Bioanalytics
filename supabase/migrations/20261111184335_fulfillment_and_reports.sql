-- Shipping, the daily and weekly staff summaries, and shipments on the
-- customer timeline.

-- orders: shipping details --------------------------------------------------------
-- Filled in from the staff Orders page (/admin/orders) when an order ships.
-- Payment status stays in `status`; these record fulfillment.

alter table public.orders
  add column shipped_at timestamptz,
  add column carrier text check (char_length(carrier) <= 40),
  add column tracking_number text check (char_length(tracking_number) <= 100);

create index orders_to_ship_idx on public.orders (paid_at)
  where shipped_at is null and status in ('paid', 'partially_refunded');

-- staff_reports: reports already sent ---------------------------------------------
-- e.g. 'daily:2026-11-11' or 'weekly:2026-11-16', so each summary goes out
-- once even if its scheduled job runs twice. Server-side only.

create table public.staff_reports (
  id text primary key check (char_length(id) <= 100),
  sent_at timestamptz not null default now()
);

alter table public.staff_reports enable row level security;
revoke all on public.staff_reports from anon, authenticated;
grant select, insert, delete on public.staff_reports to service_role;

-- activity_summary: what happened between two times, for the staff emails --------
-- Counts, plus lists of the new orders, accounts, restock sign-ups and
-- contact-form messages. Reads auth.users, so it runs as its owner; only the
-- server may call it.

create function public.activity_summary(p_since timestamptz, p_until timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'accounts_total', (select count(*) from auth.users),
    'new_accounts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'email', u.email,
        'name', nullif(concat_ws(' ', p.first_name, p.last_name), ''),
        'business_type', p.business_type,
        'confirmed', u.email_confirmed_at is not null
      ) order by u.created_at), '[]'::jsonb)
      from auth.users u
      left join public.profiles p on p.id = u.id
      where u.created_at >= p_since and u.created_at < p_until
    ),
    'paid_orders', (select count(*) from public.orders where paid_at >= p_since and paid_at < p_until),
    'revenue_cents', (
      select coalesce(sum(amount_cents), 0) from public.orders where paid_at >= p_since and paid_at < p_until
    ),
    'invoice_requests', (
      select count(*) from public.orders
      where payment_flow = 'invoice' and created_at >= p_since and created_at < p_until
    ),
    'unpaid_checkouts', (
      select count(*) from public.orders
      where payment_flow = 'checkout' and paid_at is null
        and created_at >= p_since and created_at < p_until
    ),
    'shipped', (select count(*) from public.orders where shipped_at >= p_since and shipped_at < p_until),
    'awaiting_shipment', (
      select count(*) from public.orders
      where shipped_at is null and status in ('paid', 'partially_refunded')
    ),
    'refunded', (
      select count(*) from public.orders
      where status in ('refunded', 'partially_refunded') and updated_at >= p_since and updated_at < p_until
    ),
    'disputed', (
      select count(*) from public.orders
      where status = 'disputed' and updated_at >= p_since and updated_at < p_until
    ),
    'page_views', (select count(*) from public.page_views where viewed_at >= p_since and viewed_at < p_until),
    'top_products', (
      select coalesce(jsonb_agg(t order by t.views desc), '[]'::jsonb)
      from (
        select substring(path from '^/shop/([^/]+)$') as slug,
               count(*) as views,
               count(distinct user_id) as signed_in_viewers
        from public.page_views
        where viewed_at >= p_since and viewed_at < p_until and path ~ '^/shop/[^/]+$'
        group by 1
        order by 2 desc
        limit 10
      ) t
    ),
    'countries', (
      select coalesce(jsonb_agg(c order by c.views desc), '[]'::jsonb)
      from (
        select coalesce(country, '??') as country, count(*) as views
        from public.page_views
        where viewed_at >= p_since and viewed_at < p_until
        group by 1
        order by 2 desc
        limit 10
      ) c
    ),
    'restock_waiting', (
      select coalesce(jsonb_agg(r order by r.waiting desc), '[]'::jsonb)
      from (
        select product_slug as slug, count(*) as waiting
        from public.restock_requests
        where notified_at is null
        group by 1
      ) r
    ),
    -- Orders with news in the period: placed, paid, shipped, or a payment
    -- status change. Unpaid checkouts are only counted (above).
    'orders', (
      select coalesce(jsonb_agg(o order by o.at), '[]'::jsonb)
      from (
        select id, email, amount_cents, status, payment_flow, created_at, paid_at, shipped_at,
               greatest(created_at, paid_at, shipped_at, updated_at) as at
        from public.orders
        where status not in ('pending', 'canceled')
          and (
            (created_at >= p_since and created_at < p_until)
            or (paid_at >= p_since and paid_at < p_until)
            or (shipped_at >= p_since and shipped_at < p_until)
            or (updated_at >= p_since and updated_at < p_until)
          )
        order by at
        limit 100
      ) o
    ),
    'restock_requests', (
      select coalesce(jsonb_agg(jsonb_build_object('email', r.email, 'slug', r.product_slug) order by r.created_at), '[]'::jsonb)
      from (
        select email, product_slug, created_at from public.restock_requests
        where created_at >= p_since and created_at < p_until
        order by created_at
        limit 100
      ) r
    ),
    'inquiries', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'email', i.email,
        'name', nullif(concat_ws(' ', i.first_name, i.last_name), ''),
        'subject', i.subject
      ) order by i.created_at), '[]'::jsonb)
      from (
        select email, first_name, last_name, subject, created_at from public.inquiries
        where created_at >= p_since and created_at < p_until
        order by created_at
        limit 100
      ) i
    )
  );
$$;

revoke all on function public.activity_summary(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.activity_summary(timestamptz, timestamptz) to service_role;

-- customer_timeline: add shipments -------------------------------------------------

create or replace view staff.customer_timeline as
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
select o.email, o.shipped_at, 'shipped',
  format('order %s via %s, tracking %s', upper(left(o.id::text, 8)), coalesce(o.carrier, '?'), coalesce(o.tracking_number, '?')),
  o.user_id
from public.orders o where o.shipped_at is not null
union all
select r.email, r.created_at, 'asked to be notified of a restock', r.product_slug, r.user_id
from public.restock_requests r
union all
select r.email, r.notified_at, 'emailed: back in stock', r.product_slug, r.user_id
from public.restock_requests r where r.notified_at is not null
union all
select i.email, i.created_at, 'sent an inquiry', i.subject, i.user_id
from public.inquiries i;
