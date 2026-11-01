-- ============================================================
-- 023 PARTNERSHIP APPROVAL INTEGRITY
--
-- Partnership Requests is the only path that may create and verify a new
-- company or assign its initial admin membership. Existing companies are not
-- automatically changed. Data preflight checks below stop the migration when
-- legacy membership/profile state needs operator reconciliation.
-- ============================================================

-- Migration 014 references this role label, while migration 010's enum does
-- not declare it. Keep already-deployed projects and future function checks
-- consistent; fresh migration replays still need the documented pre-014 step.
alter type public.app_role add value if not exists 'super_admin';

-- ------------------------------------------------------------
-- Trusted platform-admin check. Cast enum roles to text so this check does
-- not depend on whether a deployment has the optional super_admin enum label.
-- This helper is internal to SECURITY DEFINER functions.
-- ------------------------------------------------------------

create or replace function public.is_active_platform_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null
     and exists (
       select 1
       from public.user_roles ur
       join public.profiles p on p.id = ur.user_id
       where ur.user_id = p_user_id
         and ur.role::text in ('admin', 'super_admin')
         and coalesce(p.admin_status, 'active') = 'active'
     );
$$;

revoke all on function public.is_active_platform_admin(uuid)
  from public, anon, authenticated, service_role;

-- Remove the public-signup metadata path that could bootstrap a super admin.
drop trigger if exists on_profile_admin_signup on public.profiles;
drop function if exists public.promote_admin_on_signup();

-- ------------------------------------------------------------
-- Preflight: do not silently repair or discard any existing memberships.
-- Resolve every reported record manually, then rerun this migration.
-- ------------------------------------------------------------

do $$
declare
  v_rows text;
begin
  select string_agg(format('%s (%s, members=%s)', company_id, company_status, member_count), '; ')
  into v_rows
  from (
    select c.id as company_id,
           c.verification_status as company_status,
           count(m.user_id) as member_count
    from public.companies c
    left join public.company_members m on m.company_id = c.id
    where c.verification_status <> 'verified'::public.verification_status
    group by c.id, c.verification_status
    order by c.id
    limit 50
  ) legacy_companies;

  if v_rows is not null then
    raise notice 'Legacy non-verified company rows require manual review; none will be approved automatically: %', v_rows;
  end if;

  select string_agg(format('%s: %s', user_id, company_ids), '; ')
  into v_rows
  from (
    select m.user_id, array_agg(distinct m.company_id order by m.company_id) as company_ids
    from public.company_members m
    group by m.user_id
    having count(distinct m.company_id) > 1
    order by m.user_id
    limit 20
  ) duplicates;

  if v_rows is not null then
    raise exception 'Stage 2 blocked: users have memberships in multiple companies'
      using detail = v_rows,
            hint = 'Manually determine the legitimate company for each user; do not delete rows automatically.';
  end if;

  select string_agg(format('%s (status=%s)', company_id, company_status), '; ')
  into v_rows
  from (
    select c.id as company_id, c.verification_status as company_status
    from public.company_members m
    join public.companies c on c.id = m.company_id
    where c.verification_status <> 'verified'::public.verification_status
    group by c.id, c.verification_status
    order by c.id
    limit 20
  ) blocked_companies;

  if v_rows is not null then
    raise exception 'Stage 2 blocked: legacy memberships exist for pending, rejected, or unverified companies'
      using detail = v_rows,
            hint = 'Manually review each company and its members. No company is approved or removed by this migration.';
  end if;

  select string_agg(format('%s (company_id=%s, role=%s, active_role=%s, company_role=%s)',
                           id, company_id, roles, active_role, company_role), '; ')
  into v_rows
  from (
    select p.id, p.company_id, p.roles, p.active_role, p.company_role
    from public.profiles p
    left join public.company_members m
      on m.user_id = p.id and m.company_id = p.company_id
    left join public.companies c on c.id = m.company_id
    where (
        p.company_id is not null
        or p.company_role is not null
        or p.active_role = 'company'::public.user_role
        or 'company'::public.user_role = any(coalesce(p.roles, '{}'::public.user_role[]))
      )
      and (
        m.user_id is null
        or p.company_role is distinct from m.role
        or not ('company'::public.user_role = any(coalesce(p.roles, '{}'::public.user_role[])))
        or (
          p.active_role = 'company'::public.user_role
          and (
            c.verification_status <> 'verified'::public.verification_status
            or exists (
              select 1 from public.account_suspensions s
              where s.subject_type = 'company' and s.subject_id = c.id
            )
          )
        )
      )
    order by p.id
    limit 20
  ) inconsistent_profiles;

  if v_rows is not null then
    raise exception 'Stage 2 blocked: company profile roles do not match a valid current membership'
      using detail = v_rows,
            hint = 'Reconcile profile company_id, company_role, roles, active_role, and company_members manually before rerunning.';
  end if;

  select string_agg(format('%s (profile company=%s, membership company=%s, profile role=%s, membership role=%s)',
                           user_id, profile_company_id, company_id, profile_company_role, role), '; ')
  into v_rows
  from (
    select m.user_id, m.company_id, m.role,
           p.company_id as profile_company_id,
           p.company_role as profile_company_role
    from public.company_members m
    join public.profiles p on p.id = m.user_id
    where p.company_id is distinct from m.company_id
       or p.company_role is distinct from m.role
       or not ('company'::public.user_role = any(coalesce(p.roles, '{}'::public.user_role[])))
    order by m.user_id
    limit 20
  ) mismatched_memberships;

  if v_rows is not null then
    raise exception 'Stage 2 blocked: membership rows and profile company fields disagree'
      using detail = v_rows,
            hint = 'Reconcile each company_members row with its profile manually; no profile or membership is rewritten by this migration.';
  end if;
end;
$$;

-- Enforce the invariant against concurrent operations and privileged inserts.
create unique index if not exists company_members_one_company_per_user
  on public.company_members(user_id);

-- Companies created after this migration must point to their approved
-- registration. Existing company rows remain unchanged with a NULL link.
alter table public.companies
  add column if not exists approval_registration_id uuid
  references public.company_registrations(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.companies'::regclass
      and c.conname = 'companies_approval_registration_id_fkey'
  ) then
    alter table public.companies
      add constraint companies_approval_registration_id_fkey
      foreign key (approval_registration_id)
      references public.company_registrations(id)
      on delete set null;
  end if;
end;
$$;

create unique index if not exists companies_approval_registration_id_key
  on public.companies(approval_registration_id)
  where approval_registration_id is not null;

-- Ordinary and service-role API clients cannot create companies or mutate
-- membership rows directly. Existing select access remains available.
revoke insert on table public.companies from public, anon, authenticated, service_role;
revoke insert, update, delete on table public.company_members
  from public, anon, authenticated, service_role;
grant select on table public.company_members to authenticated;

-- ------------------------------------------------------------
-- Company insert/status guard. New companies are created only from a
-- submitted registration by an active platform admin. A company cannot be
-- changed from a non-verified status to verified later through another RPC.
-- ------------------------------------------------------------

create or replace function public.guard_company_approval_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registration public.company_registrations;
begin
  if tg_op = 'INSERT' then
    if new.approval_registration_id is null
       or new.verification_status is distinct from 'verified'::public.verification_status
       or not public.is_active_platform_admin(auth.uid()) then
      raise exception 'Companies must be created by an authorised partnership approval'
        using errcode = '42501';
    end if;

    select * into v_registration
    from public.company_registrations r
    where r.id = new.approval_registration_id
      and r.status = 'docs_submitted'::public.company_reg_status
      and r.applicant_authorised is true
      and r.authorised_at is not null
      and r.cac_cert_path is not null
      and r.cac_sha256 is not null
    for update;

    if not found
       or new.name is distinct from v_registration.company_name
       or new.type is distinct from v_registration.company_type::public.company_type
       or new.contact_email is distinct from v_registration.contact_email then
      raise exception 'Company approval does not match a valid submitted registration'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if new.approval_registration_id is distinct from old.approval_registration_id
     and new.approval_registration_id is not null then
    raise exception 'A company approval registration link cannot be reassigned'
      using errcode = '42501';
  end if;

  if new.verification_status = 'verified'::public.verification_status
     and old.verification_status is distinct from 'verified'::public.verification_status then
    raise exception 'A company can become verified only when its partnership is approved'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_company_approval_integrity()
  from public, anon, authenticated, service_role;

drop trigger if exists companies_approval_integrity on public.companies;
create trigger companies_approval_integrity
before insert or update
on public.companies
for each row execute function public.guard_company_approval_integrity();

-- ------------------------------------------------------------
-- Membership guard. In addition to approval status, suspension and a
-- company-row lock are checked. The lock serializes membership creation with
-- status changes and company suspension.
-- ------------------------------------------------------------

create or replace function public.require_approved_company_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.verification_status;
  v_approval_registration_id uuid;
  v_has_members boolean;
begin
  select c.verification_status, c.approval_registration_id
  into v_status, v_approval_registration_id
  from public.companies c
  where c.id = new.company_id
  for share;

  if not found then
    raise exception 'Company not found' using errcode = '23503';
  end if;

  if v_status is distinct from 'verified'::public.verification_status
     or exists (
       select 1 from public.account_suspensions s
       where s.subject_type = 'company' and s.subject_id = new.company_id
     ) then
    raise exception 'Membership requires a verified, non-suspended company'
      using errcode = '42501';
  end if;

  select exists (
    select 1 from public.company_members m where m.company_id = new.company_id
  ) into v_has_members;

  if tg_op = 'INSERT' and not v_has_members then
    if v_approval_registration_id is null
       or new.role is distinct from 'admin'::public.company_member_role
       or new.permissions is distinct from '[]'::jsonb
       or not public.is_active_platform_admin(auth.uid())
       or not exists (
         select 1 from public.company_registrations r
         where r.id = v_approval_registration_id
           and r.user_id = new.user_id
           and r.status = 'docs_submitted'::public.company_reg_status
       ) then
      raise exception 'The initial company admin membership must be created by partnership approval'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.require_approved_company_membership()
  from public, anon, authenticated, service_role;

drop trigger if exists company_members_require_approval on public.company_members;
create trigger company_members_require_approval
before insert or update
on public.company_members
for each row execute function public.require_approved_company_membership();

-- Company suspension acquires a conflicting company-row lock before recording
-- the suspension, so an invitation cannot race past the suspension check.
create or replace function public.lock_company_suspension_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  if new.subject_type = 'company' then
    select c.id into v_company_id
    from public.companies c
    where c.id = new.subject_id
    for update;

    if not found then
      raise exception 'Company not found' using errcode = '23503';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.lock_company_suspension_target()
  from public, anon, authenticated, service_role;

drop trigger if exists account_suspensions_lock_company on public.account_suspensions;
create trigger account_suspensions_lock_company
before insert or update
on public.account_suspensions
for each row execute function public.lock_company_suspension_target();

create or replace function public.deactivate_roles_for_company_suspension()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.subject_type = 'company' then
    update public.profiles p
    set active_role = 'viewer'::public.user_role
    where p.company_id = new.subject_id
      and p.active_role = 'company'::public.user_role;
  end if;
  return new;
end;
$$;

revoke all on function public.deactivate_roles_for_company_suspension()
  from public, anon, authenticated, service_role;

drop trigger if exists account_suspensions_deactivate_company_roles on public.account_suspensions;
create trigger account_suspensions_deactivate_company_roles
after insert or update
on public.account_suspensions
for each row execute function public.deactivate_roles_for_company_suspension();

create or replace function public.deactivate_roles_for_company_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.verification_status is distinct from 'verified'::public.verification_status then
    update public.profiles p
    set active_role = 'viewer'::public.user_role
    where p.company_id = new.id
      and p.active_role = 'company'::public.user_role;
  end if;
  return new;
end;
$$;

revoke all on function public.deactivate_roles_for_company_status()
  from public, anon, authenticated, service_role;

drop trigger if exists companies_deactivate_company_roles on public.companies;
create trigger companies_deactivate_company_roles
after update of verification_status on public.companies
for each row execute function public.deactivate_roles_for_company_status();

-- ------------------------------------------------------------
-- Profile guard: clients cannot assign company membership fields or the
-- company role, and cannot select company as active_role without a valid
-- current verified, non-suspended membership.
-- ------------------------------------------------------------

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_added public.user_role[];
  v_valid_company_membership boolean;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  new.id := old.id;
  new.email := old.email;
  new.is_email_verified := old.is_email_verified;
  new.is_phone_verified := old.is_phone_verified;
  new.company_id := old.company_id;
  new.company_role := old.company_role;
  new.created_at := old.created_at;
  new.admin_status := old.admin_status;
  new.roles := coalesce(new.roles, old.roles);

  if not (old.roles <@ new.roles) then
    raise exception 'Roles cannot be removed';
  end if;

  select coalesce(array_agg(r), '{}')
  into v_added
  from unnest(new.roles) r
  where not (r = any(old.roles));

  if 'company'::public.user_role = any(v_added) then
    raise exception 'The company role is granted only through approved membership';
  end if;

  if not (new.active_role = any(new.roles)) then
    raise exception 'Active role % is not assigned to this user', new.active_role;
  end if;

  select exists (
    select 1
    from public.company_members m
    join public.companies c on c.id = m.company_id
    where m.user_id = old.id
      and m.company_id = old.company_id
      and m.role = old.company_role
      and c.verification_status = 'verified'::public.verification_status
      and not exists (
        select 1 from public.account_suspensions s
        where s.subject_type = 'company' and s.subject_id = c.id
      )
  ) into v_valid_company_membership;

  if new.active_role = 'company'::public.user_role
     and not v_valid_company_membership then
    raise exception 'Company active role requires a current verified, non-suspended membership'
      using errcode = '42501';
  end if;

  if old.active_role = 'company'::public.user_role
     and new.active_role <> 'company'::public.user_role
     and v_valid_company_membership then
    raise exception 'Leave the active company role through the authorised membership workflow';
  end if;

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

-- ------------------------------------------------------------
-- Sole company approval function. The registration and profile locks plus the
-- global unique index serialize concurrent approval/invitation attempts.
-- ------------------------------------------------------------

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
  if not public.is_active_platform_admin(auth.uid()) then
    raise exception 'Active platform admins only' using errcode = '42501';
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
     or v_profile.company_role is not null
     or 'company'::public.user_role = any(coalesce(v_profile.roles, '{}'::public.user_role[]))
     or exists (select 1 from public.company_members m where m.user_id = r.user_id) then
    raise exception 'Applicant already has company membership or a company role';
  end if;

  insert into public.companies (
    name, slug, type, contact_email, contact_phone, whatsapp_number, logo,
    onboarding_docs, verification_status, approval_registration_id
  ) values (
    r.company_name,
    lower(regexp_replace(r.company_name, '\s+', '-', 'g')) || '-' || left(r.id::text, 6),
    r.company_type::public.company_type,
    r.contact_email,
    r.contact_phone,
    r.whatsapp_number,
    r.logo_url,
    jsonb_build_object('cacCertificateUrl', r.cac_cert_path),
    'verified'::public.verification_status,
    r.id
  )
  returning id into v_company_id;

  insert into public.company_members (company_id, user_id, role, permissions)
  values (
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
  if not public.is_active_platform_admin(auth.uid()) then
    raise exception 'Active platform admins only' using errcode = '42501';
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

revoke all on function public.approve_company_registration(uuid)
  from public, anon, service_role;
revoke all on function public.reject_company_registration(uuid, text, text)
  from public, anon, service_role;
grant execute on function public.approve_company_registration(uuid) to authenticated;
grant execute on function public.reject_company_registration(uuid, text, text) to authenticated;

-- ------------------------------------------------------------
-- Invitation acceptance for verified, non-suspended companies only.
-- ------------------------------------------------------------

create or replace function public.accept_company_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_inv public.company_invitations;
  v_email text;
  v_confirmed timestamptz;
  v_company_status public.verification_status;
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

  select c.verification_status
  into v_company_status
  from public.companies c
  where c.id = v_inv.company_id
  for share;

  if not found
     or v_company_status is distinct from 'verified'::public.verification_status
     or exists (
       select 1 from public.account_suspensions s
       where s.subject_type = 'company' and s.subject_id = v_inv.company_id
     ) then
    raise exception 'Invitations require a verified, non-suspended company'
      using errcode = '42501';
  end if;

  select lower(u.email), u.email_confirmed_at
  into v_email, v_confirmed
  from auth.users u
  where u.id = v_caller;

  select p.company_id, p.roles
  into v_current, v_roles
  from public.profiles p
  where p.id = v_caller
  for update;

  if not found then raise exception 'User profile not found'; end if;
  if v_confirmed is null then raise exception 'Confirm your email address before accepting this invitation'; end if;
  if v_email is distinct from v_inv.email then
    raise exception 'This invitation was sent to a different email address'
      using detail = v_inv.email;
  end if;
  if 'agent'::public.user_role = any(coalesce(v_roles, '{}'::public.user_role[])) then
    raise exception 'Agent accounts cannot join a company team';
  end if;
  if v_current is not null
     or 'company'::public.user_role = any(coalesce(v_roles, '{}'::public.user_role[]))
     or exists (select 1 from public.company_members m where m.user_id = v_caller) then
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

revoke all on function public.accept_company_invitation(text)
  from public, anon, service_role;
grant execute on function public.accept_company_invitation(text) to authenticated;

-- Existing client role switching uses this RPC. Company selection is allowed
-- only for a current verified, non-suspended membership.
create or replace function public.switch_active_role(_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;

  select * into v_profile
  from public.profiles p
  where p.id = v_user_id
  for update;
  if not found then raise exception 'User profile not found'; end if;
  if not (_role = any(v_profile.roles)) then
    raise exception 'You do not have this role';
  end if;

  if _role = 'company'::public.user_role and not exists (
    select 1
    from public.company_members m
    join public.companies c on c.id = m.company_id
    where m.user_id = v_user_id
      and m.company_id = v_profile.company_id
      and m.role = v_profile.company_role
      and c.verification_status = 'verified'::public.verification_status
      and not exists (
        select 1 from public.account_suspensions s
        where s.subject_type = 'company' and s.subject_id = c.id
      )
  ) then
    raise exception 'Company role requires a current verified, non-suspended membership'
      using errcode = '42501';
  end if;

  if v_profile.active_role = 'company'::public.user_role
     and _role <> 'company'::public.user_role
     and exists (
       select 1
       from public.company_members m
       join public.companies c on c.id = m.company_id
       where m.user_id = v_user_id
         and m.company_id = v_profile.company_id
         and m.role = v_profile.company_role
         and c.verification_status = 'verified'::public.verification_status
         and not exists (
           select 1 from public.account_suspensions s
           where s.subject_type = 'company' and s.subject_id = c.id
         )
     ) then
    raise exception 'Leave the company role through the authorised membership workflow';
  end if;

  update public.profiles p
  set active_role = _role
  where p.id = v_user_id;
end;
$$;

revoke all on function public.switch_active_role(public.user_role)
  from public, anon, service_role;
grant execute on function public.switch_active_role(public.user_role) to authenticated;

-- ------------------------------------------------------------
-- Authorised membership-management RPCs. Direct table UPDATE/DELETE has been
-- revoked above; company administrators use these complete RPCs instead.
-- ------------------------------------------------------------

create or replace function public.update_company_member(
  p_company_id uuid,
  p_user_id uuid,
  p_role public.company_member_role,
  p_permissions jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_company public.companies;
  v_target_role public.company_member_role;
  v_admin_count integer;
begin
  if v_caller is null then raise exception 'Sign in to manage members' using errcode = '42501'; end if;
  if v_caller = p_user_id then raise exception 'You cannot change your own membership role'; end if;
  if p_role is null or jsonb_typeof(p_permissions) is distinct from 'array' then
    raise exception 'A valid role and permissions array are required';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(p_permissions) p(value)
    where p.value not in ('manage_listings', 'manage_members', 'view_analytics')
  ) then
    raise exception 'Invalid company permission';
  end if;
  if p_role = 'admin'::public.company_member_role and p_permissions <> '[]'::jsonb then
    raise exception 'Admin permissions are implicit and must be empty';
  end if;

  select * into v_company
  from public.companies c
  where c.id = p_company_id
  for update;

  if not found
     or v_company.verification_status is distinct from 'verified'::public.verification_status
     or exists (
       select 1 from public.account_suspensions s
       where s.subject_type = 'company' and s.subject_id = p_company_id
     ) then
    raise exception 'Membership management requires a verified, non-suspended company'
      using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.company_members m
    where m.company_id = p_company_id
      and m.user_id = v_caller
      and m.role = 'admin'::public.company_member_role
  ) then
    raise exception 'Only company admins can change membership roles or permissions'
      using errcode = '42501';
  end if;

  select m.role into v_target_role
  from public.company_members m
  where m.company_id = p_company_id and m.user_id = p_user_id
  for update;
  if not found then raise exception 'Member not found'; end if;

  if v_target_role = 'admin'::public.company_member_role
     and p_role <> 'admin'::public.company_member_role then
    select count(*) into v_admin_count
    from public.company_members m
    where m.company_id = p_company_id
      and m.role = 'admin'::public.company_member_role;
    if v_admin_count <= 1 then raise exception 'A company must keep at least one admin'; end if;
  end if;

  update public.company_members
  set role = p_role,
      permissions = case when p_role = 'admin'::public.company_member_role then '[]'::jsonb else p_permissions end
  where company_id = p_company_id and user_id = p_user_id;
end;
$$;

create or replace function public.remove_company_member(p_company_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := auth.uid();
  v_target_role public.company_member_role;
  v_admin_count integer;
begin
  if v_caller is null then raise exception 'Sign in to manage the team' using errcode = '42501'; end if;
  if v_caller = p_user_id then raise exception 'You cannot remove yourself from the team'; end if;

  perform 1 from public.companies c where c.id = p_company_id for update;
  if not found then raise exception 'Company not found'; end if;
  if not public.has_company_permission(p_company_id, 'manage_members') then
    raise exception 'You do not have permission to remove members' using errcode = '42501';
  end if;

  select m.role into v_target_role
  from public.company_members m
  where m.company_id = p_company_id and m.user_id = p_user_id
  for update;
  if not found then raise exception 'Member not found'; end if;

  if v_target_role = 'admin'::public.company_member_role then
    if not exists (
      select 1 from public.company_members m
      where m.company_id = p_company_id
        and m.user_id = v_caller
        and m.role = 'admin'::public.company_member_role
    ) then
      raise exception 'Only company admins can remove other admins' using errcode = '42501';
    end if;
    select count(*) into v_admin_count
    from public.company_members m
    where m.company_id = p_company_id
      and m.role = 'admin'::public.company_member_role;
    if v_admin_count <= 1 then raise exception 'A company must keep at least one admin'; end if;
  end if;

  delete from public.company_members
  where company_id = p_company_id and user_id = p_user_id;

  update public.profiles p
  set company_id = null,
      company_role = null,
      roles = array(
        select distinct role_value
        from unnest(
          array_remove(coalesce(p.roles, '{}'::public.user_role[]), 'company'::public.user_role)
          || array['viewer'::public.user_role]
        ) as role_value
      ),
      active_role = case
        when p.active_role = 'company'::public.user_role then 'viewer'::public.user_role
        else p.active_role
      end
  where p.id = p_user_id;
end;
$$;

revoke all on function public.update_company_member(uuid, uuid, public.company_member_role, jsonb)
  from public, anon, service_role;
revoke all on function public.remove_company_member(uuid, uuid)
  from public, anon, service_role;
grant execute on function public.update_company_member(uuid, uuid, public.company_member_role, jsonb)
  to authenticated;
grant execute on function public.remove_company_member(uuid, uuid)
  to authenticated;

-- ------------------------------------------------------------
-- Company-only verification through the generic verification API is closed.
-- The queue now returns agents only; the separate Partnership Requests page
-- continues to call approve/reject_company_registration.
-- ------------------------------------------------------------

create or replace function public.admin_verification_queue(
  _status public.verification_status default 'pending'
)
returns table (
  subject_type text,
  subject_id uuid,
  name text,
  email text,
  phone text,
  detail text,
  logo text,
  documents jsonb,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_active_platform_admin(auth.uid()) then
    raise exception 'Active platform admins only' using errcode = '42501';
  end if;

  return query
  select 'agent'::text, p.id, p.name, p.email, p.phone,
         coalesce(p.agent_profile ->> 'subRole', 'agent'),
         coalesce(p.agent_profile ->> 'logo', p.avatar),
         coalesce(p.agent_profile -> 'verificationDocs', '{}'::jsonb),
         coalesce(p.agent_profile ->> 'verificationStatus', 'unverified'),
         p.created_at
  from public.profiles p
  where 'agent'::public.user_role = any(p.roles)
    and coalesce(p.agent_profile ->> 'verificationStatus', 'unverified') = _status::text
  order by p.created_at;
end;
$$;

create or replace function public.admin_set_verification(
  _subject_type text,
  _subject_id uuid,
  _decision text,
  _reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.verification_status;
begin
  if not public.is_active_platform_admin(auth.uid()) then
    raise exception 'Active platform admins only' using errcode = '42501';
  end if;
  perform public.check_decision(_decision, _reason);
  if _decision is null or _decision not in ('approve', 'reject', 'more_info') then
    raise exception 'Invalid decision';
  end if;

  if _subject_type = 'company' then
    raise exception 'Company approvals and rejections must use Partnership Requests'
      using errcode = '42501';
  elsif _subject_type = 'agent' then
    v_status := case _decision
      when 'approve' then 'verified'::public.verification_status
      when 'reject' then 'rejected'::public.verification_status
      else 'unverified'::public.verification_status
    end;

    if _decision = 'approve' and not exists (
      select 1 from public.identity_documents d
      where d.user_id = _subject_id and d.status = 'approved'
    ) then
      raise exception 'Approve the agent''s government ID first';
    end if;

    update public.profiles
    set agent_profile = coalesce(agent_profile, '{}'::jsonb)
      || jsonb_build_object('verificationStatus', v_status::text)
    where id = _subject_id and 'agent'::public.user_role = any(roles);
  else
    raise exception 'Invalid subject type';
  end if;

  if not found then raise exception 'Not found'; end if;

  insert into public.verification_reviews(subject_type, subject_id, status, decision, note, reviewed_by)
  values (_subject_type, _subject_id, v_status, _decision, btrim(_reason), auth.uid());

  perform public.log_admin_action(
    'verification.' || _decision, _subject_type, _subject_id, _reason
  );
end;
$$;

revoke all on function public.admin_verification_queue(public.verification_status)
  from public, anon, service_role;
revoke all on function public.admin_set_verification(text, uuid, text, text)
  from public, anon, service_role;
grant execute on function public.admin_verification_queue(public.verification_status)
  to authenticated;
grant execute on function public.admin_set_verification(text, uuid, text, text)
  to authenticated;

-- ------------------------------------------------------------
-- Remove the service-role and legacy execute paths explicitly. These named
-- RPCs are only callable by authenticated sessions and validate authority.
-- ------------------------------------------------------------

revoke all on function public.create_company_for_current_user(
  text, text, public.company_type, text, text, text, text
) from public, anon, authenticated, service_role;
revoke all on function public.submit_company_registration(text, text, boolean, text)
  from public, anon, service_role;
revoke all on function public.save_company_registration_draft(text, text, text, text, text, text, text, text)
  from public, anon, service_role;
revoke all on function public.create_company_invitation(uuid, text, text, text[])
  from service_role;

