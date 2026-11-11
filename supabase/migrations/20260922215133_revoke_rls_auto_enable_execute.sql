-- rls_auto_enable() is the event-trigger function that turns on RLS for
-- new tables. It never needs to be called through the REST API; event
-- triggers fire it regardless of EXECUTE grants.
--
-- Guarded so a fresh database that doesn't have this Supabase-provided
-- function (preview branches, db reset) can replay the history. Production
-- ran the unguarded revoke on 2026-09-22; the effect there is the same.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;
