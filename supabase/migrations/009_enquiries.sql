-- ============================================================
-- 009 ENQUIRIES
-- Run after 008. Builds on the existing inquiries /
-- inquiry_messages tables from 001 (no duplicate schema).
--
-- * Each enquiry is assigned automatically to the listing owner
--   (assigned_cs_agent), so the agent/company can see and answer it.
-- * Adds a pipeline stage and the buyer's callback name/phone.
-- * Buyers can only enquire on ACTIVE listings, not their own.
-- * Only the assigned agent can move the stage / status; nobody can
--   reassign an enquiry, change its listing/buyer or attach a
--   transaction from the browser.
-- * sender_type on messages is set by the database, never trusted.
-- ============================================================

alter table public.inquiries
  add column if not exists stage text not null default 'qualification'
    check (stage in ('qualification', 'selection', 'inspection')),
  add column if not exists contact_name text
    check (contact_name is null or char_length(contact_name) between 1 and 100),
  add column if not exists contact_phone text
    check (contact_phone is null or char_length(contact_phone) between 5 and 30);

alter table public.inquiry_messages
  add constraint inquiry_messages_content_length
    check (char_length(btrim(content)) between 1 and 2000) not valid;

create index if not exists inquiries_assigned_cs_agent_idx
  on public.inquiries(assigned_cs_agent);

-- One open conversation per buyer per listing.
create unique index if not exists inquiries_one_open_per_buyer_listing
  on public.inquiries(listing_id, viewer_id)
  where status in ('open', 'in_progress');

-- ---------- insert guard: assign owner, force safe defaults ----------
create or replace function public.inquiries_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _owner uuid;
begin
  select owner_id into _owner
  from public.properties
  where id = new.listing_id and status = 'active';

  if _owner is null then
    raise exception 'You can only enquire about active listings'
      using errcode = '42501';
  end if;

  if _owner = new.viewer_id then
    raise exception 'You cannot enquire about your own listing'
      using errcode = '42501';
  end if;

  new.assigned_cs_agent := _owner;
  new.status := 'open';
  new.stage := 'qualification';
  new.transaction_id := null;
  return new;
end;
$$;

drop trigger if exists inquiries_before_insert on public.inquiries;
create trigger inquiries_before_insert
before insert on public.inquiries
for each row execute function public.inquiries_before_insert();

-- ---------- update guard ----------
create or replace function public.inquiries_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Trusted server code (service role / SQL editor) is not restricted.
  if auth.uid() is null then
    return new;
  end if;

  if new.listing_id is distinct from old.listing_id
     or new.viewer_id is distinct from old.viewer_id
     or new.assigned_cs_agent is distinct from old.assigned_cs_agent
     or new.transaction_id is distinct from old.transaction_id
     or new.created_at is distinct from old.created_at then
    raise exception 'These enquiry fields cannot be changed'
      using errcode = '42501';
  end if;

  if auth.uid() = old.assigned_cs_agent then
    -- Agents can move stage and status, but not edit the buyer's contact.
    if new.contact_name is distinct from old.contact_name
       or new.contact_phone is distinct from old.contact_phone then
      raise exception 'Only the buyer can change their contact details'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- Buyer: may update their contact details or cancel; nothing else.
  if new.stage is distinct from old.stage then
    raise exception 'Only the agent can change the stage'
      using errcode = '42501';
  end if;
  if new.status is distinct from old.status and new.status <> 'cancelled' then
    raise exception 'You can only cancel your enquiry'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists inquiries_before_update on public.inquiries;
create trigger inquiries_before_update
before update on public.inquiries
for each row execute function public.inquiries_before_update();

-- ---------- messages: derive sender_type, bump updated_at ----------
create or replace function public.inquiry_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _i public.inquiries;
begin
  select * into _i from public.inquiries where id = new.inquiry_id;

  if auth.uid() is not null then
    if new.sender_id = _i.viewer_id then
      new.sender_type := 'viewer';
    elsif new.sender_id = _i.assigned_cs_agent then
      new.sender_type := 'cs_agent';
    else
      raise exception 'Not a participant' using errcode = '42501';
    end if;

    if _i.status in ('cancelled', 'deal_closed') then
      raise exception 'This enquiry is closed' using errcode = '42501';
    end if;
  end if;

  new.content := btrim(new.content);
  new.sent_at := now();
  return new;
end;
$$;

drop trigger if exists inquiry_messages_before_insert on public.inquiry_messages;
create trigger inquiry_messages_before_insert
before insert on public.inquiry_messages
for each row execute function public.inquiry_messages_before_insert();

create or replace function public.inquiry_messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inquiries set updated_at = now() where id = new.inquiry_id;
  return null;
end;
$$;

drop trigger if exists inquiry_messages_after_insert on public.inquiry_messages;
create trigger inquiry_messages_after_insert
after insert on public.inquiry_messages
for each row execute function public.inquiry_messages_after_insert();

-- Keep properties.total_inquiries honest (the 006 guard blocks clients).
create or replace function public.inquiries_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.properties
  set total_inquiries = total_inquiries + 1
  where id = new.listing_id;
  return null;
end;
$$;

drop trigger if exists inquiries_after_insert on public.inquiries;
create trigger inquiries_after_insert
after insert on public.inquiries
for each row execute function public.inquiries_after_insert();

-- ---------- send an enquiry from the property page ----------
-- Runs as the caller (RLS + triggers apply). Reuses the buyer's open
-- conversation for the same listing instead of opening a second one.
create or replace function public.create_enquiry(
  _listing_id uuid,
  _contact_name text,
  _contact_phone text,
  _message text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  _id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to send an enquiry' using errcode = '42501';
  end if;

  select id into _id
  from public.inquiries
  where listing_id = _listing_id
    and viewer_id = auth.uid()
    and status in ('open', 'in_progress');

  if _id is null then
    insert into public.inquiries (listing_id, viewer_id, contact_name, contact_phone)
    values (_listing_id, auth.uid(), btrim(_contact_name), btrim(_contact_phone))
    returning id into _id;
  else
    update public.inquiries
    set contact_name = btrim(_contact_name), contact_phone = btrim(_contact_phone)
    where id = _id;
  end if;

  insert into public.inquiry_messages (inquiry_id, sender_id, sender_type, content)
  values (_id, auth.uid(), 'viewer', _message);

  return _id;
end;
$$;

-- ---------- inbox: enquiries the caller is part of ----------
-- profiles stay private; this returns only the other participant's
-- name/avatar, and the buyer's phone only to the assigned agent.
create or replace function public.get_my_enquiries()
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
language sql
stable
security definer
set search_path = public
as $$
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
    select m.content, m.sender_type, m.sent_at
    from public.inquiry_messages m
    where m.inquiry_id = i.id
    order by m.sent_at desc
    limit 1
  ) lm on true
  where auth.uid() is not null
    and (i.viewer_id = auth.uid() or i.assigned_cs_agent = auth.uid())
  order by coalesce(lm.sent_at, i.created_at) desc;
$$;

revoke all on function public.create_enquiry(uuid, text, text, text) from public, anon;
revoke all on function public.get_my_enquiries() from public, anon;
grant execute on function public.create_enquiry(uuid, text, text, text) to authenticated;
grant execute on function public.get_my_enquiries() to authenticated;

-- Live updates for the inbox (ignore if already added).
do $$
begin
  alter publication supabase_realtime add table public.inquiry_messages;
exception when others then null;
end $$;
