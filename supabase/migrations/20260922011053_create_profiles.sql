-- profiles: one row per registered account, extends auth.users with the
-- research-registration fields collected by RegisterClient.tsx today
-- (name, business type, industry, website, phone). Auth itself — email,
-- password hash, email-confirmation state — lives in auth.users and is
-- managed entirely by Supabase Auth; this table only holds the extra
-- fields the registration form asks for.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  business_type text,
  industry text,
  website text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each account can read and update only its own profile row. There is
-- deliberately no insert policy for the authenticated/anon roles — rows
-- are created only by the handle_new_user trigger below, which runs as
-- the table owner (security definer) and bypasses RLS.
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row when someone signs up, pulling the
-- registration fields out of the signUp() call's user_metadata (see
-- supabase.auth.signUp({ options: { data: { first_name, ... } } })).
-- Fields are nullable above so this never fails signup if metadata is
-- ever absent (e.g. a future OAuth/magic-link path).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, business_type, industry, website, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'business_type',
    new.raw_user_meta_data ->> 'industry',
    new.raw_user_meta_data ->> 'website',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current whenever a profile is edited.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
