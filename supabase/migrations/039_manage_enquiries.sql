-- Who can open the team inbox and read or reply to company enquiries.
create or replace function public.can_manage_company_enquiries(p_company_id uuid)
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

  return exists (
    select 1 from public.companies c
    where c.id = p_company_id and c.owner_id = auth.uid()
  ) or exists (
    select 1 from public.company_members m
    where m.company_id = p_company_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
      and m.permissions @> '["manage_enquiries"]'::jsonb
  );
end;
$$;

-- Owner grants or removes enquiry access, the same way as billing.
create or replace function public.set_company_enquiry_access(
  p_company_id uuid,
  p_user_id    uuid,
  p_granted    boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role  text;
  v_perms jsonb;
begin
  if not exists (
    select 1 from public.companies
    where id = p_company_id and owner_id = auth.uid()
  ) then
    raise exception 'not_authorised';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'cannot_change_own_access';
  end if;

  select role, coalesce(permissions, '[]'::jsonb)
    into v_role, v_perms
  from public.company_members
  where company_id = p_company_id and user_id = p_user_id;

  if v_role is null then
    raise exception 'not_found';
  end if;

  if v_role <> 'admin' then
    raise exception 'enquiry_access_requires_admin';
  end if;

  if p_granted then
    if not (v_perms @> '["manage_enquiries"]'::jsonb) then
      v_perms := v_perms || '["manage_enquiries"]'::jsonb;
    end if;
  else
    v_perms := v_perms - 'manage_enquiries';
  end if;

  update public.company_members
  set permissions = v_perms
  where company_id = p_company_id and user_id = p_user_id;
end;
$$;

-- Team inbox: company listings only, for people who can manage enquiries.
-- The return shape is unchanged from 032, so this replaces in place.
create or replace function public.get_company_enquiries(_company_id uuid)
returns table (
  id uuid,
  listing_id uuid,
  listing_title text,
  listing_slug text,
  listing_image text,
  viewer_id uuid,
  viewer_name text,
  viewer_avatar text,
  contact_phone text,
  agent_id uuid,
  agent_name text,
  agent_avatar text,
  stage text,
  status public.inquiry_status,
  last_message text,
  last_sender_type text,
  last_event_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_manage_company_enquiries(_company_id) then
    raise exception 'not_authorised' using errcode = '42501';
  end if;

  return query
  select
    i.id,
    i.listing_id,
    pr.title,
    pr.slug,
    (select pi.url from public.property_images pi
      where pi.property_id = pr.id order by pi.sort_order limit 1),
    i.viewer_id,
    coalesce(i.contact_name, v.name),
    v.avatar,
    case when i.assigned_cs_agent = auth.uid() then i.contact_phone end,
    i.assigned_cs_agent,
    a.name,
    a.avatar,
    i.stage,
    i.status,
    lm.content,
    lm.sender_type,
    coalesce(lm.sent_at, i.created_at),
    i.created_at
  from public.inquiries i
  join public.properties pr on pr.id = i.listing_id
  join public.profiles v on v.id = i.viewer_id
  left join public.profiles a on a.id = i.assigned_cs_agent
  left join lateral (
    select im.content, im.sender_type, im.sent_at
    from public.inquiry_messages im
    where im.inquiry_id = i.id
    order by im.sent_at desc
    limit 1
  ) lm on true
  where pr.company_id = _company_id
  order by coalesce(lm.sent_at, i.created_at) desc;
end;
$$;

-- Keep manage_enquiries when an admin edits a member's other permissions.
create or replace function public.set_company_member_permissions(
  p_company_id  uuid,
  p_user_id     uuid,
  p_permissions jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_owner   boolean;
  v_can_manage boolean;
  v_role       text;
  v_current    jsonb;
  v_clean      jsonb;
begin
  select exists (
    select 1 from public.companies
    where id = p_company_id and owner_id = auth.uid()
  ) into v_is_owner;

  select exists (
    select 1 from public.company_members m
    where m.company_id = p_company_id
      and m.user_id = auth.uid()
      and m.role = 'admin'
      and m.permissions @> '["manage_members"]'::jsonb
  ) into v_can_manage;

  if not (v_is_owner or v_can_manage) then
    raise exception 'not_authorised';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'cannot_change_own_permissions';
  end if;

  select role, coalesce(permissions, '[]'::jsonb)
    into v_role, v_current
  from public.company_members
  where company_id = p_company_id and user_id = p_user_id;

  if v_role is null then
    raise exception 'not_found';
  end if;

  if v_role = 'admin' and not v_is_owner then
    raise exception 'owner_only_for_admins';
  end if;

  select coalesce(jsonb_agg(p), '[]'::jsonb) into v_clean
  from jsonb_array_elements_text(p_permissions) as p
  where p in ('manage_listings', 'manage_members', 'view_analytics');

  -- Billing and enquiry access are changed only by their own functions.
  if v_current @> '["manage_billing"]'::jsonb then
    v_clean := v_clean || '["manage_billing"]'::jsonb;
  end if;
  if v_current @> '["manage_enquiries"]'::jsonb then
    v_clean := v_clean || '["manage_enquiries"]'::jsonb;
  end if;

  update public.company_members
  set permissions = v_clean
  where company_id = p_company_id and user_id = p_user_id;
end;
$$;

revoke execute on function public.can_manage_company_enquiries(uuid) from public, anon;
revoke execute on function public.set_company_enquiry_access(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_company_enquiry_access(uuid, uuid, boolean) to authenticated;
revoke execute on function public.get_company_enquiries(uuid) from public, anon;
grant execute on function public.get_company_enquiries(uuid) to authenticated;
revoke execute on function public.set_company_member_permissions(uuid, uuid, jsonb) from public, anon;
grant execute on function public.set_company_member_permissions(uuid, uuid, jsonb) to authenticated;