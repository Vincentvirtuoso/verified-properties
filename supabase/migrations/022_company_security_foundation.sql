-- ============================================================
-- 022 COMPANY SECURITY FOUNDATION
-- Run after 021_company_member_invite.sql.
--
-- Keep public company directory fields behind get_public_companies().
-- Scope private company data and writes to company membership permissions.
-- Ensure company membership is created only after partnership approval.
-- ============================================================

-- ------------------------------------------------------------
-- Registration columns used by the existing client and admin UI.
-- The draft/submit/approval RPCs below are the only authenticated write path.
-- ------------------------------------------------------------

alter table public.company_registrations
  add column if not exists applicant_name text,
  add column if not exists applicant_email text,
  add column if not exists applicant_phone text,
  add column if not exists applicant_authorised boolean not null default false,
  add column if not exists authorised_at timestamptz,
  add column if not exists cac_sha256 text,
  add column if not exists rejection_scope text;

revoke all on table public.company_registrations from public, anon, authenticated;
grant select on table public.company_registrations to authenticated;

-- ------------------------------------------------------------
-- Company permission helper. Company admins have all company permissions;
-- members only have the explicitly stored permissions.
-- ------------------------------------------------------------

create or replace function public.has_company_permission(
  p_company_id uuid,
  p_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    p_company_id is not null
    and auth.uid() is not null
    and p_permission in ('manage_listings', 'manage_members', 'view_analytics')
    and exists (
      select 1
      from public.company_members m
      where m.company_id = p_company_id
        and m.user_id = auth.uid()
        and (
          m.role = 'admin'::public.company_member_role
          or coalesce(m.permissions, '[]'::jsonb) ? p_permission
        )
    ),
    false
  );
$$;

revoke all on function public.has_company_permission(uuid, text) from public, anon;
grant execute on function public.has_company_permission(uuid, text) to authenticated;

create or replace function public.can_manage_company_listing(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.properties pr
    join public.profiles owner_profile on owner_profile.id = pr.owner_id
    where pr.id = p_property_id
      and pr.owner_type = 'company'
      and owner_profile.company_id is not null
      and public.has_company_permission(
        owner_profile.company_id,
        'manage_listings'
      )
  );
$$;

revoke all on function public.can_manage_company_listing(uuid) from public, anon;
grant execute on function public.can_manage_company_listing(uuid) to authenticated;

-- ------------------------------------------------------------
-- Company table visibility and column grants.
-- Public directory fields remain available through the explicit public RPC.
-- ------------------------------------------------------------

drop policy if exists "Authenticated users can view companies" on public.companies;
drop policy if exists "Company members can view their company" on public.companies;
create policy "Company members can view their company"
on public.companies
for select
to authenticated
using (public.is_company_member(id));

revoke all on table public.companies from public, anon, authenticated;
grant select (
  id,
  name,
  slug,
  logo,
  type,
  verification_status,
  features,
  contact_email,
  contact_phone,
  whatsapp_number,
  created_at,
  updated_at
) on public.companies to authenticated;
grant update (
  logo,
  contact_email,
  contact_phone,
  whatsapp_number,
  remittance_details
) on public.companies to authenticated;

create or replace function public.get_company_for_member(p_company_id uuid)
returns table (
  id uuid,
  name text,
  slug text,
  logo text,
  type public.company_type,
  verification_status public.verification_status,
  onboarding_docs jsonb,
  features jsonb,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  active_listings integer,
  total_remitted numeric,
  remittance_details jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_company_member(p_company_id) then
    raise exception 'Company members only' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    c.name,
    c.slug,
    c.logo,
    c.type,
    c.verification_status,
    case
      when public.is_company_admin(p_company_id) then c.onboarding_docs
      else null::jsonb
    end,
    c.features,
    c.contact_email,
    c.contact_phone,
    c.whatsapp_number,
    case
      when public.has_company_permission(p_company_id, 'view_analytics')
        then c.active_listings
      else null::integer
    end,
    case
      when public.has_company_permission(p_company_id, 'view_analytics')
        then c.total_remitted
      else null::numeric
    end,
    case
      when public.is_company_admin(p_company_id) then c.remittance_details
      else null::jsonb
    end,
    c.created_at,
    c.updated_at
  from public.companies c
  where c.id = p_company_id;
end;
$$;

revoke all on function public.get_company_for_member(uuid) from public, anon;
grant execute on function public.get_company_for_member(uuid) to authenticated;

-- ------------------------------------------------------------
-- Company registration approval path.
-- The company role and membership are assigned only in the approval RPC.
-- ------------------------------------------------------------

create or replace function public.save_company_registration_draft(
  p_company_name text,
  p_company_type text,
  p_contact_email text,
  p_contact_phone text,
  p_whatsapp_number text,
  p_applicant_name text,
  p_applicant_phone text,
  p_applicant_email text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if v_profile.id is null then
    raise exception 'User profile not found';
  end if;
  if v_profile.company_id is not null
     or 'company'::public.user_role = any(v_profile.roles) then
    raise exception 'This account already has a company role' using errcode = '42501';
  end if;
  if nullif(btrim(p_company_name), '') is null
     or nullif(btrim(p_contact_email), '') is null
     or nullif(btrim(p_applicant_name), '') is null then
    raise exception 'Company and applicant details are required';
  end if;
  if nullif(btrim(p_applicant_email), '') is null
     or lower(btrim(p_applicant_email)) <> lower(v_profile.email) then
    raise exception 'Applicant email must match the signed-in account' using errcode = '42501';
  end if;

  if p_company_type is null then
    raise exception 'Company type is required';
  end if;
  perform p_company_type::public.company_type;

  insert into public.company_registrations (
    user_id,
    status,
    company_name,
    company_type,
    contact_email,
    contact_phone,
    whatsapp_number,
    applicant_name,
    applicant_email,
    applicant_phone,
    applicant_authorised,
    authorised_at,
    rejection_reason,
    rejection_scope,
    updated_at
  ) values (
    v_user_id,
    'draft'::public.company_reg_status,
    btrim(p_company_name),
    p_company_type,
    lower(btrim(p_contact_email)),
    nullif(btrim(p_contact_phone), ''),
    nullif(btrim(p_whatsapp_number), ''),
    btrim(p_applicant_name),
    lower(v_profile.email),
    nullif(btrim(p_applicant_phone), ''),
    false,
    null,
    null,
    null,
    now()
  )
  on conflict (user_id)
    where status in ('draft'::public.company_reg_status, 'docs_submitted'::public.company_reg_status)
  do update set
    company_name = excluded.company_name,
    company_type = excluded.company_type,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    whatsapp_number = excluded.whatsapp_number,
    applicant_name = excluded.applicant_name,
    applicant_email = excluded.applicant_email,
    applicant_phone = excluded.applicant_phone,
    applicant_authorised = false,
    authorised_at = null,
    rejection_reason = null,
    rejection_scope = null,
    updated_at = now()
  where public.company_registrations.status = 'draft'::public.company_reg_status
  returning id into v_id;

  if v_id is null then
    raise exception 'A submitted application cannot be edited';
  end if;

  return v_id;
end;
$$;

-- PostgreSQL does not allow CREATE OR REPLACE to remove defaults from an
-- existing signature, so drop the exact four-argument overload first.
drop function if exists public.submit_company_registration(text, text, boolean, text);

create or replace function public.submit_company_registration(
  p_cac_path text,
  p_logo_url text,
  p_authorised boolean,
  p_cac_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if coalesce(p_authorised, false) is not true then
    raise exception 'Applicant authorisation is required';
  end if;
  if nullif(p_cac_path, '') is null
     or split_part(p_cac_path, '/', 1) <> v_user_id::text then
    raise exception 'CAC document path must belong to the signed-in user';
  end if;
  if p_cac_hash is null or p_cac_hash !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'Invalid CAC document hash';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'company-documents'
      and o.name = p_cac_path
  ) then
    raise exception 'CAC document was not uploaded';
  end if;
  if p_logo_url is not null
     and position('/storage/v1/object/public/avatars/' || v_user_id::text || '/' in p_logo_url) = 0 then
    raise exception 'Company logo must belong to the signed-in user';
  end if;

  update public.company_registrations r
  set status = 'docs_submitted'::public.company_reg_status,
      cac_cert_path = p_cac_path,
      cac_sha256 = lower(p_cac_hash),
      logo_url = coalesce(p_logo_url, r.logo_url),
      applicant_authorised = true,
      authorised_at = now(),
      rejection_reason = null,
      rejection_scope = null,
      updated_at = now()
  where r.user_id = v_user_id
    and r.status = 'draft'::public.company_reg_status
    and r.company_name is not null
    and r.company_type is not null
    and r.contact_email is not null
  returning r.id into v_id;

  if v_id is null then
    raise exception 'No complete draft is available to submit';
  end if;

  return v_id;
end;
$$;

create or replace function public.approve_company_registration(p_registration_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.company_registrations;
  v_profile public.profiles;
  v_company_id uuid;
begin
  if not (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'super_admin'::public.app_role)
  ) then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  select * into r
  from public.company_registrations
  where id = p_registration_id
    and status = 'docs_submitted'::public.company_reg_status
  for update;

  if not found then
    raise exception 'Registration is not awaiting review';
  end if;
  if r.applicant_authorised is not true
     or r.authorised_at is null
     or r.cac_cert_path is null
     or r.cac_sha256 is null then
    raise exception 'Required applicant authorisation or CAC details are missing';
  end if;

  select * into v_profile
  from public.profiles
  where id = r.user_id
  for update;

  if v_profile.id is null
     or v_profile.company_id is not null
     or 'company'::public.user_role = any(v_profile.roles)
     or exists (
       select 1 from public.company_members m where m.user_id = r.user_id
     ) then
    raise exception 'Applicant already belongs to a company';
  end if;

  insert into public.companies (
    name,
    slug,
    type,
    contact_email,
    contact_phone,
    whatsapp_number,
    logo,
    onboarding_docs,
    verification_status
  ) values (
    r.company_name,
    lower(regexp_replace(r.company_name, '\s+', '-', 'g')) || '-' || left(r.id::text, 6),
    r.company_type::public.company_type,
    r.contact_email,
    r.contact_phone,
    r.whatsapp_number,
    r.logo_url,
    jsonb_build_object('cacCertificateUrl', r.cac_cert_path),
    'verified'::public.verification_status
  )
  returning id into v_company_id;

  insert into public.company_members (
    company_id,
    user_id,
    role,
    permissions
  ) values (
    v_company_id,
    r.user_id,
    'admin'::public.company_member_role,
    '[]'::jsonb
  );

  update public.profiles p
  set company_id = v_company_id,
      company_role = 'admin'::public.company_member_role,
      roles = array(
        select distinct role_value
        from unnest(
          coalesce(p.roles, array['viewer'::public.user_role])
          || array['company'::public.user_role]
        ) as role_value
      ),
      active_role = 'company'::public.user_role
  where p.id = r.user_id;

  update public.company_registrations
  set status = 'verified'::public.company_reg_status,
      updated_at = now()
  where id = r.id;

  return v_company_id;
end;
$$;

create or replace function public.reject_company_registration(
  p_registration_id uuid,
  p_scope text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'super_admin'::public.app_role)
  ) then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if p_scope is null
     or p_scope not in ('cac_document', 'details', 'other')
     or nullif(btrim(p_reason), '') is null
     or char_length(btrim(p_reason)) > 1000 then
    raise exception 'A valid rejection scope and reason are required';
  end if;

  update public.company_registrations
  set status = 'rejected'::public.company_reg_status,
      rejection_scope = p_scope,
      rejection_reason = btrim(p_reason),
      updated_at = now()
  where id = p_registration_id
    and status = 'docs_submitted'::public.company_reg_status;

  if not found then
    raise exception 'Registration is not awaiting review';
  end if;
end;
$$;

drop function if exists public.submit_company_registration(text, text);
revoke all on function public.save_company_registration_draft(text, text, text, text, text, text, text, text) from public, anon;
revoke all on function public.submit_company_registration(text, text, boolean, text) from public, anon;
revoke all on function public.approve_company_registration(uuid) from public, anon;
revoke all on function public.reject_company_registration(uuid, text, text) from public, anon;
grant execute on function public.save_company_registration_draft(text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.submit_company_registration(text, text, boolean, text) to authenticated;
grant execute on function public.approve_company_registration(uuid) to authenticated;
grant execute on function public.reject_company_registration(uuid, text, text) to authenticated;

-- A company membership row cannot be created until partnership approval.
create or replace function public.require_approved_company_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.verification_status;
begin
  select c.verification_status into v_status
  from public.companies c
  where c.id = new.company_id
  for key share;

  if v_status is distinct from 'verified'::public.verification_status then
    raise exception 'Company membership requires an approved partnership' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists company_members_require_approval on public.company_members;
create trigger company_members_require_approval
before insert on public.company_members
for each row execute function public.require_approved_company_membership();

-- ------------------------------------------------------------
-- Invitation permissions and approval gate.
-- ------------------------------------------------------------

revoke all on table public.company_invitations from public, anon, authenticated;
grant select on table public.company_invitations to authenticated;

drop policy if exists "members read their company's invitations" on public.company_invitations;
drop policy if exists "managers read their company's invitations" on public.company_invitations;
create policy "managers read their company's invitations"
on public.company_invitations
for select
to authenticated
using (public.has_company_permission(company_id, 'manage_members'));

create or replace function public.create_company_invitation(
  p_company_id uuid,
  p_email text,
  p_role text,
  p_permissions text[]
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_caller uuid := auth.uid();
  v_perms jsonb;
  v_grant jsonb;
  v_email text := lower(trim(p_email));
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_is_admin boolean;
begin
  if v_caller is null then
    raise exception 'Sign in to invite members' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.companies c
    where c.id = p_company_id
      and c.verification_status = 'verified'::public.verification_status
  ) then
    raise exception 'Partnership approval is required before inviting members' using errcode = '42501';
  end if;

  if not public.has_company_permission(p_company_id, 'manage_members') then
    raise exception 'You do not have permission to invite members' using errcode = '42501';
  end if;
  v_perms := public.company_permissions(p_company_id, v_caller);

  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Enter a valid email address';
  end if;

  v_is_admin := exists (
    select 1 from public.company_members m
    where m.company_id = p_company_id
      and m.user_id = v_caller
      and m.role = 'admin'::public.company_member_role
  );

  if p_role = 'admin' then
    if not v_is_admin then
      raise exception 'Only company admins can invite other admins' using errcode = '42501';
    end if;
    v_grant := jsonb_build_array('manage_listings', 'manage_members', 'view_analytics');
  elsif p_role = 'member' then
    v_grant := to_jsonb(coalesce(p_permissions, '{}'::text[]));
    if jsonb_array_length(v_grant) = 0 then
      raise exception 'Choose at least one permission';
    end if;
    if exists (
      select 1 from jsonb_array_elements_text(v_grant) g(value)
      where g.value not in ('manage_listings', 'manage_members', 'view_analytics')
         or not (v_perms ? g.value)
    ) then
      raise exception 'You can only grant valid permissions you have' using errcode = '42501';
    end if;
  else
    raise exception 'Invalid role';
  end if;

  if exists (
    select 1
    from public.company_members m
    join public.profiles p on p.id = m.user_id
    where m.company_id = p_company_id and lower(p.email) = v_email
  ) then
    raise exception 'This person is already on the team';
  end if;

  insert into public.company_invitations (
    company_id, email, role, permissions, token_hash, invited_by, expires_at
  ) values (
    p_company_id,
    v_email,
    p_role,
    v_grant,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_caller,
    now() + interval '7 days'
  )
  on conflict (company_id, email)
    where accepted_at is null and revoked_at is null
  do update set
    role = excluded.role,
    permissions = excluded.permissions,
    token_hash = excluded.token_hash,
    invited_by = excluded.invited_by,
    expires_at = excluded.expires_at,
    created_at = now();

  return v_token;
end;
$$;

create or replace function public.accept_company_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_caller uuid := auth.uid();
  v_inv public.company_invitations;
  v_email text;
  v_confirmed timestamptz;
  v_current uuid;
  v_roles public.user_role[];
begin
  if v_caller is null then
    raise exception 'Sign in to accept this invitation' using errcode = '42501';
  end if;

  select * into v_inv
  from public.company_invitations
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if not found then raise exception 'This invitation link is not valid'; end if;
  if v_inv.revoked_at is not null then raise exception 'This invitation was cancelled'; end if;
  if v_inv.accepted_at is not null then raise exception 'This invitation has already been used'; end if;
  if v_inv.expires_at <= now() then raise exception 'This invitation has expired'; end if;

  if not exists (
    select 1 from public.companies c
    where c.id = v_inv.company_id
      and c.verification_status = 'verified'::public.verification_status
  ) then
    raise exception 'Partnership approval is required before joining this company' using errcode = '42501';
  end if;

  -- Serialize acceptance of invitations for the same user across companies.
  select lower(u.email), u.email_confirmed_at
  into v_email, v_confirmed
  from auth.users u
  where u.id = v_caller;

  select company_id, roles into v_current, v_roles
  from public.profiles
  where id = v_caller
  for update;

  if v_confirmed is null then
    raise exception 'Confirm your email address before accepting this invitation';
  end if;
  if v_email is distinct from v_inv.email then
    raise exception 'This invitation was sent to a different email address'
      using detail = v_inv.email;
  end if;
  if 'agent'::public.user_role = any(coalesce(v_roles, '{}'::public.user_role[])) then
    raise exception 'Agent accounts cannot join a company team';
  end if;
  if v_current is not null or 'company'::public.user_role = any(coalesce(v_roles, '{}'::public.user_role[])) then
    raise exception 'Your account already belongs to a company';
  end if;
  if exists (
    select 1 from public.company_members m where m.user_id = v_caller
  ) then
    raise exception 'Your account already belongs to a company';
  end if;

  insert into public.company_members (company_id, user_id, role, permissions)
  values (v_inv.company_id, v_caller, v_inv.role::public.company_member_role, v_inv.permissions);

  update public.profiles p
  set company_id = v_inv.company_id,
      company_role = v_inv.role::public.company_member_role,
      roles = array(
        select distinct role_value
        from unnest(
          coalesce(p.roles, array['viewer'::public.user_role])
          || array['company'::public.user_role]
        ) as role_value
      ),
      active_role = 'company'::public.user_role
  where p.id = v_caller;

  update public.company_invitations
  set accepted_at = now(), accepted_by = v_caller
  where id = v_inv.id;

  return v_inv.company_id;
end;
$$;

revoke all on function public.create_company_invitation(uuid, text, text, text[]) from public, anon;
revoke all on function public.accept_company_invitation(text) from public, anon;
grant execute on function public.create_company_invitation(uuid, text, text, text[]) to authenticated;
grant execute on function public.accept_company_invitation(text) to authenticated;

-- The legacy RPC creates an unapproved company and immediately assigns the
-- company role. Authenticated callers must use the registration approval flow.
revoke all on function public.create_company_for_current_user(
  text, text, public.company_type, text, text, text, text
) from public, anon, authenticated, service_role;

-- ------------------------------------------------------------
-- Listing management permission at every database write boundary.
-- ------------------------------------------------------------

create or replace function public.guard_property_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_company_id uuid;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  select * into v_profile
  from public.profiles
  where id = auth.uid();

  if v_profile.id is null then
    raise exception 'Profile not found';
  end if;

  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    new.tier := 'standard'::public.property_tier;
    new.active_boost_id := null;
    new.total_inquiries := 0;
    new.total_closed_deals := 0;
  else
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.owner_type := old.owner_type;
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

  if new.owner_type = 'company' then
    if tg_op = 'INSERT' then
      v_company_id := v_profile.company_id;
    else
      select owner_profile.company_id into v_company_id
      from public.profiles owner_profile
      where owner_profile.id = old.owner_id;
    end if;

    if v_company_id is null
       or v_profile.company_id is distinct from v_company_id
       or not public.has_company_permission(v_company_id, 'manage_listings') then
      raise exception 'Company listing permission required' using errcode = '42501';
    end if;
  end if;

  if new.status = 'active'
     and (tg_op = 'INSERT' or old.status <> 'active')
     and not public.can_publish_listings(auth.uid()) then
    raise exception 'Listings can be published after your account is verified';
  end if;

  return new;
end;
$$;

drop policy if exists "Owners can create properties" on public.properties;
create policy "Owners can create properties"
on public.properties
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and (
    owner_type <> 'company'
    or public.has_company_permission(
      (select p.company_id from public.profiles p where p.id = auth.uid()),
      'manage_listings'
    )
  )
);

drop policy if exists "Owners can update their properties" on public.properties;
create policy "Owners and company listing managers can update properties"
on public.properties
for update
to authenticated
using (
  (owner_id = auth.uid() and owner_type <> 'company')
  or public.can_manage_company_listing(id)
)
with check (
  (owner_id = auth.uid() and owner_type <> 'company')
  or public.can_manage_company_listing(id)
);

drop policy if exists "Owners can delete draft properties" on public.properties;
create policy "Owners and company listing managers can delete drafts"
on public.properties
for delete
to authenticated
using (
  status = 'draft'
  and (
    (owner_id = auth.uid() and owner_type <> 'company')
    or public.can_manage_company_listing(id)
  )
);

drop policy if exists "Property owners can manage images" on public.property_images;
create policy "Owners and company listing managers can manage images"
on public.property_images
for all
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_images.property_id
      and p.owner_id = auth.uid()
      and p.owner_type <> 'company'
  )
  or public.can_manage_company_listing(property_id)
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_images.property_id
      and p.owner_id = auth.uid()
      and p.owner_type <> 'company'
  )
  or public.can_manage_company_listing(property_id)
);

drop policy if exists "Property owners can view their documents" on public.property_documents;
create policy "Owners and company listing managers can view documents"
on public.property_documents
for select
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_documents.property_id
      and p.owner_id = auth.uid()
      and p.owner_type <> 'company'
  )
  or public.can_manage_company_listing(property_id)
);

drop policy if exists "Property owners can manage documents" on public.property_documents;
create policy "Owners and company listing managers can manage documents"
on public.property_documents
for all
to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_documents.property_id
      and p.owner_id = auth.uid()
      and p.owner_type <> 'company'
  )
  or public.can_manage_company_listing(property_id)
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_documents.property_id
      and p.owner_id = auth.uid()
      and p.owner_type <> 'company'
  )
  or public.can_manage_company_listing(property_id)
);

create or replace function public.submit_listing_for_review(_property_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  _p public.properties;
  _allowed boolean;
begin
  select * into _p
  from public.properties
  where id = _property_id;

  if _p.id is null then
    raise exception 'Listing not found';
  end if;

  _allowed := case
    when _p.owner_type = 'company'
      then public.can_manage_company_listing(_p.id)
    else _p.owner_id = auth.uid()
  end;
  if not coalesce(_allowed, false) then
    raise exception 'You cannot manage this listing' using errcode = '42501';
  end if;
  if public.is_suspended(auth.uid()) then
    raise exception 'Your account is suspended' using errcode = '42501';
  end if;
  if not public.can_publish_listings(auth.uid()) then
    raise exception 'Get verified before submitting listings';
  end if;
  if _p.status not in ('draft'::public.property_status, 'inactive'::public.property_status) then
    raise exception 'Only drafts or hidden listings can be submitted';
  end if;
  if _p.review_status = 'pending' then
    return 'pending';
  end if;

  if _p.review_status = 'approved' then
    update public.properties set status = 'active'::public.property_status where id = _p.id;
    return 'active';
  end if;

  update public.properties
  set review_status = 'pending', submitted_at = now(), review_note = null
  where id = _p.id;
  return 'pending';
end;
$$;

revoke all on function public.submit_listing_for_review(uuid) from public, anon;
grant execute on function public.submit_listing_for_review(uuid) to authenticated;

-- ------------------------------------------------------------
-- Analytics permission at the aggregate RPC boundary.
-- ------------------------------------------------------------

create or replace function public.get_company_dashboard_stats(_company_id uuid)
returns table (
  team_size integer,
  active_listings integer,
  draft_listings integer,
  hidden_listings integer,
  closed_deals integer,
  live_value numeric,
  total_enquiries integer,
  open_enquiries integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_company_member(_company_id) then
    raise exception 'Company members only' using errcode = '42501';
  end if;
  if not public.has_company_permission(_company_id, 'view_analytics') then
    raise exception 'Analytics permission required' using errcode = '42501';
  end if;

  return query
  with listings as (
    select pr.id, pr.status, pr.price
    from public.properties pr
    join public.company_members m on m.user_id = pr.owner_id
    where m.company_id = _company_id
      and pr.owner_type = 'company'
  )
  select
    (select count(*)::integer from public.company_members where company_id = _company_id),
    (select count(*)::integer from listings where status = 'active'::public.property_status),
    (select count(*)::integer from listings where status = 'draft'::public.property_status),
    (select count(*)::integer from listings where status = 'inactive'::public.property_status),
    (select count(*)::integer from listings where status in ('sold'::public.property_status, 'rented'::public.property_status)),
    (select coalesce(sum(price), 0) from listings where status = 'active'::public.property_status),
    (select count(*)::integer from public.inquiries i where i.listing_id in (select id from listings)),
    (select count(*)::integer from public.inquiries i
     where i.listing_id in (select id from listings)
       and i.status in ('open'::public.inquiry_status, 'in_progress'::public.inquiry_status));
end;
$$;

revoke all on function public.get_company_dashboard_stats(uuid) from public, anon;
grant execute on function public.get_company_dashboard_stats(uuid) to authenticated;

-- Invite storage remains private to applicants, with platform reviewers able
-- to create short-lived signed URLs through the existing admin UI.
drop policy if exists "Admins read company registration documents" on storage.objects;
create policy "Admins read company registration documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'company-documents'
  and (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);

