-- ============================================================
-- 011 PUBLIC AGENTS & COMPANIES DIRECTORY
-- Run after 010.
-- profiles and companies stay private (RLS unchanged). These
-- functions return a safe "business card" only for:
--   * agents who are verified OR have at least one live listing
--   * companies that are verified OR have at least one live listing
-- Never returned: roles, documents, remittance/bank details,
-- features, viewer data, unverified users without live listings.
-- ============================================================

create or replace function public.get_public_agents(_id uuid default null)
returns table (
  id uuid,
  name text,
  avatar text,
  email text,
  phone text,
  whatsapp_number text,
  sub_role text,
  verification_status text,
  brokerage text,
  company_id uuid,
  company_name text,
  cities text[],
  property_types text[],
  active_listings integer,
  closed_deals integer,
  total_value numeric,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.name, p.avatar, p.email, p.phone, p.whatsapp_number,
    p.agent_profile ->> 'subRole',
    coalesce(p.agent_profile ->> 'verificationStatus', 'unverified'),
    p.agent_profile ->> 'brokerage',
    c.id,
    case when c.verification_status = 'verified' or exists (
      select 1 from public.properties x
      where x.owner_id = p.id and x.status = 'active' and x.owner_type = 'company'
    ) then c.name end,
    coalesce(s.cities, '{}'),
    coalesce(s.types, '{}'),
    coalesce(s.active, 0),
    coalesce(s.closed, 0),
    coalesce(s.value, 0),
    p.created_at
  from public.profiles p
  left join public.companies c on c.id = p.company_id
  left join lateral (
    select
      array_agg(distinct pr.city) filter (where pr.status = 'active') as cities,
      array_agg(distinct pr.property_type::text) filter (where pr.status = 'active') as types,
      (count(*) filter (where pr.status = 'active'))::int as active,
      (count(*) filter (where pr.status in ('sold', 'rented')))::int as closed,
      sum(pr.price) filter (where pr.status = 'active') as value
    from public.properties pr
    where pr.owner_id = p.id
  ) s on true
  where 'agent'::public.user_role = any(p.roles)
    and (_id is null or p.id = _id)
    and (
      p.agent_profile ->> 'verificationStatus' = 'verified'
      or coalesce(s.active, 0) > 0
    )
  order by coalesce(s.active, 0) desc, p.name;
$$;

create or replace function public.get_public_companies(_id_or_slug text default null)
returns table (
  id uuid,
  name text,
  slug text,
  logo text,
  type public.company_type,
  verification_status public.verification_status,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  team_size integer,
  active_listings integer,
  cities text[],
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.name, c.slug, c.logo, c.type, c.verification_status,
    c.contact_email, c.contact_phone, c.whatsapp_number,
    (select count(*)::int from public.company_members m where m.company_id = c.id),
    coalesce(s.active, 0),
    coalesce(s.cities, '{}'),
    c.created_at
  from public.companies c
  left join lateral (
    select (count(*))::int as active, array_agg(distinct pr.city) as cities
    from public.properties pr
    join public.company_members m on m.user_id = pr.owner_id and m.company_id = c.id
    where pr.status = 'active' and pr.owner_type = 'company'
  ) s on true
  where (_id_or_slug is null or c.id::text = _id_or_slug or c.slug = _id_or_slug)
    and (c.verification_status = 'verified' or coalesce(s.active, 0) > 0)
  order by coalesce(s.active, 0) desc, c.name;
$$;

-- Live company listings (ids only; details come from the public
-- properties read, which RLS already limits to active listings).
create or replace function public.get_public_company_listing_ids(_company_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select pr.id
  from public.properties pr
  join public.company_members m on m.user_id = pr.owner_id
  where m.company_id = _company_id
    and pr.status = 'active'
    and pr.owner_type = 'company'
  order by pr.created_at desc;
$$;

grant execute on function public.get_public_agents(uuid) to anon, authenticated;
grant execute on function public.get_public_companies(text) to anon, authenticated;
grant execute on function public.get_public_company_listing_ids(uuid) to anon, authenticated;
