
begin;

-- 1. Profile flags -----------------------------------------------------------
alter table public.profiles
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_scheduled_for timestamptz,
  add column if not exists deleted_at timestamptz;

-- 2. Request / audit table ---------------------------------------------------
-- No FK to auth.users: the row must survive as the audit record.
create table if not exists public.account_deletion_requests (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null,
  status                 text not null default 'pending'
                         check (status in ('pending','processing','completed','cancelled')),
  requested_at           timestamptz not null default now(),
  scheduled_for          timestamptz not null,
  processing_started_at  timestamptz,
  cancelled_at           timestamptz,
  completed_at           timestamptz
);

create unique index if not exists account_deletion_one_open_per_user
  on public.account_deletion_requests (user_id)
  where status in ('pending','processing');

alter table public.account_deletion_requests enable row level security;

drop policy if exists "own deletion request" on public.account_deletion_requests;
create policy "own deletion request" on public.account_deletion_requests
  for select using (user_id = auth.uid());
-- No insert/update/delete policies: writes go through the functions below.

-- 3. Cleanup registry --------------------------------------------------------
-- Each feature registers a function public.<fn>(p_user_id uuid) that anonymises
-- or removes that feature's data for the user. Runs inside one transaction.
create table if not exists public.account_deletion_handlers (
  key        text primary key,
  fn         text not null check (fn ~ '^[a-z_][a-z0-9_]*$'),
  run_order  int  not null default 100,
  enabled    boolean not null default true
);

alter table public.account_deletion_handlers enable row level security;
-- No policies: service role / migrations only.

-- 4. Blocking rules ----------------------------------------------------------
create or replace function public.account_deletion_blockers(p_user_id uuid)
returns table (code text, message text)
language sql stable security definer set search_path = public as $$
  -- ASSUMED: companies.owner_id
  select 'owns_company'::text,
         'Transfer ownership or close your company before deleting your account.'::text
  where exists (select 1 from public.companies c where c.owner_id = p_user_id)
  union all
  -- ASSUMED: company_members.role = 'admin'
  select 'last_admin'::text,
         'Add another admin to your team before deleting your account.'::text
  where exists (
    select 1
    from public.company_members m
    where m.user_id = p_user_id
      and m.role = 'admin'
      and not exists (
        select 1 from public.company_members o
        where o.company_id = m.company_id
          and o.role = 'admin'
          and o.user_id <> p_user_id
      )
  );
$$;

revoke all on function public.account_deletion_blockers(uuid) from public, anon, authenticated;

-- UI pre-check for the signed-in user
create or replace function public.my_account_deletion_blockers()
returns table (code text, message text)
language sql stable security definer set search_path = public as $$
  select * from public.account_deletion_blockers(auth.uid());
$$;

grant execute on function public.my_account_deletion_blockers() to authenticated;

-- 5. Request and cancel ------------------------------------------------------
create or replace function public.request_account_deletion()
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_grace  constant int := 30;               -- grace period in days
  v_when   timestamptz;
  v_codes  text[];
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select scheduled_for into v_when
  from public.account_deletion_requests
  where user_id = v_uid and status = 'pending';
  if found then
    return v_when;                            -- already requested
  end if;

  select array_agg(code) into v_codes from public.account_deletion_blockers(v_uid);
  if v_codes is not null then
    raise exception 'deletion_blocked: %', array_to_string(v_codes, ',')
      using errcode = 'P0001';
  end if;

  v_when := now() + make_interval(days => v_grace);

  insert into public.account_deletion_requests (user_id, scheduled_for)
  values (v_uid, v_when);

  update public.profiles
     set deletion_requested_at = now(), deletion_scheduled_for = v_when
   where id = v_uid;

  return v_when;
end $$;

create or replace function public.cancel_account_deletion()
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_n   int;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  update public.account_deletion_requests
     set status = 'cancelled', cancelled_at = now()
   where user_id = v_uid and status = 'pending';
  get diagnostics v_n = row_count;

  if v_n > 0 then
    update public.profiles
       set deletion_requested_at = null, deletion_scheduled_for = null
     where id = v_uid;
  end if;
  return v_n > 0;
end $$;

grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.cancel_account_deletion()  to authenticated;

-- 6. Purge pipeline (service role only) --------------------------------------
-- Claims due requests. Re-checks blockers: if the user became an owner or last
-- admin during the grace period, the request is cancelled instead of purged.
create or replace function public.claim_due_account_deletions(p_limit int default 25)
returns setof uuid
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  for r in
    select id, user_id
    from public.account_deletion_requests
    where (status = 'pending' and scheduled_for <= now())
       or (status = 'processing' and processing_started_at < now() - interval '1 hour')
    order by scheduled_for
    limit p_limit
    for update skip locked
  loop
    if exists (select 1 from public.account_deletion_blockers(r.user_id)) then
      update public.account_deletion_requests
         set status = 'cancelled', cancelled_at = now()
       where id = r.id;
      update public.profiles
         set deletion_requested_at = null, deletion_scheduled_for = null
       where id = r.user_id;
    else
      update public.account_deletion_requests
         set status = 'processing', processing_started_at = now()
       where id = r.id;
      return next r.user_id;
    end if;
  end loop;
end $$;

-- Runs every registered handler in one transaction.
create or replace function public.anonymise_account(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  h record;
begin
  for h in
    select fn from public.account_deletion_handlers
    where enabled order by run_order, key
  loop
    execute format('select public.%I($1)', h.fn) using p_user_id;
  end loop;
end $$;

create or replace function public.complete_account_deletion(p_user_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.account_deletion_requests
     set status = 'completed', completed_at = now()
   where user_id = p_user_id and status = 'processing';
$$;

revoke all on function public.claim_due_account_deletions(int) from public, anon, authenticated;
revoke all on function public.anonymise_account(uuid)          from public, anon, authenticated;
revoke all on function public.complete_account_deletion(uuid)  from public, anon, authenticated;
grant execute on function public.claim_due_account_deletions(int) to service_role;
grant execute on function public.anonymise_account(uuid)          to service_role;
grant execute on function public.complete_account_deletion(uuid)  to service_role;

-- 7. First handler: the profile itself ---------------------------------------
-- ASSUMED columns: full_name, phone, avatar_url. Adjust to your profiles table.
create or replace function public.account_deletion_profile(p_user_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.profiles
     set full_name  = 'Deleted user',
         phone      = null,
         avatar_url = null,
         deleted_at = now()
   where id = p_user_id;
$$;

revoke all on function public.account_deletion_profile(uuid) from public, anon, authenticated;

insert into public.account_deletion_handlers (key, fn, run_order)
values ('profile', 'account_deletion_profile', 100)
on conflict (key) do nothing;

-- Later features register the same way, e.g.:
--   create function public.account_deletion_team(p_user_id uuid) ...;
--   insert into public.account_deletion_handlers (key, fn) values ('team', 'account_deletion_team');

commit;