-- handle_new_user is a trigger function (returns trigger) — it's only
-- ever meant to run via the on_auth_user_created trigger, which invokes
-- it under the table owner's rights regardless of role grants. Revoking
-- direct EXECUTE closes the /rest/v1/rpc/handle_new_user surface the
-- Supabase security linter flagged; it doesn't affect the trigger.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
