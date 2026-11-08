begin;

-- 1. Closed marker (the verification_status enum is left alone) --------------
alter table public.companies
  add column if not exists closed_at timestamptz;

-- 2. Cleanup registry ---------------------------------------------------------
-- Each feature registers public.<fn>(p_company_id uuid) to unpublish listings,
-- stop AI calling, cancel invitations, etc. Runs inside the closing transaction.
create table if not exists public.company_closure_handlers (
  key        text primary key,
  fn         text not null check (fn ~ '^[a-z_][a-z0-9_]*$'),
  run_order  int  not null default 100,
  enabled    boolean not null default true
);

alter table public.company_closure_handlers enable row level security;
-- No policies: migrations / service role only.

-- 3. Blockers -----------------------------------------------------------------
-- Blocks while any paid or trial coverage is still running. A trial that has not
-- ended counts, because Paystack starts charging when it does. A cancelled
-- subscription blocks until its paid period ends, which matches the message.
-- Status labels are guesses; the date columns are the reliable part.
create or replace function public.company_has_active_subscription(p_company_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.company_subscriptions s
    where s.company_id = p_company_id
      and (   s.status in ('active', 'trialing', 'past_due')
           or s.current_period_end > now()
           or s.trial_ends_at      > now()
           or s.grace_until        > now())
  );
$$;

create or replace function public.company_closure_blockers(p_company_id uuid)
returns table (code text, message text)
language sql stable security definer set search_path = public as $$
  select 'active_subscription'::text,
         'Cancel your Pro subscription and let it end before closing the company.'::text
  where public.company_has_active_subscription(p_company_id)
  union all
  -- Deals still owing remittance, or in dispute. remittance_received is finished.
  select 'open_transactions'::text,
         'Settle your pending remittances and resolve any disputed deals before closing the company.'::text
  where exists (
    select 1
    from public.transactions t
    left join public.properties p on p.id = t.listing_id
    where t.status::text in ('pending_remittance', 'disputed')
      and (p.owner_id = p_company_id or t.remitting_party_id = p_company_id)
  );
$$;

revoke all on function public.company_has_active_subscription(uuid) from public, anon, authenticated;
revoke all on function public.company_closure_blockers(uuid)        from public, anon, authenticated;

-- 4. UI pre-check (owner only) ------------------------------------------------
create or replace function public.my_company_closure_blockers(p_company_id uuid)
returns table (code text, message text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.companies c
    where c.id = p_company_id and c.closed_at is null
      and (c.owner_id = auth.uid()
           or exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.company_id = c.id))
  ) then
    return;   -- not the owner: reveal nothing
  end if;
  return query select * from public.company_closure_blockers(p_company_id);
end $$;

grant execute on function public.my_company_closure_blockers(uuid) to authenticated;

-- 5. Close --------------------------------------------------------------------
create or replace function public.close_company(p_company_id uuid, p_company_name text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_name  text;
  v_codes text[];
  h       record;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select c.name into v_name
  from public.companies c
  where c.id = p_company_id
    and c.closed_at is null
    and (c.owner_id = v_uid
         or exists (select 1 from public.profiles p
                    where p.id = v_uid and p.company_id = c.id))
  for update;

  if not found then
    raise exception 'not_owner_or_not_found' using errcode = 'P0001';
  end if;

  if lower(btrim(coalesce(p_company_name, ''))) <> lower(btrim(v_name)) then
    raise exception 'name_mismatch' using errcode = 'P0001';
  end if;

  select array_agg(code) into v_codes from public.company_closure_blockers(p_company_id);
  if v_codes is not null then
    raise exception 'closure_blocked: %', array_to_string(v_codes, ',')
      using errcode = 'P0001';
  end if;

  update public.companies set closed_at = now() where id = p_company_id;

  -- Feature cleanup (listings, AI calling, invitations, ...)
  for h in
    select fn from public.company_closure_handlers
    where enabled order by run_order, key
  loop
    execute format('select public.%I($1)', h.fn) using p_company_id;
  end loop;

  -- Everyone on the team loses access
  delete from public.company_members where company_id = p_company_id;

  -- The owner's account goes back to a viewer account
  update public.profiles
     set company_id   = null,
         company_role = null,
         roles        = array(select r from unnest(roles) r where r::text <> 'company'),
         active_role  = case when active_role::text = 'company' then 'viewer' else active_role end
   where company_id = p_company_id;
end $$;

grant execute on function public.close_company(uuid, text) to authenticated;

-- 5b. First handlers ----------------------------------------------------------
-- Pending invitations can no longer be accepted.
create or replace function public.company_closure_invitations(p_company_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.company_invitations
     set revoked_at = now()
   where company_id = p_company_id
     and accepted_at is null
     and revoked_at is null;
$$;

-- FAQs have a public read policy for enabled rows, so switch them off.
create or replace function public.company_closure_faqs(p_company_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.ai_faqs set enabled = false where company_id = p_company_id;
$$;

-- Live listings are taken down. Sold and rented history is kept as it is.
-- Matches on owner_id alone: company ids and profile ids are random uuids, so a
-- company id can't collide with an agent's id, and this doesn't depend on the
-- owner_type label. If 'inactive' isn't a label on properties.status this raises
-- and the closure rolls back, which is the safe way to fail.
create or replace function public.company_closure_listings(p_company_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.properties
     set status = 'inactive'
   where owner_id = p_company_id
     and status::text = 'active';
$$;

create or replace function public.company_closure_jv(p_company_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.jv_properties
     set status = 'inactive'
   where owner_id = p_company_id
     and status::text = 'active';
$$;

revoke all on function public.company_closure_invitations(uuid) from public, anon, authenticated;
revoke all on function public.company_closure_faqs(uuid)        from public, anon, authenticated;
revoke all on function public.company_closure_listings(uuid)    from public, anon, authenticated;
revoke all on function public.company_closure_jv(uuid)          from public, anon, authenticated;

insert into public.company_closure_handlers (key, fn, run_order) values
  ('invitations', 'company_closure_invitations', 100),
  ('faqs',        'company_closure_faqs',        110),
  ('listings',    'company_closure_listings',    120),
  ('jv',          'company_closure_jv',          130)
on conflict (key) do nothing;

-- Still to add: AI assistant config (table not created yet), training
-- documents and storage files (retention rule).

-- 6. Account deletion: a closed company no longer blocks the owner -----------
create or replace function public.account_deletion_blockers(p_user_id uuid)
returns table (code text, message text)
language sql stable security definer set search_path = public as $$
  select 'owns_company'::text,
         'Transfer ownership or close your company before deleting your account.'::text
  where exists (select 1 from public.companies c
                where c.owner_id = p_user_id and c.closed_at is null)
     or exists (select 1 from public.profiles p
                where p.id = p_user_id and p.company_id is not null)
  union all
  select 'last_admin'::text,
         'Add another admin to your team before deleting your account.'::text
  where exists (
    select 1
    from public.company_members m
    where m.user_id = p_user_id
      and m.role::text = 'admin'
      and not exists (
        select 1 from public.company_members o
        where o.company_id = m.company_id
          and o.role::text = 'admin'
          and o.user_id <> p_user_id
      )
  );
$$;

revoke all on function public.account_deletion_blockers(uuid) from public, anon, authenticated;

commit;