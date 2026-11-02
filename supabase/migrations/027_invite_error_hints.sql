-- ============================================================
-- 025 INVITE ERROR HINTS
-- Run after 024_company_registration_integrity.sql.
--
-- Adds a HINT to each accept_company_invitation failure so the client
-- (toInviteError in @affilhomes/shared/supabase) can map it to a specific
-- InviteError code. Behaviour is otherwise unchanged from 022.
-- ============================================================

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
    raise exception 'Sign in to accept this invitation'
      using errcode = '42501', hint = 'signed_out';
  end if;

  select * into v_inv
  from public.company_invitations
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  for update;

  if not found then
    raise exception 'This invitation link is not valid'
      using hint = 'not_found';
  end if;
  if v_inv.revoked_at is not null then
    raise exception 'This invitation was cancelled'
      using hint = 'revoked';
  end if;
  if v_inv.accepted_at is not null then
    raise exception 'This invitation has already been used'
      using hint = 'used';
  end if;
  if v_inv.expires_at <= now() then
    raise exception 'This invitation has expired'
      using hint = 'expired';
  end if;

  if not exists (
    select 1 from public.companies c
    where c.id = v_inv.company_id
      and c.verification_status = 'verified'::public.verification_status
  ) then
    -- No hint: client shows the generic message for this case.
    raise exception 'Partnership approval is required before joining this company'
      using errcode = '42501';
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
    raise exception 'Confirm your email address before accepting this invitation'
      using hint = 'unconfirmed';
  end if;
  if v_email is distinct from v_inv.email then
    raise exception 'This invitation was sent to a different email address'
      using hint = 'wrong_email', detail = v_inv.email;
  end if;
  if 'agent'::public.user_role = any(coalesce(v_roles, '{}'::public.user_role[])) then
    raise exception 'Agent accounts cannot join a company team'
      using errcode = '42501', hint = 'agent';
  end if;
  if v_current is not null
     or 'company'::public.user_role = any(coalesce(v_roles, '{}'::public.user_role[])) then
    raise exception 'Your account already belongs to a company'
      using errcode = '42501', hint = 'already_in_company';
  end if;
  if exists (
    select 1 from public.company_members m where m.user_id = v_caller
  ) then
    raise exception 'Your account already belongs to a company'
      using errcode = '42501', hint = 'already_in_company';
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

-- Privileges set in 022 are preserved by CREATE OR REPLACE.