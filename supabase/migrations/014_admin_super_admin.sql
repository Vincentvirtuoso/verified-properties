

update public.profiles p
set admin_status = 'active'
where p.admin_status is null
  and exists (
    select 1 from public.user_roles ur
    where ur.user_id = p.id
      and ur.role in ('admin', 'super_admin')
  );

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
  and (
    _role not in ('admin', 'super_admin')
    or exists (
      select 1 from public.profiles p
      where p.id = _user_id
        and coalesce(p.admin_status, 'active') = 'active'
    )
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin')
      or public.has_role(auth.uid(), 'super_admin');
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'super_admin');
$$;

create or replace function public.require_super_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Super admins only' using errcode = '42501';
  end if;
end;
$$;


create or replace function public.approve_admin(_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_super_admin();
  if _target_id = auth.uid() then
    raise exception 'You cannot change your own admin status';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = _target_id and admin_status = 'pending'
  ) then
    raise exception 'No pending admin application for this user';
  end if;

  update public.profiles set admin_status = 'active' where id = _target_id;

  insert into public.user_roles(user_id, role)
  values (_target_id, 'admin')
  on conflict (user_id, role) do nothing;

  perform public.log_admin_action(
    'admin.approved', 'admin', _target_id, null, '{}'::jsonb
  );
end;
$$;

create or replace function public.reject_admin(_target_id uuid, _reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_super_admin();
  if _target_id = auth.uid() then
    raise exception 'You cannot change your own admin status';
  end if;
  if coalesce(btrim(_reason), '') = '' then
    raise exception 'A reason is required';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = _target_id and admin_status = 'pending'
  ) then
    raise exception 'No pending admin application for this user';
  end if;

  update public.profiles
  set admin_status = 'rejected',
      metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object('adminRejectReason', btrim(_reason))
  where id = _target_id;

  delete from public.user_roles
  where user_id = _target_id and role in ('admin', 'super_admin');

  perform public.log_admin_action(
    'admin.rejected', 'admin', _target_id, _reason, '{}'::jsonb
  );
end;
$$;

create or replace function public.suspend_admin(_target_id uuid, _reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_super_admin();
  if _target_id = auth.uid() then
    raise exception 'You cannot change your own admin status';
  end if;
  if coalesce(btrim(_reason), '') = '' then
    raise exception 'A reason is required';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = _target_id and admin_status = 'active'
  ) then
    raise exception 'This admin is not active';
  end if;

  update public.profiles set admin_status = 'suspended' where id = _target_id;

  perform public.log_admin_action(
    'admin.suspended', 'admin', _target_id, _reason, '{}'::jsonb
  );
end;
$$;

create or replace function public.reinstate_admin(_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_super_admin();
  if _target_id = auth.uid() then
    raise exception 'You cannot change your own admin status';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = _target_id and admin_status = 'suspended'
  ) then
    raise exception 'This admin is not suspended';
  end if;

  update public.profiles set admin_status = 'active' where id = _target_id;

  perform public.log_admin_action(
    'admin.reinstated', 'admin', _target_id, null, '{}'::jsonb
  );
end;
$$;

create or replace function public.demote_admin(_target_id uuid, _reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_super_admin();
  if _target_id = auth.uid() then
    raise exception 'You cannot change your own admin status';
  end if;
  if coalesce(btrim(_reason), '') = '' then
    raise exception 'A reason is required';
  end if;

  delete from public.user_roles
  where user_id = _target_id and role in ('admin', 'super_admin');
  if not found then
    raise exception 'This user is not an admin';
  end if;

  update public.profiles set admin_status = null where id = _target_id;

  perform public.log_admin_action(
    'admin.demoted', 'admin', _target_id, _reason, '{}'::jsonb
  );
end;
$$;

create or replace function public.promote_super_admin(_target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_super_admin();
  if _target_id = auth.uid() then
    raise exception 'You cannot change your own admin status';
  end if;

  update public.user_roles set role = 'super_admin'
  where user_id = _target_id and role = 'admin';
  if not found then
    raise exception 'This user is not a regular admin';
  end if;

  perform public.log_admin_action(
    'admin.promoted_super', 'admin', _target_id, null, '{}'::jsonb
  );
end;
$$;

create or replace function public.demote_super_admin(_target_id uuid, _reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_super_admin();
  if _target_id = auth.uid() then
    raise exception 'You cannot change your own admin status';
  end if;
  if coalesce(btrim(_reason), '') = '' then
    raise exception 'A reason is required';
  end if;

  update public.user_roles set role = 'admin'
  where user_id = _target_id and role = 'super_admin';
  if not found then
    raise exception 'This user is not a super admin';
  end if;

  perform public.log_admin_action(
    'admin.demoted_super', 'admin', _target_id, _reason, '{}'::jsonb
  );
end;
$$;

create or replace function public.admin_list_admins(_status text default null)
returns table (
  user_id uuid,
  email text,
  name text,
  status text,
  role public.app_role,
  reason text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_super_admin();
  return query
  select
    p.id,
    p.email,
    p.name,
    coalesce(p.admin_status, 'none'),
    ur.role,
    nullif(p.metadata ->> 'adminReason', ''),
    p.created_at,
    p.updated_at
  from public.profiles p
  left join public.user_roles ur
    on ur.user_id = p.id and ur.role in ('admin', 'super_admin')
  where
    _status is null
    or (_status = 'none' and p.admin_status is null and ur.role is null)
    or p.admin_status = _status
  order by
    case coalesce(p.admin_status, 'none')
      when 'pending' then 0
      when 'active' then 1
      when 'suspended' then 2
      when 'rejected' then 3
      else 4
    end,
    p.updated_at desc;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.is_admin()',
    'public.is_super_admin()',
    'public.require_super_admin()',
    'public.approve_admin(uuid)',
    'public.reject_admin(uuid, text)',
    'public.suspend_admin(uuid, text)',
    'public.reinstate_admin(uuid)',
    'public.demote_admin(uuid, text)',
    'public.promote_super_admin(uuid)',
    'public.demote_super_admin(uuid, text)',
    'public.admin_list_admins(text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;