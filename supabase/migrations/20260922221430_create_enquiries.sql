-- Submissions from the /contact enquiry form. The site's server action
-- inserts rows (after verifying Turnstile) and emails support; nobody can
-- read rows through the API — view them in the Supabase dashboard.
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  first_name text not null check (char_length(first_name) between 1 and 100),
  last_name text check (char_length(last_name) <= 100),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 1 and 200),
  order_number text check (char_length(order_number) <= 100),
  message text not null check (char_length(message) between 1 and 5000),
  terms_accepted_at timestamptz not null,
  email_sent boolean not null default false
);

alter table public.enquiries enable row level security;

-- Insert-only: anyone (signed in or not) may add an enquiry, attributed
-- to themselves or to no one. No select/update/delete policies.
create policy "Anyone can submit an enquiry"
  on public.enquiries for insert
  to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

create index enquiries_created_at_idx on public.enquiries (created_at desc);
create index enquiries_user_id_idx on public.enquiries (user_id);
