create type company_reg_status as enum ('draft', 'docs_submitted', 'verified', 'rejected');

create table public.company_registrations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  status          company_reg_status not null default 'draft',
  company_name    text,
  company_type    text,
  contact_email   text,
  contact_phone   text,
  whatsapp_number text,
  logo_url        text,
  cac_cert_path   text,
  rejection_reason text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- At most one open (draft or under-review) registration per user.
create unique index one_open_company_registration
  on public.company_registrations (user_id)
  where status in ('draft', 'docs_submitted');

alter table public.company_registrations enable row level security;

create policy "own registrations read" on public.company_registrations
  for select using (user_id = auth.uid());

create policy "admins read registrations" on public.company_registrations
  for select using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin'));

-- Owners can create and edit only while the row is a draft. The status
-- column can't be changed from the client, because the check requires 'draft'.
create policy "own draft insert" on public.company_registrations
  for insert with check (user_id = auth.uid() and status = 'draft');

create policy "own draft update" on public.company_registrations
  for update using (user_id = auth.uid() and status = 'draft')
  with check (user_id = auth.uid() and status = 'draft');

-- Submit: the only way a draft leaves 'draft'.
create or replace function public.submit_company_registration(
  p_cac_path text,
  p_logo_url text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Storage paths are "<userId>/<uuid>-<name>", and the user may only reference their own folder.
  if split_part(p_cac_path, '/', 1) <> auth.uid()::text then
    raise exception 'Document path does not belong to this user';
  end if;

  update public.company_registrations r
     set status        = 'docs_submitted',
         cac_cert_path = p_cac_path,
         logo_url      = coalesce(p_logo_url, r.logo_url),
         updated_at    = now()
   where r.user_id = auth.uid()
     and r.status = 'draft'
     and r.company_name is not null
     and r.company_type is not null
     and r.contact_email is not null
  returning r.id into v_id;

  if v_id is null then
    raise exception 'No complete draft to submit';
  end if;

  return v_id;
end $$;

-- Admin approval: creates the company and switches the role.
create or replace function public.approve_company_registration(p_registration_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  r public.company_registrations;
  v_company_id uuid;
begin
  if not (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin')) then
    raise exception 'Admins only';
  end if;

  select * into r
    from public.company_registrations
   where id = p_registration_id and status = 'docs_submitted'
   for update;

  if not found then
    raise exception 'Registration is not awaiting review';
  end if;

  insert into public.companies (
    name, slug, type, contact_email, contact_phone, whatsapp_number,
    logo, cac_certificate_url, verification_status
  ) values (
    r.company_name,
    -- Suffix keeps slugs unique when two companies share a name.
    lower(regexp_replace(r.company_name, '\s+', '-', 'g')) || '-' || left(r.id::text, 6),
    r.company_type, r.contact_email, r.contact_phone, r.whatsapp_number,
    r.logo_url, r.cac_cert_path, 'verified'
  )
  returning id into v_company_id;

  update public.profiles p
     set company_id   = v_company_id,
         company_role = 'admin',
         roles        = (select array_agg(distinct x) from unnest(p.roles || 'company'::user_role) x),
         active_role  = 'company'
   where p.id = r.user_id;

  update public.company_registrations
     set status = 'verified', updated_at = now()
   where id = r.id;

  return v_company_id;
end $$;

revoke all on function public.submit_company_registration(text, text) from public;
revoke all on function public.approve_company_registration(uuid) from public;
grant execute on function public.submit_company_registration(text, text) to authenticated;
grant execute on function public.approve_company_registration(uuid) to authenticated;