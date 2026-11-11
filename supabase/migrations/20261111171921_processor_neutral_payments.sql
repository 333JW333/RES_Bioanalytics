-- Processor-neutral payments.
--
-- Orders and their supporting tables no longer name a payment processor, so
-- a different processor can be plugged in without another schema change:
-- `processor` says which one handled the order, and the processor_* columns
-- hold that processor's own reference IDs. Existing rows are all Stripe.
--
-- Also adds orders.notifications_sent, the emails already sent for an order
-- (e.g. 'order_confirmed'), so each one goes out exactly once.

-- orders ---------------------------------------------------------------------

alter table public.orders drop constraint orders_payment_provider_check;
alter table public.orders rename column payment_provider to payment_flow;
update public.orders
  set payment_flow = case payment_flow
    when 'stripe_checkout' then 'checkout'
    when 'stripe_invoice' then 'invoice'
  end;
alter table public.orders
  add constraint orders_payment_flow_check check (payment_flow in ('checkout', 'invoice'));

alter table public.orders add column processor text not null default 'stripe';
alter table public.orders alter column processor drop default;
alter table public.orders
  add constraint orders_processor_check check (processor ~ '^[a-z][a-z0-9_]{1,30}$');

alter table public.orders rename column stripe_customer_id to processor_customer_id;
alter table public.orders rename column stripe_checkout_session_id to processor_checkout_id;
alter table public.orders rename column stripe_payment_intent_id to processor_payment_id;
alter table public.orders rename column stripe_invoice_id to processor_invoice_id;

-- Reference IDs are unique within a processor, not across processors.
alter table public.orders drop constraint orders_stripe_checkout_session_id_key;
alter table public.orders drop constraint orders_stripe_payment_intent_id_key;
alter table public.orders drop constraint orders_stripe_invoice_id_key;
alter table public.orders
  add constraint orders_processor_checkout_id_key unique (processor, processor_checkout_id);
alter table public.orders
  add constraint orders_processor_payment_id_key unique (processor, processor_payment_id);
alter table public.orders
  add constraint orders_processor_invoice_id_key unique (processor, processor_invoice_id);

alter table public.orders add column notifications_sent text[] not null default '{}';

-- customers: one saved customer per account per processor --------------------

alter table public.stripe_customers rename to processor_customers;
alter table public.processor_customers add column processor text not null default 'stripe';
alter table public.processor_customers alter column processor drop default;
alter table public.processor_customers rename column stripe_customer_id to customer_id;
alter table public.processor_customers drop constraint stripe_customers_pkey;
alter table public.processor_customers drop constraint stripe_customers_stripe_customer_id_key;
alter table public.processor_customers
  add constraint processor_customers_pkey primary key (user_id, processor);
alter table public.processor_customers
  add constraint processor_customers_customer_id_key unique (processor, customer_id);
alter table public.processor_customers
  rename constraint stripe_customers_user_id_fkey to processor_customers_user_id_fkey;

-- webhook events: de-duplicated per processor ---------------------------------

alter table public.stripe_events rename to payment_events;
alter table public.payment_events add column processor text not null default 'stripe';
alter table public.payment_events alter column processor drop default;
alter table public.payment_events drop constraint stripe_events_pkey;
alter table public.payment_events add constraint payment_events_pkey primary key (processor, id);

-- Renamed tables keep their RLS settings, policies and grants: RLS on, orders
-- readable by their owner, everything else server-side only.

-- order emails: each sent once -------------------------------------------------

-- Records that an email for an order is going out. Returns true for the first
-- caller only (null after that), so two deliveries of the same event can't
-- both send it.
create function public.claim_order_notification(p_order_id uuid, p_key text)
returns boolean
language sql
set search_path = ''
as $$
  update public.orders
     set notifications_sent = array_append(notifications_sent, p_key)
   where id = p_order_id
     and not (p_key = any (notifications_sent))
  returning true;
$$;

-- Undoes a claim when the email couldn't be sent, so a retry sends it.
create function public.release_order_notification(p_order_id uuid, p_key text)
returns void
language sql
set search_path = ''
as $$
  update public.orders
     set notifications_sent = array_remove(notifications_sent, p_key)
   where id = p_order_id;
$$;

-- Server-side only (the secret-key client).
revoke all on function public.claim_order_notification(uuid, text) from public, anon, authenticated;
revoke all on function public.release_order_notification(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_order_notification(uuid, text) to service_role;
grant execute on function public.release_order_notification(uuid, text) to service_role;
