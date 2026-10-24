


--




















create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant select on public.admin_audit_log to authenticated;
grant all on public.admin_audit_log to service_role;
alter table public.admin_audit_log enable row level security;

drop policy if exists "Admins can view the audit log" on public.admin_audit_log;
create policy "Admins can view the audit log"
on public.admin_audit_log for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log(target_type, target_id);

create or replace function public.audit_log_is_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'The audit log cannot be changed or deleted';
end;
$$;

drop trigger if exists admin_audit_log_append_only on public.admin_audit_log;
create trigger admin_audit_log_append_only
before update or delete on public.admin_audit_log
for each row execute function public.audit_log_is_append_only();

create or replace function public.log_admin_action(
  _action text, _target_type text, _target_id uuid,
  _reason text default null, _details jsonb default '{}'::jsonb
)
returns void language sql security definer set search_path = public as $$
  insert into public.admin_audit_log(admin_id, action, target_type, target_id, reason, details)
  values (auth.uid(), _action, _target_type, _target_id, nullif(btrim(_reason), ''), coalesce(_details, '{}'::jsonb));
$$;
revoke all on function public.log_admin_action(text, text, uuid, text, jsonb) from public, anon, authenticated;


insert into public.admin_audit_log(admin_id, action, target_type, target_id, reason, details, created_at)
select vr.reviewed_by, 'verification.' || vr.status::text, vr.subject_type, vr.subject_id, vr.note,
       jsonb_build_object('backfilled', true), vr.created_at
from public.verification_reviews vr
where not exists (
  select 1 from public.admin_audit_log l
  where l.target_id = vr.subject_id and l.created_at = vr.created_at
);


create or replace function public.check_decision(_decision text, _reason text)
returns void language plpgsql immutable as $$
begin
  if _decision not in ('approve', 'reject', 'more_info') then
    raise exception 'Invalid decision';
  end if;
  if coalesce(btrim(_reason), '') = '' then
    raise exception 'A reason is required for every decision';
  end if;
  if char_length(_reason) > 1000 then
    raise exception 'Reason is too long (max 1000 characters)';
  end if;
end;
$$;


create table if not exists public.account_suspensions (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('user', 'company')),
  subject_id uuid not null,
  reason text not null,
  suspended_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (subject_type, subject_id)
);

grant select on public.account_suspensions to authenticated;
grant all on public.account_suspensions to service_role;
alter table public.account_suspensions enable row level security;

drop policy if exists "Users see their own suspension" on public.account_suspensions;
create policy "Users see their own suspension"
on public.account_suspensions for select to authenticated
using (
  (subject_type = 'user' and subject_id = auth.uid())
  or (subject_type = 'company' and public.is_company_member(subject_id))
  or public.has_role(auth.uid(), 'admin')
);

create or replace function public.is_suspended(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.account_suspensions s
    where (s.subject_type = 'user' and s.subject_id = _user_id)
       or (s.subject_type = 'company' and s.subject_id in (
            select cm.company_id from public.company_members cm where cm.user_id = _user_id))
  );
$$;


create or replace function public.can_publish_listings(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not public.is_suspended(p_user_id) and (
    exists (
      select 1 from public.profiles p
      where p.id = p_user_id
        and p.agent_profile ->> 'verificationStatus' = 'verified'
    )
    or exists (
      select 1
      from public.company_members cm
      join public.companies c on c.id = cm.company_id
      where cm.user_id = p_user_id
        and c.verification_status = 'verified'
    )
  );
$$;


alter table public.properties
  add column if not exists review_status text not null default 'none',
  add column if not exists review_note text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz;

do $$ begin
  alter table public.properties add constraint properties_review_status_check
    check (review_status in ('none', 'pending', 'approved', 'rejected', 'changes_requested'));
exception when duplicate_object then null; end $$;


update public.properties set review_status = 'approved', reviewed_at = now()
where status in ('active', 'sold', 'rented') and review_status = 'none';

create index if not exists properties_review_status_idx on public.properties(review_status);


create or replace function public.guard_property_review()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_key_changed boolean;
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if public.is_suspended(auth.uid()) then
    raise exception 'Your account is suspended' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.review_status := 'none';
    new.review_note := null;
    new.submitted_at := null;
    new.reviewed_at := null;
    if new.status = 'active' then
      raise exception 'Listings go live only after admin approval';
    end if;
    return new;
  end if;

  
  new.review_status := old.review_status;
  new.review_note := old.review_note;
  new.submitted_at := old.submitted_at;
  new.reviewed_at := old.reviewed_at;

  v_key_changed :=
       new.price is distinct from old.price
    or new.address is distinct from old.address
    or new.city is distinct from old.city
    or new.state is distinct from old.state
    or new.latitude is distinct from old.latitude
    or new.longitude is distinct from old.longitude
    or new.listing_purpose is distinct from old.listing_purpose;

  if v_key_changed and old.review_status = 'approved' then
    if old.status = 'active' then
      new.status := 'inactive';
      new.review_status := 'pending';
      new.submitted_at := now();
      new.review_note := 'Key details changed - waiting for re-approval';
    else
      new.review_status := 'none';
    end if;
  end if;

  if new.status = 'active' and old.status <> 'active' then
    if new.review_status <> 'approved' then
      raise exception 'Listings go live only after admin approval';
    end if;
    if not public.can_publish_listings(auth.uid()) then
      raise exception 'Listings can be published after your account is verified';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists properties_review_guard on public.properties;
create trigger properties_review_guard
before insert or update on public.properties
for each row execute function public.guard_property_review();

create or replace function public.submit_listing_for_review(_property_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  _p public.properties;
begin
  select * into _p from public.properties where id = _property_id and owner_id = auth.uid();
  if _p.id is null then raise exception 'Listing not found'; end if;
  if public.is_suspended(auth.uid()) then
    raise exception 'Your account is suspended' using errcode = '42501';
  end if;
  if not public.can_publish_listings(auth.uid()) then
    raise exception 'Get verified before submitting listings';
  end if;
  if _p.status not in ('draft', 'inactive') then
    raise exception 'Only drafts or hidden listings can be submitted';
  end if;
  if _p.review_status = 'pending' then return 'pending'; end if;

  if _p.review_status = 'approved' then
    update public.properties set status = 'active' where id = _p.id;
    return 'active';
  end if;

  update public.properties
  set review_status = 'pending', submitted_at = now(), review_note = null
  where id = _p.id;
  return 'pending';
end;
$$;


alter table public.property_documents
  add column if not exists review_status text not null default 'pending',
  add column if not exists review_note text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

do $$ begin
  alter table public.property_documents add constraint property_documents_review_status_check
    check (review_status in ('pending', 'approved', 'rejected', 'more_info'));
exception when duplicate_object then null; end $$;


update public.property_documents d set review_status = 'approved', reviewed_at = now()
from public.properties p
where p.id = d.property_id and p.review_status = 'approved' and d.review_status = 'pending'
  and d.reviewed_at is null;

create or replace function public.guard_property_document_review()
returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if tg_op = 'INSERT' then
    new.review_status := 'pending';
    new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
  else
    if new.file_url is distinct from old.file_url or new.document_type is distinct from old.document_type then
      new.review_status := 'pending';
      new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
    else
      new.review_status := old.review_status; new.review_note := old.review_note;
      new.reviewed_by := old.reviewed_by; new.reviewed_at := old.reviewed_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists property_documents_review_guard on public.property_documents;
create trigger property_documents_review_guard
before insert or update on public.property_documents
for each row execute function public.guard_property_document_review();


create or replace function public.property_documents_rereview()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _pid uuid := coalesce(new.property_id, old.property_id);
begin
  if tg_op = 'UPDATE' and new.file_url is not distinct from old.file_url
     and new.document_type is not distinct from old.document_type then
    return null;
  end if;
  update public.properties
  set status = case when status = 'active' then 'inactive'::public.property_status else status end,
      review_status = case when status = 'active' then 'pending' else 'none' end,
      submitted_at = case when status = 'active' then now() else submitted_at end,
      review_note = case when status = 'active' then 'Documents changed - waiting for re-approval' else review_note end
  where id = _pid and review_status = 'approved';
  return null;
end;
$$;

drop trigger if exists property_documents_rereview on public.property_documents;
create trigger property_documents_rereview
after insert or update or delete on public.property_documents
for each row execute function public.property_documents_rereview();


create table if not exists public.identity_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('nin', 'passport', 'drivers_licence', 'voters_card')),
  file_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'more_info')),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert, delete on public.identity_documents to authenticated;
grant all on public.identity_documents to service_role;
alter table public.identity_documents enable row level security;

drop policy if exists "Users view their ID documents" on public.identity_documents;
create policy "Users view their ID documents"
on public.identity_documents for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users upload their ID documents" on public.identity_documents;
create policy "Users upload their ID documents"
on public.identity_documents for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and review_note is null and reviewed_by is null and reviewed_at is null
  and split_part(file_path, '/', 1) = auth.uid()::text
);

drop policy if exists "Users remove pending ID documents" on public.identity_documents;
create policy "Users remove pending ID documents"
on public.identity_documents for delete to authenticated
using (user_id = auth.uid() and status in ('pending', 'more_info'));


create or replace function public.request_agent_verification()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _p public.profiles;
  _s text;
begin
  select * into _p from public.profiles where id = auth.uid();
  if _p.id is null or not ('agent'::public.user_role = any(_p.roles)) then
    raise exception 'Only agents can request verification' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.identity_documents d
    where d.user_id = _p.id and d.status in ('pending', 'approved')
  ) then
    raise exception 'Upload a government ID first';
  end if;

  _s := coalesce(_p.agent_profile ->> 'verificationStatus', 'unverified');
  if _s in ('unverified', 'rejected') then
    _s := 'pending';
    update public.profiles
    set agent_profile = coalesce(agent_profile, '{}'::jsonb)
      || jsonb_build_object('verificationStatus', _s)
    where id = _p.id;
  end if;
  return _s;
end;
$$;



alter table public.verification_reviews add column if not exists decision text;
alter table public.verification_reviews drop constraint if exists verification_reviews_note_check;
alter table public.verification_reviews add constraint verification_reviews_note_check
  check (note is null or char_length(note) <= 1000);

drop function if exists public.admin_set_verification(text, uuid, public.verification_status, text);

create or replace function public.admin_set_verification(
  _subject_type text,
  _subject_id uuid,
  _decision text,
  _reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _status public.verification_status;
begin
  perform public.require_admin();
  perform public.check_decision(_decision, _reason);

  _status := case _decision
    when 'approve' then 'verified'
    when 'reject' then 'rejected'
    else 'unverified' end;

  if _subject_type = 'agent' then
    if _decision = 'approve' and not exists (
      select 1 from public.identity_documents d where d.user_id = _subject_id and d.status = 'approved'
    ) then
      raise exception 'Approve the agent''s government ID first';
    end if;
    update public.profiles
    set agent_profile = coalesce(agent_profile, '{}'::jsonb)
      || jsonb_build_object('verificationStatus', _status::text)
    where id = _subject_id and 'agent'::public.user_role = any(roles);
  elsif _subject_type = 'company' then
    update public.companies set verification_status = _status where id = _subject_id;
  else
    raise exception 'Invalid subject type';
  end if;

  if not found then
    raise exception 'Not found';
  end if;

  insert into public.verification_reviews(subject_type, subject_id, status, decision, note, reviewed_by)
  values (_subject_type, _subject_id, _status, _decision, btrim(_reason), auth.uid());

  perform public.log_admin_action('verification.' || _decision, _subject_type, _subject_id, _reason);
end;
$$;


create or replace function public.get_my_verification_feedback()
returns table (subject_type text, subject_id uuid, decision text, note text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select distinct on (vr.subject_type, vr.subject_id)
    vr.subject_type, vr.subject_id, vr.decision, vr.note, vr.created_at
  from public.verification_reviews vr
  where auth.uid() is not null
    and ((vr.subject_type = 'agent' and vr.subject_id = auth.uid())
      or (vr.subject_type = 'company' and public.is_company_member(vr.subject_id)))
  order by vr.subject_type, vr.subject_id, vr.created_at desc;
$$;

create or replace function public.admin_list_identity_documents(_status text default 'pending')
returns table (id uuid, user_id uuid, user_name text, user_email text, doc_type text,
               file_path text, status text, review_note text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return query
  select d.id, d.user_id, p.name, p.email, d.doc_type, d.file_path, d.status, d.review_note, d.created_at
  from public.identity_documents d join public.profiles p on p.id = d.user_id
  where _status is null or d.status = _status
  order by d.created_at
  limit 300;
end;
$$;

create or replace function public.admin_review_identity_document(_id uuid, _decision text, _reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  perform public.check_decision(_decision, _reason);
  update public.identity_documents
  set status = case _decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'more_info' end,
      review_note = btrim(_reason), reviewed_by = auth.uid(), reviewed_at = now()
  where id = _id;
  if not found then raise exception 'Not found'; end if;
  perform public.log_admin_action('identity_document.' || _decision, 'identity_document', _id, _reason);
end;
$$;

create or replace function public.admin_listing_documents(_property_id uuid)
returns table (id uuid, document_type text, title text, file_url text, review_status text,
               review_note text, uploaded_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return query
  select d.id, d.document_type, d.title, d.file_url, d.review_status, d.review_note, d.uploaded_at
  from public.property_documents d where d.property_id = _property_id
  order by d.uploaded_at;
end;
$$;

create or replace function public.admin_review_property_document(_id uuid, _decision text, _reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  perform public.check_decision(_decision, _reason);
  update public.property_documents
  set review_status = case _decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'more_info' end,
      review_note = btrim(_reason), reviewed_by = auth.uid(), reviewed_at = now()
  where id = _id;
  if not found then raise exception 'Not found'; end if;
  perform public.log_admin_action('property_document.' || _decision, 'property_document', _id, _reason);
end;
$$;


drop function if exists public.admin_list_properties(public.property_status);
drop function if exists public.admin_unpublish_property(uuid);

create or replace function public.admin_list_properties(
  _status public.property_status default null,
  _review_status text default null
)
returns table (
  id uuid, slug text, title text, status public.property_status, review_status text,
  review_note text, submitted_at timestamptz, city text, state text, price numeric,
  owner_id uuid, owner_name text, owner_verified boolean, owner_suspended boolean,
  documents_total integer, documents_approved integer, created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return query
  select pr.id, pr.slug, pr.title, pr.status, pr.review_status, pr.review_note, pr.submitted_at,
         pr.city, pr.state, pr.price, pr.owner_id, p.name,
         public.can_publish_listings(pr.owner_id),
         public.is_suspended(pr.owner_id),
         (select count(*)::int from public.property_documents d where d.property_id = pr.id),
         (select count(*)::int from public.property_documents d where d.property_id = pr.id and d.review_status = 'approved'),
         pr.created_at
  from public.properties pr
  join public.profiles p on p.id = pr.owner_id
  where (_status is null or pr.status = _status)
    and (_review_status is null or pr.review_status = _review_status)
  order by coalesce(pr.submitted_at, pr.created_at) desc
  limit 300;
end;
$$;

create or replace function public.admin_review_listing(_property_id uuid, _decision text, _reason text)
returns void language plpgsql security definer set search_path = public as $$
declare
  _p public.properties;
begin
  perform public.require_admin();
  perform public.check_decision(_decision, _reason);
  select * into _p from public.properties where id = _property_id;
  if _p.id is null then raise exception 'Not found'; end if;
  if _p.review_status <> 'pending' then raise exception 'This listing is not waiting for review'; end if;

  if _decision = 'approve' then
    if not public.can_publish_listings(_p.owner_id) then
      raise exception 'Only verified, active accounts can have live listings';
    end if;
    if exists (select 1 from public.property_documents d
               where d.property_id = _p.id and d.review_status <> 'approved') then
      raise exception 'Approve every property document first';
    end if;
    update public.properties
    set status = 'active', review_status = 'approved', review_note = btrim(_reason), reviewed_at = now()
    where id = _p.id;
  else
    update public.properties
    set review_status = case _decision when 'reject' then 'rejected' else 'changes_requested' end,
        review_note = btrim(_reason), reviewed_at = now()
    where id = _p.id;
  end if;

  perform public.log_admin_action('listing.' || _decision, 'listing', _p.id, _reason);
end;
$$;


create or replace function public.admin_unpublish_property(_property_id uuid, _reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if coalesce(btrim(_reason), '') = '' then raise exception 'A reason is required'; end if;
  update public.properties
  set status = 'inactive', review_status = 'rejected', review_note = btrim(_reason), reviewed_at = now()
  where id = _property_id and status = 'active';
  if not found then raise exception 'Listing is not live'; end if;
  perform public.log_admin_action('listing.taken_down', 'listing', _property_id, _reason);
end;
$$;


create or replace function public.admin_suspend(_subject_type text, _subject_id uuid, _reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if _subject_type not in ('user', 'company') then raise exception 'Invalid subject type'; end if;
  if coalesce(btrim(_reason), '') = '' then raise exception 'A reason is required'; end if;
  if _subject_type = 'user' and _subject_id = auth.uid() then raise exception 'You cannot suspend yourself'; end if;
  if _subject_type = 'user' and not exists (select 1 from public.profiles where id = _subject_id) then
    raise exception 'Not found';
  end if;
  if _subject_type = 'company' and not exists (select 1 from public.companies where id = _subject_id) then
    raise exception 'Not found';
  end if;

  insert into public.account_suspensions(subject_type, subject_id, reason, suspended_by)
  values (_subject_type, _subject_id, btrim(_reason), auth.uid())
  on conflict (subject_type, subject_id) do update set reason = excluded.reason;

  
  update public.properties pr
  set status = 'inactive', review_status = 'none', review_note = 'Hidden: account suspended'
  where pr.status = 'active' and (
    (_subject_type = 'user' and pr.owner_id = _subject_id)
    or (_subject_type = 'company' and pr.owner_type = 'company' and pr.owner_id in (
          select cm.user_id from public.company_members cm where cm.company_id = _subject_id))
  );
  update public.jv_properties j
  set status = 'inactive', review_status = 'none'
  where j.status = 'active' and (
    (_subject_type = 'user' and j.owner_id = _subject_id)
    or (_subject_type = 'company' and j.owner_type = 'company' and j.owner_id in (
          select cm.user_id from public.company_members cm where cm.company_id = _subject_id))
  );

  perform public.log_admin_action('account.suspended', _subject_type, _subject_id, _reason);
end;
$$;

create or replace function public.admin_unsuspend(_subject_type text, _subject_id uuid, _reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if coalesce(btrim(_reason), '') = '' then raise exception 'A reason is required'; end if;
  delete from public.account_suspensions where subject_type = _subject_type and subject_id = _subject_id;
  if not found then raise exception 'Not suspended'; end if;
  perform public.log_admin_action('account.unsuspended', _subject_type, _subject_id, _reason);
end;
$$;

create or replace function public.admin_search_accounts(_query text default null, _only_suspended boolean default false)
returns table (subject_type text, id uuid, name text, email text, detail text,
               verification_status text, suspended boolean, suspension_reason text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare
  _q text := '%' || coalesce(btrim(_query), '') || '%';
begin
  perform public.require_admin();
  return query
  select * from (
    select 'user'::text, p.id, p.name, p.email, array_to_string(p.roles::text[], ', '),
           coalesce(p.agent_profile ->> 'verificationStatus', '-'),
           s.id is not null, s.reason, p.created_at
    from public.profiles p
    left join public.account_suspensions s on s.subject_type = 'user' and s.subject_id = p.id
    where (p.name ilike _q or p.email ilike _q)
    union all
    select 'company'::text, c.id, c.name, c.contact_email, c.type::text,
           c.verification_status::text, s.id is not null, s.reason, c.created_at
    from public.companies c
    left join public.account_suspensions s on s.subject_type = 'company' and s.subject_id = c.id
    where (c.name ilike _q or coalesce(c.contact_email, '') ilike _q)
  ) a(subject_type, id, name, email, detail, verification_status, suspended, suspension_reason, created_at)
  where not _only_suspended or a.suspended
  order by a.suspended desc, a.created_at desc
  limit 100;
end;
$$;


create or replace function public.get_public_agents(_id uuid default null)
returns table (
  id uuid, name text, avatar text, email text, phone text, whatsapp_number text,
  sub_role text, verification_status text, brokerage text, company_id uuid,
  company_name text, cities text[], property_types text[], active_listings integer,
  closed_deals integer, total_value numeric, created_at timestamptz
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
    and not public.is_suspended(p.id)
    and (
      p.agent_profile ->> 'verificationStatus' = 'verified'
      or coalesce(s.active, 0) > 0
    )
  order by coalesce(s.active, 0) desc, p.name;
$$;

create or replace function public.get_public_companies(_id_or_slug text default null)
returns table (
  id uuid, name text, slug text, logo text, type public.company_type,
  verification_status public.verification_status, contact_email text, contact_phone text,
  whatsapp_number text, team_size integer, active_listings integer, cities text[],
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
    and not exists (select 1 from public.account_suspensions x
                    where x.subject_type = 'company' and x.subject_id = c.id)
    and (c.verification_status = 'verified' or coalesce(s.active, 0) > 0)
  order by coalesce(s.active, 0) desc, c.name;
$$;


create table if not exists public.listing_videos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  storage_path text not null,
  file_name text,
  size_bytes bigint,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'changes_requested')),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  youtube_video_id text,
  youtube_privacy text check (youtube_privacy in ('public', 'unlisted')),
  youtube_desired_privacy text check (youtube_desired_privacy in ('public', 'unlisted')),
  youtube_error text,
  storage_deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists listing_videos_property_idx on public.listing_videos(property_id);
create index if not exists listing_videos_status_idx on public.listing_videos(status);

grant select, insert, delete on public.listing_videos to authenticated;
grant all on public.listing_videos to service_role;
alter table public.listing_videos enable row level security;

drop policy if exists "Owners view their listing videos" on public.listing_videos;
create policy "Owners view their listing videos"
on public.listing_videos for select to authenticated
using (uploaded_by = auth.uid());

drop policy if exists "Owners upload videos for their listings" on public.listing_videos;
create policy "Owners upload videos for their listings"
on public.listing_videos for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and status = 'pending'
  and review_note is null and reviewed_by is null and reviewed_at is null
  and youtube_video_id is null and youtube_privacy is null and youtube_desired_privacy is null
  and storage_deleted_at is null
  and split_part(storage_path, '/', 1) = auth.uid()::text
  and exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  and not public.is_suspended(auth.uid())
);

drop policy if exists "Owners remove unposted videos" on public.listing_videos;
create policy "Owners remove unposted videos"
on public.listing_videos for delete to authenticated
using (uploaded_by = auth.uid() and youtube_video_id is null and status <> 'approved');

create or replace function public.admin_list_videos(_status text default 'pending')
returns table (id uuid, property_id uuid, property_title text, property_slug text,
               property_status public.property_status, owner_name text, owner_verified boolean,
               storage_path text, file_name text, size_bytes bigint, status text, review_note text,
               youtube_video_id text, youtube_privacy text, youtube_desired_privacy text,
               youtube_error text, storage_deleted_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return query
  select v.id, v.property_id, pr.title, pr.slug, pr.status, p.name,
         public.can_publish_listings(pr.owner_id),
         v.storage_path, v.file_name, v.size_bytes, v.status, v.review_note,
         v.youtube_video_id, v.youtube_privacy, v.youtube_desired_privacy, v.youtube_error,
         v.storage_deleted_at, v.created_at
  from public.listing_videos v
  join public.properties pr on pr.id = v.property_id
  join public.profiles p on p.id = v.uploaded_by
  where _status is null or v.status = _status
  order by v.created_at
  limit 300;
end;
$$;

create or replace function public.admin_review_video(_id uuid, _decision text, _reason text)
returns void language plpgsql security definer set search_path = public as $$
declare
  _v public.listing_videos;
  _p public.properties;
begin
  perform public.require_admin();
  perform public.check_decision(_decision, _reason);
  select * into _v from public.listing_videos where id = _id;
  if _v.id is null then raise exception 'Not found'; end if;
  if _v.status not in ('pending') then raise exception 'This video is not waiting for review'; end if;
  select * into _p from public.properties where id = _v.property_id;

  if _decision = 'approve' then
    if _p.status <> 'active' or _p.review_status <> 'approved' then
      raise exception 'Only videos for approved, live listings can be published';
    end if;
    if not public.can_publish_listings(_p.owner_id) then
      raise exception 'The listing owner is not verified';
    end if;
  end if;

  update public.listing_videos
  set status = case _decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'changes_requested' end,
      review_note = btrim(_reason), reviewed_by = auth.uid(), reviewed_at = now(),
      youtube_desired_privacy = case when _decision = 'approve' then 'public' else null end
  where id = _id;

  perform public.log_admin_action('video.' || _decision, 'video', _id, _reason,
    jsonb_build_object('property_id', _v.property_id));
end;
$$;


create or replace function public.admin_mark_video_posted(_id uuid, _youtube_video_id text, _privacy text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  update public.listing_videos
  set youtube_video_id = _youtube_video_id, youtube_privacy = _privacy, youtube_error = null
  where id = _id and status = 'approved';
  if not found then raise exception 'Not found'; end if;
  perform public.log_admin_action('video.posted_to_youtube', 'video', _id, null,
    jsonb_build_object('youtube_video_id', _youtube_video_id, 'privacy', _privacy));
end;
$$;

create or replace function public.admin_mark_video_error(_id uuid, _error text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  update public.listing_videos set youtube_error = left(_error, 500) where id = _id;
end;
$$;


create or replace function public.listing_videos_follow_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    update public.listing_videos
    set youtube_desired_privacy = case when new.status = 'active' then 'public' else 'unlisted' end
    where property_id = new.id and status = 'approved';
  end if;
  return null;
end;
$$;

drop trigger if exists properties_videos_follow_status on public.properties;
create trigger properties_videos_follow_status
after update of status on public.properties
for each row execute function public.listing_videos_follow_status();


create or replace function public.get_public_listing_videos(_property_ids uuid[])
returns table (property_id uuid, youtube_video_id text)
language sql stable security definer set search_path = public as $$
  select v.property_id, v.youtube_video_id
  from public.listing_videos v
  join public.properties p on p.id = v.property_id
  where v.property_id = any(_property_ids)
    and p.status = 'active'
    and v.status = 'approved'
    and v.youtube_video_id is not null
    and v.youtube_privacy = 'public'
  order by v.created_at;
$$;


create table if not exists public.appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  subject_type text not null check (subject_type in
    ('listing', 'video', 'verification', 'identity_document', 'property_document', 'jv', 'suspension')),
  subject_id uuid not null,
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'accepted', 'declined')),
  admin_reply text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists appeals_one_open_per_subject
on public.appeals(subject_type, subject_id) where status = 'open';

grant select on public.appeals to authenticated;
grant all on public.appeals to service_role;
alter table public.appeals enable row level security;

drop policy if exists "Users view their appeals" on public.appeals;
create policy "Users view their appeals"
on public.appeals for select to authenticated
using (user_id = auth.uid());


create or replace function public.submit_appeal(_subject_type text, _subject_id uuid, _message text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _ok boolean := false;
  _id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '42501'; end if;

  _ok := case _subject_type
    when 'listing' then exists (select 1 from public.properties where id = _subject_id
      and owner_id = auth.uid() and review_status in ('rejected', 'changes_requested'))
    when 'video' then exists (select 1 from public.listing_videos where id = _subject_id
      and uploaded_by = auth.uid() and status in ('rejected', 'changes_requested') and storage_deleted_at is null)
    when 'verification' then
      (_subject_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid()
        and agent_profile ->> 'verificationStatus' = 'rejected'))
      or (public.is_company_admin(_subject_id) and exists (select 1 from public.companies
        where id = _subject_id and verification_status = 'rejected'))
    when 'identity_document' then exists (select 1 from public.identity_documents where id = _subject_id
      and user_id = auth.uid() and status = 'rejected')
    when 'property_document' then exists (select 1 from public.property_documents d
      join public.properties p on p.id = d.property_id
      where d.id = _subject_id and p.owner_id = auth.uid() and d.review_status = 'rejected')
    when 'jv' then exists (select 1 from public.jv_properties where id = _subject_id
      and owner_id = auth.uid() and review_status in ('rejected', 'changes_requested'))
    when 'suspension' then
      (_subject_id = auth.uid() and exists (select 1 from public.account_suspensions
        where subject_type = 'user' and subject_id = auth.uid()))
      or (public.is_company_admin(_subject_id) and exists (select 1 from public.account_suspensions
        where subject_type = 'company' and subject_id = _subject_id))
    else false end;

  if not coalesce(_ok, false) then
    raise exception 'There is nothing to appeal here';
  end if;

  insert into public.appeals(user_id, subject_type, subject_id, message)
  values (auth.uid(), _subject_type, _subject_id, btrim(_message))
  returning id into _id;
  return _id;
exception when unique_violation then
  raise exception 'You already have an open appeal for this';
end;
$$;

create or replace function public.admin_list_appeals(_status text default 'open')
returns table (id uuid, user_id uuid, user_name text, user_email text, subject_type text,
               subject_id uuid, message text, status text, admin_reply text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return query
  select a.id, a.user_id, p.name, p.email, a.subject_type, a.subject_id, a.message, a.status,
         a.admin_reply, a.created_at
  from public.appeals a join public.profiles p on p.id = a.user_id
  where _status is null or a.status = _status
  order by a.created_at
  limit 300;
end;
$$;


create or replace function public.admin_resolve_appeal(_id uuid, _accept boolean, _reply text)
returns void language plpgsql security definer set search_path = public as $$
declare
  _a public.appeals;
begin
  perform public.require_admin();
  if coalesce(btrim(_reply), '') = '' then raise exception 'A reply is required'; end if;
  select * into _a from public.appeals where id = _id and status = 'open';
  if _a.id is null then raise exception 'Appeal not found or already resolved'; end if;

  if _accept then
    case _a.subject_type
      when 'listing' then
        update public.properties set review_status = 'pending', submitted_at = now(),
          review_note = 'Reopened after appeal' where id = _a.subject_id;
      when 'video' then
        update public.listing_videos set status = 'pending', review_note = 'Reopened after appeal'
        where id = _a.subject_id;
      when 'verification' then
        update public.profiles set agent_profile = coalesce(agent_profile, '{}'::jsonb)
          || jsonb_build_object('verificationStatus', 'pending') where id = _a.subject_id;
        update public.companies set verification_status = 'pending' where id = _a.subject_id;
      when 'identity_document' then
        update public.identity_documents set status = 'pending', review_note = 'Reopened after appeal'
        where id = _a.subject_id;
      when 'property_document' then
        update public.property_documents set review_status = 'pending', review_note = 'Reopened after appeal'
        where id = _a.subject_id;
      when 'jv' then
        update public.jv_properties set review_status = 'pending', submitted_at = now(),
          review_note = 'Reopened after appeal' where id = _a.subject_id;
      when 'suspension' then
        delete from public.account_suspensions where subject_id = _a.subject_id;
    end case;
  end if;

  update public.appeals
  set status = case when _accept then 'accepted' else 'declined' end,
      admin_reply = btrim(_reply), resolved_by = auth.uid(), resolved_at = now()
  where id = _id;

  perform public.log_admin_action(case when _accept then 'appeal.accepted' else 'appeal.declined' end,
    'appeal', _id, _reply, jsonb_build_object('subject_type', _a.subject_type, 'subject_id', _a.subject_id));
end;
$$;


create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 255),
  subject text check (subject is null or char_length(subject) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'open' check (status in ('open', 'closed')),
  admin_note text,
  closed_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

grant insert on public.support_tickets to anon, authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;

drop policy if exists "Anyone can open a support ticket" on public.support_tickets;
create policy "Anyone can open a support ticket"
on public.support_tickets for insert to anon, authenticated
with check (
  (user_id is null or user_id = auth.uid())
  and status = 'open' and admin_note is null and closed_by is null and closed_at is null
);

create or replace function public.admin_list_tickets(_status text default 'open')
returns table (id uuid, user_id uuid, name text, email text, subject text, message text,
               status text, admin_note text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return query
  select t.id, t.user_id, t.name, t.email, t.subject, t.message, t.status, t.admin_note, t.created_at
  from public.support_tickets t
  where _status is null or t.status = _status
  order by t.created_at
  limit 300;
end;
$$;

create or replace function public.admin_close_ticket(_id uuid, _note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if coalesce(btrim(_note), '') = '' then raise exception 'A note is required'; end if;
  update public.support_tickets
  set status = 'closed', admin_note = btrim(_note), closed_by = auth.uid(), closed_at = now()
  where id = _id and status = 'open';
  if not found then raise exception 'Ticket not found or already closed'; end if;
  perform public.log_admin_action('support.closed', 'support_ticket', _id, _note);
end;
$$;


alter table public.jv_properties
  add column if not exists review_status text not null default 'none',
  add column if not exists review_note text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz;

do $$ begin
  alter table public.jv_properties add constraint jv_properties_review_status_check
    check (review_status in ('none', 'pending', 'approved', 'rejected', 'changes_requested'));
exception when duplicate_object then null; end $$;

update public.jv_properties set review_status = 'approved', reviewed_at = now()
where status = 'active' and review_status = 'none';

create or replace function public.guard_jv_write()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_key_changed boolean;
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if public.is_suspended(auth.uid()) then
    raise exception 'Your account is suspended' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.owner_id := auth.uid();
    new.total_investors := 0;
    new.review_status := 'none'; new.review_note := null;
    new.submitted_at := null; new.reviewed_at := null;
    if new.status = 'active' then raise exception 'JV listings go live only after admin approval'; end if;
    return new;
  end if;

  new.id := old.id;
  new.owner_id := old.owner_id;
  new.total_investors := old.total_investors;
  new.review_status := old.review_status; new.review_note := old.review_note;
  new.submitted_at := old.submitted_at; new.reviewed_at := old.reviewed_at;

  v_key_changed :=
       new.price is distinct from old.price
    or new.land_value is distinct from old.land_value
    or new.minimum_investment is distinct from old.minimum_investment
    or new.roi is distinct from old.roi
    or new.sharing_formula is distinct from old.sharing_formula
    or new.facilitator_fee is distinct from old.facilitator_fee
    or new.address is distinct from old.address
    or new.city is distinct from old.city
    or new.state is distinct from old.state;

  if v_key_changed and old.review_status = 'approved' then
    if old.status = 'active' then
      new.status := 'inactive';
      new.review_status := 'pending';
      new.submitted_at := now();
      new.review_note := 'Key details changed - waiting for re-approval';
    else
      new.review_status := 'none';
    end if;
  end if;

  if new.status = 'active' and old.status <> 'active' then
    if new.review_status <> 'approved' then
      raise exception 'JV listings go live only after admin approval';
    end if;
    if not public.can_publish_listings(auth.uid()) then
      raise exception 'Get verified before publishing';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists jv_properties_guard_write on public.jv_properties;
create trigger jv_properties_guard_write
before insert or update on public.jv_properties
for each row execute function public.guard_jv_write();

drop policy if exists "JV owners can view their properties" on public.jv_properties;
create policy "JV owners can view their properties"
on public.jv_properties for select to authenticated
using (owner_id = auth.uid());

create or replace function public.submit_jv_for_review(_jv_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  _j public.jv_properties;
begin
  select * into _j from public.jv_properties where id = _jv_id and owner_id = auth.uid();
  if _j.id is null then raise exception 'JV listing not found'; end if;
  if not public.can_publish_listings(auth.uid()) then raise exception 'Get verified before submitting'; end if;
  if _j.status not in ('draft', 'inactive') then raise exception 'Only drafts or hidden JV listings can be submitted'; end if;
  if _j.review_status = 'approved' then
    update public.jv_properties set status = 'active' where id = _j.id;
    return 'active';
  end if;
  update public.jv_properties set review_status = 'pending', submitted_at = now(), review_note = null
  where id = _j.id;
  return 'pending';
end;
$$;

create or replace function public.admin_list_jv(_review_status text default 'pending')
returns table (id uuid, slug text, title text, status public.property_status, review_status text,
               review_note text, city text, state text, land_value numeric, roi numeric,
               owner_name text, owner_verified boolean, submitted_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  perform public.require_admin();
  return query
  select j.id, j.slug, j.title, j.status, j.review_status, j.review_note, j.city, j.state,
         j.land_value, j.roi, p.name, public.can_publish_listings(j.owner_id), j.submitted_at, j.created_at
  from public.jv_properties j join public.profiles p on p.id = j.owner_id
  where _review_status is null or j.review_status = _review_status
  order by coalesce(j.submitted_at, j.created_at) desc
  limit 300;
end;
$$;

create or replace function public.admin_review_jv(_jv_id uuid, _decision text, _reason text)
returns void language plpgsql security definer set search_path = public as $$
declare
  _j public.jv_properties;
begin
  perform public.require_admin();
  perform public.check_decision(_decision, _reason);
  select * into _j from public.jv_properties where id = _jv_id;
  if _j.id is null then raise exception 'Not found'; end if;
  if _j.review_status <> 'pending' then raise exception 'This JV listing is not waiting for review'; end if;
  if _decision = 'approve' then
    if not public.can_publish_listings(_j.owner_id) then
      raise exception 'Only verified, active accounts can have live JV listings';
    end if;
    update public.jv_properties set status = 'active', review_status = 'approved',
      review_note = btrim(_reason), reviewed_at = now() where id = _j.id;
  else
    update public.jv_properties
    set review_status = case _decision when 'reject' then 'rejected' else 'changes_requested' end,
        review_note = btrim(_reason), reviewed_at = now()
    where id = _j.id;
  end if;
  perform public.log_admin_action('jv.' || _decision, 'jv', _j.id, _reason);
end;
$$;

create or replace function public.admin_unpublish_jv(_jv_id uuid, _reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.require_admin();
  if coalesce(btrim(_reason), '') = '' then raise exception 'A reason is required'; end if;
  update public.jv_properties set status = 'inactive', review_status = 'rejected',
    review_note = btrim(_reason), reviewed_at = now()
  where id = _jv_id and status = 'active';
  if not found then raise exception 'JV listing is not live'; end if;
  perform public.log_admin_action('jv.taken_down', 'jv', _jv_id, _reason);
end;
$$;


drop policy if exists "Company members view company listing enquiries" on public.inquiries;
create policy "Company members view company listing enquiries"
on public.inquiries for select to authenticated
using (exists (
  select 1 from public.properties p
  where p.id = inquiries.listing_id and p.owner_type = 'company'
    and public.shares_company_with(p.owner_id)
));

drop policy if exists "Company members view company enquiry messages" on public.inquiry_messages;
create policy "Company members view company enquiry messages"
on public.inquiry_messages for select to authenticated
using (exists (
  select 1 from public.inquiries i
  join public.properties p on p.id = i.listing_id
  where i.id = inquiry_messages.inquiry_id and p.owner_type = 'company'
    and public.shares_company_with(p.owner_id)
));

create or replace function public.get_company_enquiries(_company_id uuid)
returns table (
  id uuid, listing_id uuid, listing_title text, listing_slug text, listing_image text,
  viewer_id uuid, viewer_name text, viewer_avatar text, contact_phone text,
  agent_id uuid, agent_name text, agent_avatar text, stage text,
  status public.inquiry_status, last_message text, last_sender_type text,
  last_event_at timestamptz, created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_company_member(_company_id) then
    raise exception 'Company members only' using errcode = '42501';
  end if;
  return query
  select i.id, i.listing_id, pr.title, pr.slug,
    (select pi.url from public.property_images pi where pi.property_id = pr.id order by pi.sort_order limit 1),
    i.viewer_id, coalesce(i.contact_name, v.name), v.avatar,
    case when i.assigned_cs_agent = auth.uid() then i.contact_phone end,
    i.assigned_cs_agent, a.name, a.avatar, i.stage, i.status,
    lm.content, lm.sender_type, coalesce(lm.sent_at, i.created_at), i.created_at
  from public.inquiries i
  join public.properties pr on pr.id = i.listing_id
  join public.company_members m on m.user_id = pr.owner_id and m.company_id = _company_id
  join public.profiles v on v.id = i.viewer_id
  left join public.profiles a on a.id = i.assigned_cs_agent
  left join lateral (
    select im.content, im.sender_type, im.sent_at from public.inquiry_messages im
    where im.inquiry_id = i.id order by im.sent_at desc limit 1
  ) lm on true
  where pr.owner_type = 'company'
  order by coalesce(lm.sent_at, i.created_at) desc;
end;
$$;


insert into storage.buckets (id, name, public)
values ('identity-documents', 'identity-documents', false),
       ('listing-videos', 'listing-videos', false)
on conflict (id) do nothing;

drop policy if exists "Owners manage their ID and video files" on storage.objects;
create policy "Owners manage their ID and video files"
on storage.objects for all to authenticated
using (
  bucket_id in ('identity-documents', 'listing-videos')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('identity-documents', 'listing-videos')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Admins read ID and video files" on storage.objects;
create policy "Admins read ID and video files"
on storage.objects for select to authenticated
using (
  bucket_id in ('identity-documents', 'listing-videos')
  and public.has_role(auth.uid(), 'admin')
);


do $$
declare
  f text;
begin
  foreach f in array array[
    'public.is_suspended(uuid)',
    'public.submit_listing_for_review(uuid)',
    'public.get_my_verification_feedback()',
    'public.admin_set_verification(text, uuid, text, text)',
    'public.admin_list_identity_documents(text)',
    'public.admin_review_identity_document(uuid, text, text)',
    'public.admin_listing_documents(uuid)',
    'public.admin_review_property_document(uuid, text, text)',
    'public.admin_list_properties(public.property_status, text)',
    'public.admin_review_listing(uuid, text, text)',
    'public.admin_unpublish_property(uuid, text)',
    'public.admin_suspend(text, uuid, text)',
    'public.admin_unsuspend(text, uuid, text)',
    'public.admin_search_accounts(text, boolean)',
    'public.admin_list_videos(text)',
    'public.admin_review_video(uuid, text, text)',
    'public.admin_mark_video_posted(uuid, text, text)',
    'public.admin_mark_video_error(uuid, text)',
    'public.submit_appeal(text, uuid, text)',
    'public.admin_list_appeals(text)',
    'public.admin_resolve_appeal(uuid, boolean, text)',
    'public.admin_list_tickets(text)',
    'public.admin_close_ticket(uuid, text)',
    'public.submit_jv_for_review(uuid)',
    'public.admin_list_jv(text)',
    'public.admin_review_jv(uuid, text, text)',
    'public.admin_unpublish_jv(uuid, text)',
    'public.get_company_enquiries(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

revoke all on function public.check_decision(text, text) from public, anon;
grant execute on function public.check_decision(text, text) to authenticated;
grant execute on function public.get_public_listing_videos(uuid[]) to anon, authenticated;
grant execute on function public.get_public_agents(uuid) to anon, authenticated;
grant execute on function public.get_public_companies(text) to anon, authenticated;
