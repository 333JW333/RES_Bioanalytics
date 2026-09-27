@AGENTS.md

# Supabase migrations

From 2026-10-30, Supabase no longer grants Data API access to new tables
in `public`. Any migration that creates a table or view must also grant
access to it, or `anon`/`authenticated`/`service_role` get "permission
denied" (live, on preview branches and on `supabase db reset`). Grant only
what the app and the RLS policies need, for example:

```sql
grant insert on public.inquiries to anon, authenticated;
grant select, insert, update, delete on public.inquiries to service_role;
```

Server code using the secret key runs as `service_role`, so server-only
tables still need that grant.
