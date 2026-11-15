create or replace function public.can_manage_ai_billing(p_owner_type text, p_owner_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if p_owner_type = 'agent' then
    return p_owner_id = auth.uid();
  end if;

  return exists (
    select 1 from public.companies c
    where c.id = p_owner_id and c.owner_id = auth.uid()
  ) or exists (
    select 1 from public.company_members m
    where m.company_id = p_owner_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
      and m.permissions @> array['manage_billing']::text[]
  );
end;
$$;

-- Request: same as before, plus the billing check.
create or replace function public.request_ai_call_number(
  p_owner_type text,
  p_owner_id   uuid,
  p_e164       text,
  p_carrier    text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tier text;
  v_cap  int;
  v_used int;
  v_id   uuid;
begin
  if not public.can_manage_ai_billing(p_owner_type, p_owner_id) then
    raise exception 'not_authorised';
  end if;

  if not public.ai_subscription_is_live(p_owner_type, p_owner_id) then
    raise exception 'no_active_ai_subscription';
  end if;

  select tier into v_tier
  from public.ai_subscriptions
  where owner_type = p_owner_type and owner_id = p_owner_id;

  v_cap := public.ai_number_cap(v_tier);

  perform pg_advisory_xact_lock(hashtextextended(p_owner_type || ':' || p_owner_id::text, 0));

  select count(*) into v_used
  from public.ai_call_numbers
  where owner_type = p_owner_type
    and owner_id = p_owner_id
    and status in ('pending', 'active');

  if v_used >= v_cap then
    raise exception 'number_cap_reached';
  end if;

  insert into public.ai_call_numbers (owner_type, owner_id, e164, carrier, status, is_default)
  values (p_owner_type, p_owner_id, p_e164, p_carrier, 'pending', v_used = 0)
  returning id into v_id;

  return v_id;
end;
$$;

-- Release: owner or manage_billing holder for the company, or a platform admin.
create or replace function public.release_ai_call_number(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_type text;
  v_owner_id   uuid;
begin
  select owner_type, owner_id into v_owner_type, v_owner_id
  from public.ai_call_numbers where id = p_id;

  if v_owner_id is null then
    raise exception 'not_found';
  end if;

  if not (
    public.can_manage_ai_billing(v_owner_type, v_owner_id)
    or public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'super_admin')
  ) then
    raise exception 'not_authorised';
  end if;

  update public.ai_call_numbers
  set status = 'released', released_at = now(), is_default = false
  where id = p_id and status in ('pending', 'active');
end;
$$;

revoke execute on function public.can_manage_ai_billing(text, uuid) from public, anon;
revoke execute on function public.request_ai_call_number(text, uuid, text, text) from public, anon;
revoke execute on function public.release_ai_call_number(uuid) from public, anon;

create or replace function public.can_manage_ai_billing(p_owner_type text, p_owner_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if p_owner_type = 'agent' then
    return p_owner_id = auth.uid();
  end if;

  return exists (
    select 1 from public.companies c
    where c.id = p_owner_id and c.owner_id = auth.uid()
  ) or exists (
    select 1 from public.company_members m
    where m.company_id = p_owner_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
      and m.permissions @> '["manage_billing"]'::jsonb
  );
end;
$$;

revoke execute on function public.can_manage_ai_billing(text, uuid) from public, anon;