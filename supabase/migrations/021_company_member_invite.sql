-- Invitations
create table if not exists public.company_invitations (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  email        text not null check (email = lower(email)),
  role         text not null check (role in ('admin', 'member')),
  permissions  jsonb not null default '[]'::jsonb,
  token_hash   text not null,
  invited_by   uuid not null references public.profiles(id),
  expires_at   timestamptz not null default now() + interval '7 days',
  accepted_at  timestamptz,
  accepted_by  uuid references public.profiles(id),
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create unique index if not exists company_invitations_one_pending
  on public.company_invitations (company_id, email)
  where accepted_at is null and revoked_at is null;

alter table public.company_invitations enable row level security;

create policy "members read their company's invitations"
  on public.company_invitations for select
  using (exists (
    select 1 from public.company_members m
     where m.company_id = company_invitations.company_id
       and m.user_id = auth.uid()
  ));
-- No insert, update or delete policies: all changes go through the functions below.

-- Effective permissions for a member. Admins hold everything.
create or replace function public.company_permissions(p_company_id uuid, p_user_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select case
           when m.role = 'admin' then '["manage_listings","manage_members","view_analytics"]'::jsonb
           else m.permissions
         end
    from public.company_members m
   where m.company_id = p_company_id and m.user_id = p_user_id;
$$;

revoke all on function public.company_permissions(uuid, uuid) from public;

-- Create or refresh an invitation. Returns the raw token once, for the email.
create or replace function public.create_company_invitation(
  p_company_id  uuid,
  p_email       text,
  p_role        text,
  p_permissions text[]
) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_caller   uuid := auth.uid();
  v_perms    jsonb;
  v_grant    jsonb;
  v_email    text := lower(trim(p_email));
  v_token    text := encode(extensions.gen_random_bytes(32), 'hex');
  v_is_admin boolean;
begin
  if v_caller is null then
    raise exception 'Sign in to invite members';
  end if;

  v_perms := public.company_permissions(p_company_id, v_caller);
  if v_perms is null or not (v_perms ? 'manage_members') then
    raise exception 'You do not have permission to invite members';
  end if;

  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Enter a valid email address';
  end if;

  v_is_admin := exists (
    select 1 from public.company_members
     where company_id = p_company_id and user_id = v_caller and role = 'admin'
  );

  if p_role = 'admin' then
    if not v_is_admin then
      raise exception 'Only company admins can invite other admins';
    end if;
    v_grant := '["manage_listings","manage_members","view_analytics"]'::jsonb;
  elsif p_role = 'member' then
    v_grant := to_jsonb(coalesce(p_permissions, '{}'::text[]));
    if jsonb_array_length(v_grant) = 0 then
      raise exception 'Choose at least one permission';
    end if;
    -- A member can hand on only the permissions they hold.
    if exists (
      select 1 from jsonb_array_elements_text(v_grant) g
       where not (v_perms ? g)
    ) then
      raise exception 'You can only grant permissions you have';
    end if;
  else
    raise exception 'Invalid role';
  end if;

  if exists (
    select 1 from public.company_members m
      join public.profiles p on p.id = m.user_id
     where m.company_id = p_company_id and lower(p.email) = v_email
  ) then
    raise exception 'This person is already on the team';
  end if;

  insert into public.company_invitations
    (company_id, email, role, permissions, token_hash, invited_by, expires_at)
  values
    (p_company_id, v_email, p_role, v_grant,
     encode(extensions.digest(v_token, 'sha256'), 'hex'),
     v_caller, now() + interval '7 days')
  on conflict (company_id, email)
    where accepted_at is null and revoked_at is null
  do update set
    role        = excluded.role,
    permissions = excluded.permissions,
    token_hash  = excluded.token_hash,
    invited_by  = excluded.invited_by,
    expires_at  = excluded.expires_at,
    created_at  = now();

  return v_token;
end $$;

-- Accept an invitation as the signed-in user.
create or replace function public.accept_company_invitation(p_token text)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_caller    uuid := auth.uid();
  v_inv       public.company_invitations;
  v_email     text;
  v_confirmed timestamptz;
  v_current   uuid;
begin
  if v_caller is null then
    raise exception 'Sign in to accept this invitation';
  end if;

  select * into v_inv
    from public.company_invitations
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
   for update;

  if not found then
    raise exception 'This invitation link is not valid';
  end if;
  if v_inv.revoked_at is not null then
    raise exception 'This invitation was cancelled';
  end if;
  if v_inv.accepted_at is not null then
    raise exception 'This invitation has already been used';
  end if;
  if v_inv.expires_at <= now() then
    raise exception 'This invitation has expired. Ask for a new one.';
  end if;

  select lower(email), email_confirmed_at into v_email, v_confirmed
    from auth.users where id = v_caller;

  if v_confirmed is null then
    raise exception 'Confirm your email address before accepting this invitation';
  end if;
  if v_email is distinct from v_inv.email then
    raise exception 'This invitation was sent to a different email address. Sign in with that account.';
  end if;

  if exists (select 1 from public.profiles where id = v_caller and agent_profile is not null) then
    raise exception 'Agent accounts cannot join a company team. Use a different account.';
  end if;

  select company_id into v_current from public.profiles where id = v_caller;
  if v_current is not null then
    raise exception 'Your account already belongs to a company';
  end if;

  insert into public.company_members (company_id, user_id, role, permissions)
  values (v_inv.company_id, v_caller, v_inv.role, v_inv.permissions);

  update public.profiles p
     set company_id   = v_inv.company_id,
         company_role = v_inv.role,
         roles        = (select array_agg(distinct x) from unnest(p.roles || 'company'::user_role) x),
         active_role  = 'company'
   where p.id = v_caller;

  update public.company_invitations
     set accepted_at = now(), accepted_by = v_caller
   where id = v_inv.id;

  return v_inv.company_id;
end $$;

-- Cancel a pending invitation.
create or replace function public.revoke_company_invitation(p_invitation_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid;
begin
  select company_id into v_company
    from public.company_invitations
   where id = p_invitation_id and accepted_at is null and revoked_at is null;

  if not found then
    raise exception 'This invitation is no longer pending';
  end if;

  if not (coalesce(public.company_permissions(v_company, auth.uid()), '[]'::jsonb) ? 'manage_members') then
    raise exception 'You do not have permission to cancel invitations';
  end if;

  update public.company_invitations set revoked_at = now() where id = p_invitation_id;
end $$;

-- Remove a team member. Keeps at least one admin, and only admins remove admins.
create or replace function public.remove_company_member(p_company_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_caller          uuid := auth.uid();
  v_perms           jsonb;
  v_target          text;
  v_caller_is_admin boolean;
  v_admins          int;
begin
  if v_caller is null then
    raise exception 'Sign in to manage the team';
  end if;
  if v_caller = p_user_id then
    raise exception 'You cannot remove yourself from the team';
  end if;

  v_perms := coalesce(public.company_permissions(p_company_id, v_caller), '[]'::jsonb);
  if not (v_perms ? 'manage_members') then
    raise exception 'You do not have permission to remove members';
  end if;

  select role into v_target
    from public.company_members
   where company_id = p_company_id and user_id = p_user_id;

  if not found then
    raise exception 'Member not found';
  end if;

  v_caller_is_admin := exists (
    select 1 from public.company_members
     where company_id = p_company_id and user_id = v_caller and role = 'admin'
  );

  if v_target = 'admin' then
    if not v_caller_is_admin then
      raise exception 'Only company admins can remove other admins';
    end if;
    select count(*) into v_admins
      from public.company_members
     where company_id = p_company_id and role = 'admin';
    if v_admins <= 1 then
      raise exception 'A company must keep at least one admin';
    end if;
  end if;

  delete from public.company_members
   where company_id = p_company_id and user_id = p_user_id;

  update public.profiles p
     set company_id   = null,
         company_role = null,
         roles        = (select array_agg(distinct x)
                           from unnest(array_remove(p.roles, 'company'::user_role) || 'viewer'::user_role) x),
         active_role  = case when p.active_role = 'company' then 'viewer' else p.active_role end
   where p.id = p_user_id;
end $$;

revoke all on function public.create_company_invitation(uuid, text, text, text[]) from public;
revoke all on function public.accept_company_invitation(text) from public;
revoke all on function public.revoke_company_invitation(uuid) from public;
revoke all on function public.remove_company_member(uuid, uuid) from public;

grant execute on function public.create_company_invitation(uuid, text, text, text[]) to authenticated;
grant execute on function public.accept_company_invitation(text) to authenticated;
grant execute on function public.revoke_company_invitation(uuid) to authenticated;
grant execute on function public.remove_company_member(uuid, uuid) to authenticated;