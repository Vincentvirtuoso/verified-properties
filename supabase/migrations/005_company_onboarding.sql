-- ============================================================
-- Affilhomes — Company Onboarding
-- Migration: 005_company_onboarding
-- ============================================================

-- ------------------------------------------------------------
-- Add the roles array expected by the frontend auth model.
-- active_role remains the currently selected role.
-- ------------------------------------------------------------

alter table public.profiles
add column if not exists roles public.user_role[]
not null default array['viewer']::public.user_role[];

-- ------------------------------------------------------------
-- Company creation + first-admin onboarding
--
-- This is intentionally handled by one database function so
-- company creation, membership creation and profile attachment
-- happen atomically.
-- ------------------------------------------------------------

create or replace function public.create_company_for_current_user(
  p_name text,
  p_slug text,
  p_type public.company_type,
  p_contact_email text,
  p_contact_phone text default null,
  p_whatsapp_number text default null,
  p_logo text default null
)
returns public.companies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_company public.companies;
  v_profile_email text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select email
  into v_profile_email
  from public.profiles
  where id = v_user_id;

  if v_profile_email is null then
    raise exception 'User profile not found';
  end if;

  if lower(trim(p_contact_email)) <> lower(trim(v_profile_email)) then
    raise exception 'Company contact email must match the authenticated user email';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = v_user_id
      and company_id is not null
  ) then
    raise exception 'User is already attached to a company';
  end if;

  insert into public.companies (
    name,
    slug,
    type,
    contact_email,
    contact_phone,
    whatsapp_number,
    logo
  )
  values (
    trim(p_name),
    lower(trim(p_slug)),
    p_type,
    lower(trim(p_contact_email)),
    nullif(trim(p_contact_phone), ''),
    nullif(trim(p_whatsapp_number), ''),
    nullif(trim(p_logo), '')
  )
  returning * into v_company;

  insert into public.company_members (
    company_id,
    user_id,
    role,
    permissions
  )
  values (
    v_company.id,
    v_user_id,
    'admin',
    '[]'::jsonb
  );

  update public.profiles
  set
    company_id = v_company.id,
    company_role = 'admin',
    roles = array(
      select distinct role_value
      from unnest(
        coalesce(roles, array['viewer']::public.user_role[])
        || array['company']::public.user_role[]
      ) as role_value
    ),
    active_role = 'company'
  where id = v_user_id;

  return v_company;
end;
$$;

-- ------------------------------------------------------------
-- Function permissions
-- ------------------------------------------------------------

revoke execute
on function public.create_company_for_current_user(
  text,
  text,
  public.company_type,
  text,
  text,
  text,
  text
)
from public;

revoke execute
on function public.create_company_for_current_user(
  text,
  text,
  public.company_type,
  text,
  text,
  text,
  text
)
from anon;

grant execute
on function public.create_company_for_current_user(
  text,
  text,
  public.company_type,
  text,
  text,
  text,
  text
)
to authenticated;