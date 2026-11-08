create or replace function public.guard_company_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_role text;
begin
  if new.name is distinct from old.name then
    raise exception 'The registered company name cannot be changed';
  end if;
  if new.slug is distinct from old.slug then
    raise exception 'The company URL slug cannot be changed';
  end if;

  -- Internal writes (no user session) are not restricted further.
  if auth.uid() is null then
    return new;
  end if;

  if public.has_role(auth.uid(), 'admin')
     or public.has_role(auth.uid(), 'super_admin') then
    return new;
  end if;

  select m.role into v_member_role
    from public.company_members m
   where m.company_id = old.id and m.user_id = auth.uid();

  if v_member_role is null then
    raise exception 'Not a member of this company';
  end if;

  -- Platform-only columns.
  if new.verification_status is distinct from old.verification_status then
    raise exception 'This field can only be changed by platform staff';
  end if;
  if new.onboarding_docs is distinct from old.onboarding_docs then
    raise exception 'This field can only be changed by platform staff';
  end if;
  if new.total_remitted is distinct from old.total_remitted then
    raise exception 'This field can only be changed by platform staff';
  end if;
  if new.active_listings is distinct from old.active_listings then
    raise exception 'This field can only be changed by platform staff';
  end if;

  -- features is platform-only except features.whatsappNotifications, which a
  -- company admin may toggle (the RPC already checks admin + Pro + number).
  if new.features is distinct from old.features then
    if not (
      v_member_role = 'admin'
      and (coalesce(new.features, '{}'::jsonb) - 'whatsappNotifications')
          is not distinct from
          (coalesce(old.features, '{}'::jsonb) - 'whatsappNotifications')
    ) then
      raise exception 'This field can only be changed by platform staff';
    end if;
  end if;

  if new.remittance_details is distinct from old.remittance_details
     and v_member_role <> 'admin' then
    raise exception 'Only company admins can change remittance details';
  end if;

  return new;
end;
$$;