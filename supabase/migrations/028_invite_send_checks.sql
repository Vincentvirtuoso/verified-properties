-- ============================================================
-- 026 INVITE SEND CHECKS
-- Run after 025_invite_error_hints.sql.
--
-- Checks the invitee's account when an invitation is sent, so ineligible
-- people are refused at send time rather than when they click the link.
-- accept_company_invitation (025) still runs the same checks, because the
-- invitee may not have an account yet when the invitation is sent.
--
-- Pending-application check: only applications SUBMITTED for review
-- (status 'docs_submitted') block an invite. Every account gets an
-- automatic draft at signup, so a draft must not block anyone.
-- ============================================================

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
  v_target_id uuid;
  v_target_roles public.user_role[];
  v_target_company uuid;
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

  -- Invitee account checks. If no account exists for this email yet,
  -- these are skipped and accept_company_invitation checks at acceptance.
  select p.id, p.roles, p.company_id
  into v_target_id, v_target_roles, v_target_company
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = v_email;

  if v_target_id is not null then
    if 'agent'::public.user_role = any(coalesce(v_target_roles, '{}'::public.user_role[])) then
      raise exception 'Agent accounts cannot join a company team'
        using errcode = '42501', hint = 'agent';
    end if;

    if v_target_company is not null
       or 'company'::public.user_role = any(coalesce(v_target_roles, '{}'::public.user_role[]))
       or exists (
         select 1 from public.company_members m where m.user_id = v_target_id
       ) then
      raise exception 'That person already belongs to a company'
        using errcode = '42501', hint = 'already_in_company';
    end if;

    -- Blocks only applications submitted for review. Remove this block
    -- if the team decides a submitted application should not stop an invite.
    if exists (
      select 1 from public.company_registrations r
      where r.user_id = v_target_id
        and r.status = 'docs_submitted'::public.company_reg_status
    ) then
      raise exception 'That person has a partnership application under review'
        using errcode = '42501', hint = 'pending_application';
    end if;
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
