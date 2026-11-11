alter table public.enquiries rename to inquiries;

alter table public.inquiries rename constraint enquiries_pkey to inquiries_pkey;
alter table public.inquiries rename constraint enquiries_user_id_fkey to inquiries_user_id_fkey;
alter table public.inquiries rename constraint enquiries_first_name_check to inquiries_first_name_check;
alter table public.inquiries rename constraint enquiries_last_name_check to inquiries_last_name_check;
alter table public.inquiries rename constraint enquiries_email_check to inquiries_email_check;
alter table public.inquiries rename constraint enquiries_subject_check to inquiries_subject_check;
alter table public.inquiries rename constraint enquiries_order_number_check to inquiries_order_number_check;
alter table public.inquiries rename constraint enquiries_message_check to inquiries_message_check;

alter index public.enquiries_created_at_idx rename to inquiries_created_at_idx;
alter index public.enquiries_user_id_idx rename to inquiries_user_id_idx;

alter policy "Anyone can submit an enquiry" on public.inquiries
  rename to "Anyone can submit an inquiry";

-- Temporary alias so the currently deployed site, which still inserts into
-- "enquiries", keeps working until the code that uses "inquiries" ships.
-- security_invoker applies the caller's RLS on public.inquiries; it grants
-- insert only. Drop it once the rename is deployed.
create view public.enquiries
  with (security_invoker = true)
  as select * from public.inquiries;

revoke all on public.enquiries from anon, authenticated;
grant insert on public.enquiries to anon, authenticated;
