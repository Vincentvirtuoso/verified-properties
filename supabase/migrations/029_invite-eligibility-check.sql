-- ============================================================
-- 027 INVITE ELIGIBILITY CHECK
-- Run after 026_invite_send_checks.sql.
--
-- Advisory check the invite form runs when the email field loses focus.
-- It applies the same rules as create_company_invitation (026) and returns
-- only a reason code. create_company_invitation remains the authority.
--
-- Privacy: this lets a member with manage_members learn an account's
-- eligibility without sending an invitation. Rate limiting is recommended
-- before release (see the note in the reply).
-- ============================================================

create or replace function public.check_company_invite_eligibility(
  p_company_id uuid,
  p_email text
)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_email text := lower(trim(p_email));
  v_target_id uuid;
  v_target_roles public.user_role[];
  v_target_company uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to check invitations' using errcode = '42501';
  end if;

  if not public.has_company_permission(p_company_id, 'manage_members') then
    raise exception 'You do not have permission to invite members' using errcode = '42501';
  end if;

  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    return 'invalid_email';
  end if;

  if exists (
    select 1
    from public.company_members m
    join public.profiles p on p.id = m.user_id
    where m.company_id = p_company_id and lower(p.email) = v_email
  ) then
    return 'already_on_team';
  end if;

  select p.id, p.roles, p.company_id
  into v_target_id, v_target_roles, v_target_company
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = v_email;

  -- No account yet: nothing to block, so the invite can go out.
  if v_target_id is null then
    return 'no_account';
  end if;

  if 'agent'::public.user_role = any(coalesce(v_target_roles, '{}'::public.user_role[])) then
    return 'agent';
  end if;

  if v_target_company is not null
     or 'company'::public.user_role = any(coalesce(v_target_roles, '{}'::public.user_role[]))
     or exists (
       select 1 from public.company_members m where m.user_id = v_target_id
     ) then
    return 'already_in_company';
  end if;

  if exists (
    select 1 from public.company_registrations r
    where r.user_id = v_target_id
      and r.status = 'docs_submitted'::public.company_reg_status
  ) then
    return 'pending_application';
  end if;

  return 'ok';
end;
$$;

revoke all on function public.check_company_invite_eligibility(uuid, text) from public, anon;
grant execute on function public.check_company_invite_eligibility(uuid, text) to authenticated;