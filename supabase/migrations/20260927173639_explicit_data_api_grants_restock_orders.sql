-- Follow-up to explicit_data_api_grants for the tables added since:
-- create_restock_requests and stripe_orders also relied on the default
-- grants Supabase stops giving new tables on 2026-10-30. Least privilege,
-- matching each table's RLS policies. A no-op on the live tables, which
-- already hold broader grants.

-- restock_requests: signed-in customers add themselves (RLS checks user_id
-- and email); lists are worked from the dashboard / service role.
grant insert on public.restock_requests to authenticated;
grant select, insert, update, delete on public.restock_requests to service_role;

-- restock_demand: dashboard-only view (anon/authenticated already revoked).
grant select on public.restock_demand to service_role;

-- orders: customers read their own (RLS); every write goes through the
-- server's secret-key client.
grant select on public.orders to authenticated;
grant select, insert, update, delete on public.orders to service_role;

-- stripe_customers, stripe_events: server-side only.
grant select, insert, update, delete on public.stripe_customers to service_role;
grant select, insert, update, delete on public.stripe_events to service_role;
