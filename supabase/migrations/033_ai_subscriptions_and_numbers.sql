
-- One AI calling subscription per owner (company or agent).
create table public.ai_subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  owner_type         text not null check (owner_type in ('company', 'agent')),
  owner_id           uuid not null,
  tier               text not null check (tier in ('starter', 'growth', 'business')),
  status             text not null check (status in ('free', 'trialing', 'active', 'past_due', 'canceled')),
  trial_used         boolean not null default false,
  trial_ends_at      timestamptz,
  current_period_end timestamptz,
  grace_until        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (owner_type, owner_id)
);

alter table public.ai_subscriptions enable row level security;

create policy "owners read own ai subscription"
  on public.ai_subscriptions for select
  using (auth.uid() = owner_id);

-- Mirrors the live-subscription logic in the app, so the database and UI agree.
create or replace function public.ai_subscription_is_live(p_owner_type text, p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ai_subscriptions s
    where s.owner_type = p_owner_type
      and s.owner_id = p_owner_id
      and (
        (s.status = 'trialing'  and s.trial_ends_at > now()) or
        (s.status in ('active', 'canceled') and s.current_period_end > now()) or
        (s.status = 'past_due'  and s.grace_until > now())
      )
  );
$$;

-- Number allowance per AI plan.
create or replace function public.ai_number_cap(p_tier text)
returns int
language sql
immutable
set search_path = public
as $$
  select case p_tier
    when 'starter'  then 1
    when 'growth'   then 1
    when 'business' then 3
    else 0
  end;
$$;

-- Phone numbers used for outbound AI calls.
create table public.ai_call_numbers (
  id             uuid primary key default gen_random_uuid(),
  owner_type     text not null check (owner_type in ('company', 'agent')),
  owner_id       uuid not null,
  e164           text not null check (e164 ~ '^\+234[0-9]{10}$'),
  carrier        text not null default 'other' check (carrier in ('mtn', 'other')),
  status         text not null default 'pending'
                 check (status in ('pending', 'active', 'released', 'failed')),
  is_default     boolean not null default false,
  provider_ref   text,
  requested_at   timestamptz not null default now(),
  provisioned_at timestamptz,
  released_at    timestamptz,
  created_at     timestamptz not null default now()
);

create unique index ai_call_numbers_live_e164
  on public.ai_call_numbers (e164)
  where status in ('pending', 'active');

create unique index ai_call_numbers_one_default
  on public.ai_call_numbers (owner_type, owner_id)
  where is_default and status in ('pending', 'active');

alter table public.ai_call_numbers enable row level security;

create policy "owners read own ai call numbers"
  on public.ai_call_numbers for select
  using (auth.uid() = owner_id);

-- Adds a number request. The plan is read from the subscription row, never from the client.
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
  if not public.ai_subscription_is_live(p_owner_type, p_owner_id) then
    raise exception 'no_active_ai_subscription';
  end if;

  select tier into v_tier
  from public.ai_subscriptions
  where owner_type = p_owner_type and owner_id = p_owner_id;

  v_cap := public.ai_number_cap(v_tier);

  -- Serialise requests per owner so two inserts can't both pass the cap.
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

-- Admin marks a number active once Africa's Talking has allocated it.
create or replace function public.activate_ai_call_number(p_id uuid, p_provider_ref text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin')) then
    raise exception 'not_authorised';
  end if;

  update public.ai_call_numbers
  set status = 'active', provider_ref = p_provider_ref, provisioned_at = now()
  where id = p_id and status = 'pending';
end;
$$;

-- Owners release their own number; admins can release any number.
create or replace function public.release_ai_call_number(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.ai_call_numbers where id = p_id;
  if v_owner_id is null then
    raise exception 'not_found';
  end if;

  if v_owner_id <> auth.uid()
     and not (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin')) then
    raise exception 'not_authorised';
  end if;

  update public.ai_call_numbers
  set status = 'released', released_at = now(), is_default = false
  where id = p_id and status in ('pending', 'active');
end;
$$;

revoke execute on function public.request_ai_call_number(text, uuid, text, text) from public, anon;
revoke execute on function public.activate_ai_call_number(uuid, text) from public, anon;
revoke execute on function public.release_ai_call_number(uuid) from public, anon;