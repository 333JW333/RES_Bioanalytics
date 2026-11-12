-- Contact-form inquiries are now saved by the server only.
--
-- The table used to accept inserts from anyone holding the site's public
-- key, so the form's security check (Cloudflare Turnstile, verified in
-- src/app/(store)/contact/actions.ts) could be skipped by writing to the
-- Data API directly: unlimited rows, each of which also lands in the daily
-- staff summary email. The server action now inserts with the secret key
-- after the check passes, and browsers get no access at all.
--
-- Apply this AFTER the code that inserts with the secret key is deployed;
-- the earlier code inserts as the visitor and would start failing.

-- The temporary alias from the enquiries -> inquiries rename; nothing has
-- used it since that rename shipped.
drop view if exists public.enquiries;

drop policy if exists "Anyone can submit an inquiry" on public.inquiries;

revoke all on public.inquiries from anon, authenticated;
