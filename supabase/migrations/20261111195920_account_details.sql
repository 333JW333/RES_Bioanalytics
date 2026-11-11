-- Customers edit their own details on My Account -> Account Details
-- (src/app/(store)/account/details). Staff see what changed.

-- profiles: what customers may change ---------------------------------------------
-- Row-level security already limits customers to their own row; this limits
-- the columns. terms_accepted_at (the research-use certification record),
-- created_at and id stay as they are.

revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone, website, business_type, industry, ein)
  on public.profiles to authenticated;

alter table public.profiles
  add constraint profiles_first_name_length check (char_length(first_name) <= 100),
  add constraint profiles_last_name_length check (char_length(last_name) <= 100),
  add constraint profiles_phone_length check (char_length(phone) <= 30),
  add constraint profiles_website_length check (char_length(website) <= 500),
  add constraint profiles_business_type_length check (char_length(business_type) <= 100),
  add constraint profiles_industry_length check (char_length(industry) <= 100),
  add constraint profiles_ein_length check (char_length(ein) <= 20);

-- profile_changes: what changed, for staff ----------------------------------------
-- Written by the trigger below for profile edits, and by the server for
-- email-change requests and password changes. The EIN itself is never
-- logged, only its last 4 digits. Server-side only.

create table public.profile_changes (
  id bigint generated always as identity primary key,
  changed_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  field text not null check (char_length(field) <= 60),
  old_value text check (char_length(old_value) <= 600),
  new_value text check (char_length(new_value) <= 600)
);

create index profile_changes_user_id_idx on public.profile_changes (user_id, changed_at desc);
create index profile_changes_changed_at_idx on public.profile_changes (changed_at);

alter table public.profile_changes enable row level security;
revoke all on public.profile_changes from anon, authenticated;
grant select, insert on public.profile_changes to service_role;
grant usage on sequence public.profile_changes_id_seq to service_role;

create function public.log_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile_changes (user_id, field, old_value, new_value)
  select new.id, c.field, left(c.old_value, 600), left(c.new_value, 600)
  from (values
    ('name', nullif(concat_ws(' ', old.first_name, old.last_name), ''), nullif(concat_ws(' ', new.first_name, new.last_name), '')),
    ('phone', old.phone, new.phone),
    ('website', old.website, new.website),
    ('business type', old.business_type, new.business_type),
    ('industry', old.industry, new.industry),
    ('EIN',
      case when nullif(trim(old.ein), '') is not null then 'ending ' || right(regexp_replace(old.ein, '[^0-9]', '', 'g'), 4) end,
      case when nullif(trim(new.ein), '') is not null then 'ending ' || right(regexp_replace(new.ein, '[^0-9]', '', 'g'), 4) end)
  ) as c(field, old_value, new_value)
  where c.old_value is distinct from c.new_value
     or (c.field = 'EIN' and old.ein is distinct from new.ein);
  return new;
end;
$$;

revoke all on function public.log_profile_changes() from public, anon, authenticated;

create trigger log_profile_changes
  after update on public.profiles
  for each row execute function public.log_profile_changes();

-- activity_summary: also list profile changes (for the daily staff email) --------

create or replace function public.activity_summary(p_since timestamptz, p_until timestamptz)
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
    ),
    -- Customers' own changes on My Account -> Account Details.
    'profile_changes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'email', c.email, 'field', c.field, 'old_value', c.old_value, 'new_value', c.new_value
      ) order by c.changed_at), '[]'::jsonb)
      from (
        select u.email, pc.field, pc.old_value, pc.new_value, pc.changed_at
        from public.profile_changes pc
        join auth.users u on u.id = pc.user_id
        where pc.changed_at >= p_since and pc.changed_at < p_until
        order by pc.changed_at
        limit 100
      ) c
    )
  );
$$;

revoke all on function public.activity_summary(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.activity_summary(timestamptz, timestamptz) to service_role;

-- customer_timeline: add profile changes -----------------------------------------

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
from public.inquiries i
union all
select u.email, pc.changed_at, 'changed account details',
  pc.field || ': ' || coalesce(pc.old_value, '(blank)') || ' -> ' || coalesce(pc.new_value, '(blank)'),
  pc.user_id
from public.profile_changes pc join auth.users u on u.id = pc.user_id;
