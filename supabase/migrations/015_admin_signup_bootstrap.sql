
create or replace function public.promote_admin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _requested text;
  _reason text;
  _super_exists boolean;
begin
  -- Read the signup metadata that Supabase stored on auth.users.
  select
    u.raw_user_meta_data ->> 'requested_role',
    u.raw_user_meta_data ->> 'admin_reason'
  into _requested, _reason
  from auth.users u
  where u.id = new.id;

  -- Not an admin signup: nothing to do.
  if _requested <> 'admin' then
    return new;
  end if;

  -- Serialize concurrent signups.
  perform pg_advisory_xact_lock(hashtext('admin_bootstrap'));

  select exists (
    select 1 from public.user_roles where role = 'super_admin'
  ) into _super_exists;

  if not _super_exists then
    insert into public.user_roles(user_id, role)
    values (new.id, 'super_admin')
    on conflict (user_id, role) do nothing;

    update public.profiles
    set admin_status = 'active',
        metadata = coalesce(metadata, '{}'::jsonb)
          || jsonb_build_object(
               'adminReason', coalesce(_reason, ''),
               'bootstrapped', true
             )
    where id = new.id;
  else
    update public.profiles
    set admin_status = 'pending',
        metadata = coalesce(metadata, '{}'::jsonb)
          || jsonb_build_object('adminReason', coalesce(_reason, ''))
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_profile_admin_signup on public.profiles;
create trigger on_profile_admin_signup
after insert on public.profiles
for each row execute function public.promote_admin_on_signup();