-- Public forms save through the server only ------------------------------------
-- The /contact form checks its Cloudflare Turnstile captcha in its server
-- action, and "Notify me when available" checks the product is in the
-- catalog. Both tables also accepted inserts straight through the Data API
-- with the public (publishable) key, which skipped those checks: anyone could
-- add unlimited inquiries without a captcha, and any signed-in customer
-- unlimited restock rows for made-up products (which then showed up, by
-- name, in the staff summary emails).
--
-- The server now saves both rows with the secret key after its own checks
-- (src/app/(store)/contact/actions.ts, src/lib/restock.ts), so the site
-- visitors' roles need no access to either table.
--
-- Deploy that code before applying this migration: until it ships, the live
-- forms insert as the visitor and would fail once this runs.
--
-- To undo (only together with reverting that code):
--   create policy "Anyone can submit an inquiry" on public.inquiries for insert
--     to anon, authenticated with check (user_id is null or user_id = (select auth.uid()));
--   grant insert on public.inquiries to anon, authenticated;
--   create policy "Customers can request a restock notice for themselves"
--     on public.restock_requests for insert to authenticated
--     with check (user_id = (select auth.uid()) and email = ((select auth.jwt()) ->> 'email'));
--   grant insert on public.restock_requests to authenticated;

-- inquiries --------------------------------------------------------------------

drop policy if exists "Anyone can submit an inquiry" on public.inquiries;
revoke all on public.inquiries from anon, authenticated;

-- The temporary alias left by the enquiries -> inquiries rename (2026-09-23)
-- was never dropped, and still took inserts. Nothing uses it.
drop view if exists public.enquiries;

-- restock_requests -------------------------------------------------------------

drop policy if exists "Customers can request a restock notice for themselves" on public.restock_requests;
revoke all on public.restock_requests from anon, authenticated;
