-- ============================================================
-- Affilhomes / Verified Properties — Backend foundation
-- Migration: 006_backend_foundation
--
-- Builds on 001_initial_schema and 005_company_onboarding.
-- No existing tables are duplicated. This migration:
--   1. Grants Data API access (required on newer Supabase projects)
--   2. Fixes the recursive company_members RLS policy
--   3. Protects privileged profile / company / property fields
--      from direct client writes (privilege-escalation guards)
--   4. Lets company members see their team and company listings
--   5. Stores phone/WhatsApp from sign-up and syncs email verification
--   6. Adds a secure RPC to submit company onboarding documents
--   7. Adds properties.video_links (the listing form already collects it)
--   8. Creates storage buckets + policies for listing media and documents
-- ============================================================

-- ------------------------------------------------------------
-- 1. GRANTS
-- RLS still decides which rows are visible; grants only expose tables.
-- ------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select, update on public.profiles to authenticated;
grant select, update on public.companies to authenticated;
grant select, update, delete on public.company_members to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select on public.properties to anon;
grant select, insert, update, delete on public.property_images to authenticated;
grant select on public.property_images to anon;
grant select, insert, update, delete on public.property_documents to authenticated;
grant select, insert, update, delete on public.jv_properties to authenticated;
grant select on public.jv_properties to anon;
grant select, insert, update, delete on public.jv_property_images to authenticated;
grant select on public.jv_property_images to anon;
grant select, insert, update on public.inquiries to authenticated;
grant select, insert on public.inquiry_messages to authenticated;
grant select on public.transactions to authenticated;

grant all on all tables in schema public to service_role;

-- ------------------------------------------------------------
-- 2. MEMBERSHIP HELPERS (security definer => no RLS recursion)
-- ------------------------------------------------------------

create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.company_members
    where company_id = p_company_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_company_admin(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.company_members
    where company_id = p_company_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- True when p_user_id belongs to a company the caller also belongs to.
create or replace function public.shares_company_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_members mine
    join public.company_members theirs
      on theirs.company_id = mine.company_id
    where mine.user_id = auth.uid()
      and theirs.user_id = p_user_id
  );
$$;

-- A user may publish (status = 'active') only when verified:
-- a verified agent, or a member of a verified company.
create or replace function public.can_publish_listings(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and p.agent_profile ->> 'verificationStatus' = 'verified'
  )
  or exists (
    select 1
    from public.company_members cm
    join public.companies c on c.id = cm.company_id
    where cm.user_id = p_user_id
      and c.verification_status = 'verified'
  );
$$;

revoke execute on function public.is_company_member(uuid) from public, anon;
revoke execute on function public.is_company_admin(uuid) from public, anon;
revoke execute on function public.shares_company_with(uuid) from public, anon;
revoke execute on function public.can_publish_listings(uuid) from public, anon;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.is_company_admin(uuid) to authenticated;
grant execute on function public.shares_company_with(uuid) to authenticated;
grant execute on function public.can_publish_listings(uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. COMPANY MEMBERS POLICIES (replace recursive policy)
-- ------------------------------------------------------------

drop policy if exists "Members can view their company membership"
  on public.company_members;

create policy "Members can view their company team"
on public.company_members
for select
to authenticated
using (user_id = auth.uid() or public.is_company_member(company_id));

create policy "Company admins can update other members"
on public.company_members
for update
to authenticated
using (public.is_company_admin(company_id) and user_id <> auth.uid())
with check (public.is_company_admin(company_id) and user_id <> auth.uid());

create policy "Company admins can remove other members"
on public.company_members
for delete
to authenticated
using (public.is_company_admin(company_id) and user_id <> auth.uid());

-- Company admins policy on companies used an inline subquery on
-- company_members; replace it with the helper for consistency.
drop policy if exists "Company admins can update their company"
  on public.companies;

create policy "Company admins can update their company"
on public.companies
for update
to authenticated
using (public.is_company_admin(id))
with check (public.is_company_admin(id));

-- Team members can read each other's basic profile (name/avatar on team page).
create policy "Company members can view teammates"
on public.profiles
for select
to authenticated
using (public.shares_company_with(id));

-- ------------------------------------------------------------
-- 4. PROFILE FIELD GUARD
-- Direct API writes run as role "authenticated". Security-definer
-- functions (e.g. create_company_for_current_user) run as the owner,
-- so they are not restricted by this guard.
-- ------------------------------------------------------------

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_added public.user_role[];
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Fields only the system may change.
  new.id := old.id;
  new.email := old.email;
  new.is_email_verified := old.is_email_verified;
  new.is_phone_verified := old.is_phone_verified;
  new.company_id := old.company_id;
  new.company_role := old.company_role;
  new.created_at := old.created_at;

  new.roles := coalesce(new.roles, old.roles);

  -- Roles can never be removed by the client.
  if not (old.roles <@ new.roles) then
    raise exception 'Roles cannot be removed';
  end if;

  -- Self-service roles: viewer and agent. Company only via RPC.
  select coalesce(array_agg(r), '{}')
  into v_added
  from unnest(new.roles) r
  where not (r = any(old.roles));

  if 'company'::public.user_role = any(v_added) then
    raise exception 'The company role is granted through company onboarding only';
  end if;

  -- Active role must be one the user holds.
  if not (new.active_role = any(new.roles)) then
    raise exception 'Active role % is not assigned to this user', new.active_role;
  end if;

  -- Company accounts are locked to the company role.
  if old.active_role = 'company' and new.active_role <> 'company' then
    raise exception 'This account role cannot be changed';
  end if;

  -- Agent verification and counters are system-managed.
  if new.agent_profile is not null then
    new.agent_profile := new.agent_profile
      || jsonb_build_object(
        'verificationStatus',
        coalesce(old.agent_profile ->> 'verificationStatus', 'unverified'),
        'activeListings',
        coalesce((old.agent_profile ->> 'activeListings')::int, 0),
        'activeBoostedListings',
        coalesce((old.agent_profile ->> 'activeBoostedListings')::int, 0)
      );
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
before update on public.profiles
for each row
execute function public.guard_profile_update();

-- ------------------------------------------------------------
-- 5. COMPANY FIELD GUARD
-- ------------------------------------------------------------

create or replace function public.guard_company_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  new.id := old.id;
  new.slug := old.slug;
  new.verification_status := old.verification_status;
  new.features := old.features;
  new.active_listings := old.active_listings;
  new.total_remitted := old.total_remitted;
  new.created_at := old.created_at;

  return new;
end;
$$;

drop trigger if exists companies_guard_update on public.companies;
create trigger companies_guard_update
before update on public.companies
for each row
execute function public.guard_company_update();

-- Company member rows: admins may change role/permissions only.
create or replace function public.guard_company_member_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  new.id := old.id;
  new.company_id := old.company_id;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists company_members_guard_update on public.company_members;
create trigger company_members_guard_update
before update on public.company_members
for each row
execute function public.guard_company_member_update();

-- Keep profiles.company_id / company_role in sync with membership changes.
create or replace function public.sync_profile_company_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    update public.profiles
    set company_id = null, company_role = null
    where id = old.user_id and company_id = old.company_id;
    return old;
  end if;

  update public.profiles
  set company_id = new.company_id, company_role = new.role
  where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists company_members_sync_profile on public.company_members;
create trigger company_members_sync_profile
after update of role or delete on public.company_members
for each row
execute function public.sync_profile_company_membership();

-- ------------------------------------------------------------
-- 6. PROPERTIES
-- ------------------------------------------------------------

alter table public.properties
  add column if not exists video_links text[] not null default '{}';

create or replace function public.guard_property_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  select * into v_profile from public.profiles where id = auth.uid();

  if v_profile.id is null then
    raise exception 'Profile not found';
  end if;

  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    new.tier := 'standard';
    new.active_boost_id := null;
    new.total_inquiries := 0;
    new.total_closed_deals := 0;
  else
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.tier := old.tier;
    new.active_boost_id := old.active_boost_id;
    new.total_inquiries := old.total_inquiries;
    new.total_closed_deals := old.total_closed_deals;
    new.created_at := old.created_at;
  end if;

  if new.owner_type = 'agent'
     and not ('agent'::public.user_role = any(v_profile.roles)) then
    raise exception 'Only agents can create agent listings';
  end if;

  if new.owner_type = 'company' and v_profile.company_id is null then
    raise exception 'Only company members can create company listings';
  end if;

  if new.status = 'active'
     and (tg_op = 'INSERT' or old.status <> 'active')
     and not public.can_publish_listings(auth.uid()) then
    raise exception 'Listings can be published after your account is verified';
  end if;

  return new;
end;
$$;

drop trigger if exists properties_guard_write on public.properties;
create trigger properties_guard_write
before insert or update on public.properties
for each row
execute function public.guard_property_write();

create policy "Company members can view company listings"
on public.properties
for select
to authenticated
using (owner_type = 'company' and public.shares_company_with(owner_id));

create policy "Owners can delete draft properties"
on public.properties
for delete
to authenticated
using (owner_id = auth.uid() and status = 'draft');

create policy "Company members can view company listing images"
on public.property_images
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_images.property_id
      and p.owner_type = 'company'
      and public.shares_company_with(p.owner_id)
  )
);

-- ------------------------------------------------------------
-- 7. SIGN-UP: store phone / WhatsApp, sync email verification
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    phone,
    whatsapp_number,
    is_email_verified
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'whatsapp_number', ''),
    new.email_confirmed_at is not null
  );

  return new;
end;
$$;

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = new.email,
    is_email_verified = new.email_confirmed_at is not null
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, email_confirmed_at on auth.users
for each row
execute function public.handle_user_email_update();

-- ------------------------------------------------------------
-- 8. COMPANY ONBOARDING DOCUMENTS
-- Admin submits CAC/logo URLs; status moves unverified -> pending.
-- ------------------------------------------------------------

create or replace function public.submit_company_onboarding_docs(
  p_company_id uuid,
  p_docs jsonb
)
returns public.companies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company public.companies;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_company_admin(p_company_id) then
    raise exception 'Only company admins can submit onboarding documents';
  end if;

  if coalesce(p_docs ->> 'cacCertificateUrl', '') = '' then
    raise exception 'CAC certificate is required';
  end if;

  update public.companies
  set
    onboarding_docs = coalesce(onboarding_docs, '{}'::jsonb) || p_docs,
    logo = coalesce(nullif(p_docs ->> 'companyLogoUrl', ''), logo),
    verification_status = case
      when verification_status in ('unverified', 'rejected') then 'pending'
      else verification_status
    end
  where id = p_company_id
  returning * into v_company;

  return v_company;
end;
$$;

revoke execute on function public.submit_company_onboarding_docs(uuid, jsonb)
  from public, anon;
grant execute on function public.submit_company_onboarding_docs(uuid, jsonb)
  to authenticated;

-- ------------------------------------------------------------
-- 9. STORAGE
-- Files live under "<user_id>/..." so ownership is path-based.
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('property-images', 'property-images', true),
  ('property-documents', 'property-documents', false),
  ('company-documents', 'company-documents', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Public read for public media buckets"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('property-images', 'avatars'));

create policy "Owners read their private files"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('property-documents', 'company-documents')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users upload into their own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('property-images', 'property-documents', 'company-documents', 'avatars')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users update their own files"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('property-images', 'property-documents', 'company-documents', 'avatars')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users delete their own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('property-images', 'property-documents', 'company-documents', 'avatars')
  and (storage.foldername(name))[1] = auth.uid()::text
);
