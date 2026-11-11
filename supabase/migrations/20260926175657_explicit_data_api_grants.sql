-- Supabase stops auto-granting Data API access to new tables in public on
-- 2026-10-30. The live tables keep the grants they got from the old
-- defaults, but create_profiles and create_enquiries never granted
-- anything explicitly, so rebuilding from these migrations (preview
-- branch, new project, db reset) would leave both tables unreachable
-- through the API. These grants spell out the access the app needs,
-- matching the RLS policies. On the live tables, which already hold
-- broader grants, this is a no-op.

-- profiles: signed-in users read and update their own row (RLS). Rows
-- are created by the handle_new_user trigger as the table owner, so no
-- insert grant for API roles.
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

-- inquiries: the /contact server action inserts without reading the row
-- back, so anon and authenticated need insert only.
grant insert on public.inquiries to anon, authenticated;
grant select, insert, update, delete on public.inquiries to service_role;
