-- ============================================================
-- 010 ADMIN ROLE, VERIFICATION QUEUE, PUBLISHING
-- Run after 009.
--
-- * Admin is a separate role table (user_roles), never a column on
--   profiles, so it can't be self-granted. Admins are added only from
--   the Supabase SQL editor:
--     insert into public.user_roles(user_id, role)
--     values ('<user uuid>', 'admin');
-- * Every admin action is a security-definer function that checks
--   has_role(auth.uid(), 'admin') itself.
-- * Agents can ask for verification (unverified/rejected -> pending).
-- * Publishing stays gated by can_publish_listings (006 guard); owners
--   publish/unpublish with a normal update on their own listing.
-- ============================================================

do $$ begin
  create type public.app_role as enum ('admin', 'moderator');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

drop policy if exists "Users can view their own roles" on public.user_roles;
create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid());
-- No insert/update/delete policies: roles are managed from the SQL editor.

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and public.has_role(auth.uid(), 'admin');
$$;

create or replace function public.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
end;
$$;

-- Verification review history.
create table if not exists public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('agent', 'company')),
  subject_id uuid not null,
  status public.verification_status not null,
  note text check (note is null or char_length(note) <= 500),
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select on public.verification_reviews to authenticated;
grant all on public.verification_reviews to service_role;
alter table public.verification_reviews enable row level security;

drop policy if exists "Admins can view reviews" on public.verification_reviews;
create policy "Admins can view reviews"
on public.verification_reviews for select to authenticated
using (public.has_role(auth.uid(), 'admin'));
-- Rows are written only by the admin functions below.

-- ---------- agent asks for verification ----------
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

-- ---------- admin: queue ----------
create or replace function public.admin_verification_queue(_status public.verification_status default 'pending')
returns table (
  subject_type text,
  subject_id uuid,
  name text,
  email text,
  phone text,
  detail text,
  logo text,
  documents jsonb,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_admin();

  return query
  select 'agent'::text, p.id, p.name, p.email, p.phone,
         coalesce(p.agent_profile ->> 'subRole', 'agent'),
         coalesce(p.agent_profile ->> 'logo', p.avatar),
         coalesce(p.agent_profile -> 'verificationDocs', '{}'::jsonb),
         coalesce(p.agent_profile ->> 'verificationStatus', 'unverified'),
         p.created_at
  from public.profiles p
  where 'agent'::public.user_role = any(p.roles)
    and coalesce(p.agent_profile ->> 'verificationStatus', 'unverified') = _status::text
  union all
  select 'company'::text, c.id, c.name, c.contact_email, c.contact_phone,
         c.type::text, c.logo, c.onboarding_docs, c.verification_status::text,
         c.created_at
  from public.companies c
  where c.verification_status = _status
  order by 10;
end;
$$;

-- ---------- admin: decide ----------
create or replace function public.admin_set_verification(
  _subject_type text,
  _subject_id uuid,
  _status public.verification_status,
  _note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin();

  if _status not in ('verified', 'rejected', 'pending') then
    raise exception 'Invalid status';
  end if;

  if _subject_type = 'agent' then
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

  insert into public.verification_reviews(subject_type, subject_id, status, note, reviewed_by)
  values (_subject_type, _subject_id, _status, nullif(btrim(_note), ''), auth.uid());
end;
$$;

-- ---------- admin: listings moderation ----------
create or replace function public.admin_list_properties(_status public.property_status default null)
returns table (
  id uuid,
  slug text,
  title text,
  status public.property_status,
  city text,
  state text,
  price numeric,
  owner_id uuid,
  owner_name text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_admin();
  return query
  select pr.id, pr.slug, pr.title, pr.status, pr.city, pr.state, pr.price,
         pr.owner_id, p.name, pr.created_at
  from public.properties pr
  join public.profiles p on p.id = pr.owner_id
  where _status is null or pr.status = _status
  order by pr.created_at desc
  limit 200;
end;
$$;

-- Admins can take a listing down (back to inactive), never publish it.
create or replace function public.admin_unpublish_property(_property_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin();
  update public.properties set status = 'inactive'
  where id = _property_id and status = 'active';
  if not found then
    raise exception 'Listing is not live';
  end if;
end;
$$;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.require_admin() from public, anon;
revoke all on function public.request_agent_verification() from public, anon;
revoke all on function public.admin_verification_queue(public.verification_status) from public, anon;
revoke all on function public.admin_set_verification(text, uuid, public.verification_status, text) from public, anon;
revoke all on function public.admin_list_properties(public.property_status) from public, anon;
revoke all on function public.admin_unpublish_property(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.require_admin() to authenticated;
grant execute on function public.request_agent_verification() to authenticated;
grant execute on function public.admin_verification_queue(public.verification_status) to authenticated;
grant execute on function public.admin_set_verification(text, uuid, public.verification_status, text) to authenticated;
grant execute on function public.admin_list_properties(public.property_status) to authenticated;
grant execute on function public.admin_unpublish_property(uuid) to authenticated;

-- ---------- admins can open private verification files ----------
drop policy if exists "Admins can read verification documents" on storage.objects;
create policy "Admins can read verification documents"
on storage.objects for select to authenticated
using (
  bucket_id in ('company-documents', 'property-documents')
  and public.has_role(auth.uid(), 'admin')
);
