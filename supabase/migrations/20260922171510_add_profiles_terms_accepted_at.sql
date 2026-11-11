-- Records when the account accepted the "Acknowledgment & Research Use
-- Certification" checkbox on the registration form (RegisterFormParts.tsx
-- AcknowledgmentBlock) — a compliance record, not just a UI gate.
alter table public.profiles
  add column terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, business_type, industry, website, phone, terms_accepted_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'business_type',
    new.raw_user_meta_data ->> 'industry',
    new.raw_user_meta_data ->> 'website',
    new.raw_user_meta_data ->> 'phone',
    case
      when new.raw_user_meta_data ->> 'terms_accepted_at' is not null
      then (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz
      else null
    end
  );
  return new;
end;
$$;
