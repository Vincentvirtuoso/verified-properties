-- ============================================================
-- 012 COMPANY DASHBOARD NUMBERS
-- Run after 011. Live counts for company members only.
-- Company listings = listings with owner_type 'company' posted by
-- any current member of the company.
-- ============================================================

create or replace function public.get_company_dashboard_stats(_company_id uuid)
returns table (
  team_size integer,
  active_listings integer,
  draft_listings integer,
  hidden_listings integer,
  closed_deals integer,
  live_value numeric,
  total_enquiries integer,
  open_enquiries integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_company_member(_company_id) then
    raise exception 'Company members only' using errcode = '42501';
  end if;

  return query
  with listings as (
    select pr.id, pr.status, pr.price
    from public.properties pr
    join public.company_members m on m.user_id = pr.owner_id
    where m.company_id = _company_id and pr.owner_type = 'company'
  )
  select
    (select count(*)::int from public.company_members where company_id = _company_id),
    (select count(*)::int from listings where status = 'active'),
    (select count(*)::int from listings where status = 'draft'),
    (select count(*)::int from listings where status = 'inactive'),
    (select count(*)::int from listings where status in ('sold', 'rented')),
    (select coalesce(sum(price), 0) from listings where status = 'active'),
    (select count(*)::int from public.inquiries i where i.listing_id in (select id from listings)),
    (select count(*)::int from public.inquiries i
       where i.listing_id in (select id from listings) and i.status in ('open', 'in_progress'));
end;
$$;

revoke all on function public.get_company_dashboard_stats(uuid) from public, anon;
grant execute on function public.get_company_dashboard_stats(uuid) to authenticated;
