-- ============================================================
-- 024 COMPANY REGISTRATION INTEGRITY
-- Builds on deployed migrations 022 and 023. Do not edit/replay them.
-- Registration writes remain RPC-only; private CAC files remain in the
-- private company-documents bucket.
-- ============================================================

begin;

-- Existing CAC hashes were supplied by browsers before this migration. Keep
-- them untrusted until the Edge Function hashes the actual private object.
alter table public.company_registrations
  add column if not exists cac_sha256_verified_at timestamptz;

-- RLS helper that exposes only the caller's own platform-admin status.
-- The parameterless signature avoids turning the internal 023 helper into a
-- user-id enumeration endpoint.
create or replace function public.is_current_active_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and exists (
       select 1
       from public.user_roles ur
       join public.profiles p on p.id = ur.user_id
       where ur.user_id = auth.uid()
         and ur.role::text in ('admin', 'super_admin')
         and coalesce(p.admin_status, 'active') = 'active'
     );
$$;

revoke all on function public.is_current_active_platform_admin()
  from public, anon, service_role;
grant execute on function public.is_current_active_platform_admin()
  to authenticated;

-- Registration rows may be read by the applicant or an active platform
-- administrator. All writes go through the RPCs below.
drop policy if exists "own registrations read" on public.company_registrations;
drop policy if exists "admins read registrations" on public.company_registrations;
drop policy if exists "own draft insert" on public.company_registrations;
drop policy if exists "own draft update" on public.company_registrations;
drop policy if exists "Applicants read their company registration" on public.company_registrations;
drop policy if exists "Active platform admins read company registrations" on public.company_registrations;

alter table public.company_registrations enable row level security;
revoke all on table public.company_registrations from public, anon, authenticated;
grant select on table public.company_registrations to authenticated;

create policy "Applicants read their company registration"
on public.company_registrations
for select to authenticated
using (user_id = (select auth.uid()));

create policy "Active platform admins read company registrations"
on public.company_registrations
for select to authenticated
using (public.is_current_active_platform_admin());

-- Draft save and resume. A rejected request is immutable; saving after a
-- rejection creates a fresh draft row. The partial unique index from 020
-- serializes draft/submitted rows for each applicant.
create or replace function public.save_company_registration_draft(
  p_company_name text,
  p_company_type text,
  p_contact_email text,
  p_contact_phone text,
  p_whatsapp_number text,
  p_applicant_name text,
  p_applicant_phone text,
  p_applicant_email text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_profile
  from public.profiles p
  where p.id = v_user_id
  for update;
  if not found then raise exception 'User profile not found'; end if;

  if v_profile.company_id is not null
     or v_profile.company_role is not null
     or 'company'::public.user_role = any(coalesce(v_profile.roles, '{}'::public.user_role[]))
     or exists (select 1 from public.company_members m where m.user_id = v_user_id) then
    raise exception 'This account already has a company membership or role'
      using errcode = '42501';
  end if;

  if nullif(btrim(p_company_name), '') is null
     or nullif(btrim(p_contact_email), '') is null
     or nullif(btrim(p_applicant_name), '') is null
     or nullif(btrim(p_applicant_email), '') is null then
    raise exception 'Company and applicant details are required';
  end if;
  if lower(btrim(p_applicant_email)) <> lower(v_profile.email) then
    raise exception 'Applicant email must match the signed-in account'
      using errcode = '42501';
  end if;
  if p_company_type is null then
    raise exception 'Company type is required';
  end if;
  perform p_company_type::public.company_type;

  insert into public.company_registrations (
    user_id, status, company_name, company_type, contact_email,
    contact_phone, whatsapp_number, applicant_name, applicant_email,
    applicant_phone, applicant_authorised, authorised_at,
    rejection_reason, rejection_scope, updated_at
  ) values (
    v_user_id,
    'draft'::public.company_reg_status,
    btrim(p_company_name),
    p_company_type,
    lower(btrim(p_contact_email)),
    nullif(btrim(p_contact_phone), ''),
    nullif(btrim(p_whatsapp_number), ''),
    btrim(p_applicant_name),
    lower(v_profile.email),
    nullif(btrim(p_applicant_phone), ''),
    false,
    null,
    null,
    null,
    now()
  )
  on conflict (user_id)
    where status in (
      'draft'::public.company_reg_status,
      'docs_submitted'::public.company_reg_status
    )
  do update set
    company_name = excluded.company_name,
    company_type = excluded.company_type,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    whatsapp_number = excluded.whatsapp_number,
    applicant_name = excluded.applicant_name,
    applicant_email = excluded.applicant_email,
    applicant_phone = excluded.applicant_phone,
    applicant_authorised = false,
    authorised_at = null,
    rejection_reason = null,
    rejection_scope = null,
    updated_at = now()
  where public.company_registrations.status = 'draft'::public.company_reg_status
  returning id into v_id;

  if v_id is null then
    raise exception 'A submitted application cannot be edited';
  end if;
  return v_id;
end;
$$;

-- Remove the browser-callable submit RPC. The Edge Function checks the
-- applicant session, downloads the object using that user's RLS-scoped client,
-- computes SHA-256 from the stored bytes, and calls the service-only RPC.
drop function if exists public.submit_company_registration(text, text, boolean, text);

create or replace function public.finalize_company_registration(
  p_user_id uuid,
  p_cac_path text,
  p_logo_url text,
  p_authorised boolean,
  p_cac_hash text,
  p_reuse_existing boolean,
  p_last_rejected_cac_path text,
  p_last_rejected_cac_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_registration public.company_registrations;
  v_previous public.company_registrations;
  v_cac_path text := nullif(btrim(p_cac_path), '');
  v_cac_hash text := nullif(lower(btrim(p_cac_hash)), '');
  v_last_rejected_hash text := nullif(lower(btrim(p_last_rejected_cac_hash)), '');
  v_cac_uploaded_at timestamptz;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Trusted CAC verification is required' using errcode = '42501';
  end if;
  if p_user_id is null then raise exception 'Applicant is required'; end if;
  if p_authorised is not true then
    raise exception 'Applicant authorisation is required';
  end if;
  if v_cac_path is null
     or v_cac_path !~ (
       '^' || p_user_id::text ||
       '/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-[a-z0-9._-]{0,80}$'
     )
     or v_cac_hash is null
     or v_cac_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'CAC document path or server-computed hash is invalid';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'company-documents'
      and o.name = v_cac_path
  ) then
    raise exception 'CAC document is missing or no longer available';
  end if;

  select * into v_profile
  from public.profiles p
  where p.id = p_user_id
  for update;
  if not found then raise exception 'User profile not found'; end if;
  if v_profile.company_id is not null
     or v_profile.company_role is not null
     or 'company'::public.user_role = any(coalesce(v_profile.roles, '{}'::public.user_role[]))
     or exists (select 1 from public.company_members m where m.user_id = p_user_id) then
    raise exception 'This account already has a company membership or role'
      using errcode = '42501';
  end if;

  select * into v_registration
  from public.company_registrations r
  where r.user_id = p_user_id
    and r.status = 'draft'::public.company_reg_status
  for update;
  if not found then
    raise exception 'No editable draft is available to submit';
  end if;
  if nullif(btrim(v_registration.company_name), '') is null
     or nullif(btrim(v_registration.company_type), '') is null
     or nullif(btrim(v_registration.contact_email), '') is null
     or nullif(btrim(v_registration.applicant_name), '') is null then
    raise exception 'Complete all required company and applicant details before submitting';
  end if;

  select * into v_previous
  from public.company_registrations r
  where r.user_id = p_user_id
    and r.status = 'rejected'::public.company_reg_status
  order by r.updated_at desc, r.id
  limit 1;

  if coalesce(p_reuse_existing, false) then
    if not found
       or v_previous.rejection_scope is distinct from 'details'
       or v_previous.cac_cert_path is distinct from v_cac_path then
      raise exception 'Only the latest details-rejected CAC may be reused';
    end if;
  elsif v_previous.id is not null
     and v_previous.rejection_scope = 'cac_document' then
    select o.created_at into v_cac_uploaded_at
    from storage.objects o
    where o.bucket_id = 'company-documents'
      and o.name = v_cac_path;
    if v_cac_uploaded_at is null
       or v_cac_uploaded_at <= v_previous.updated_at
       or p_last_rejected_cac_path is distinct from v_previous.cac_cert_path
       or v_last_rejected_hash is null
       or v_last_rejected_hash !~ '^[0-9a-f]{64}$'
       or v_cac_hash = v_last_rejected_hash then
      raise exception 'A CAC-rejected application requires a newly uploaded, different certificate';
    end if;
  end if;

  if p_logo_url is not null
     and position(
       '/storage/v1/object/public/avatars/' || p_user_id::text || '/'
       in p_logo_url
     ) = 0 then
    raise exception 'Company logo must belong to the signed-in user';
  end if;

  update public.company_registrations r
  set status = 'docs_submitted'::public.company_reg_status,
      cac_cert_path = v_cac_path,
      cac_sha256 = v_cac_hash,
      cac_sha256_verified_at = now(),
      logo_url = coalesce(p_logo_url, r.logo_url),
      applicant_authorised = true,
      authorised_at = now(),
      rejection_reason = null,
      rejection_scope = null,
      updated_at = now()
  where r.id = v_registration.id
    and r.user_id = p_user_id
    and r.status = 'draft'::public.company_reg_status
  returning r.* into v_registration;

  if not found then
    raise exception 'Application changed before submission; reload and try again';
  end if;
  return v_registration.id;
end;
$$;

-- Rehash legacy submitted rows without changing their application details or
-- status. The caller is still verified by the Edge Function before this RPC.
create or replace function public.record_company_registration_cac_hash(
  p_user_id uuid,
  p_registration_id uuid,
  p_cac_path text,
  p_cac_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_hash text;
  v_verified_at timestamptz;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Trusted CAC verification is required' using errcode = '42501';
  end if;
  if p_user_id is null
     or p_cac_path !~ (
       '^' || p_user_id::text ||
       '/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-[a-z0-9._-]{0,80}$'
     )
     or p_cac_hash !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'CAC document path or server-computed hash is invalid';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'company-documents'
      and o.name = p_cac_path
  ) then
    raise exception 'CAC document is missing or no longer available';
  end if;

  select r.cac_sha256, r.cac_sha256_verified_at
  into v_current_hash, v_verified_at
  from public.company_registrations r
  where r.id = p_registration_id
    and r.user_id = p_user_id
    and r.status = 'docs_submitted'::public.company_reg_status
    and r.cac_cert_path = p_cac_path
  for update;
  if not found then
    raise exception 'Submitted CAC reference changed or is not owned by this applicant';
  end if;
  if v_verified_at is not null then
    if v_current_hash is distinct from lower(p_cac_hash) then
      raise exception 'Trusted CAC hash does not match the immutable submitted document';
    end if;
    return;
  end if;

  update public.company_registrations r
  set cac_sha256 = lower(p_cac_hash),
      cac_sha256_verified_at = now()
  where r.id = p_registration_id
    and r.user_id = p_user_id
    and r.status = 'docs_submitted'::public.company_reg_status
    and r.cac_cert_path = p_cac_path;
  if not found then
    raise exception 'Trusted CAC hash does not match the immutable submitted document';
  end if;
end;
$$;

-- The approval workflow from 023 remains the sole company-creation route;
-- also verify the private CAC object still exists when it is reviewed.
create or replace function public.approve_company_registration(p_registration_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.company_registrations;
  v_profile public.profiles;
  v_company_id uuid;
  v_cac_object_created_at timestamptz;
begin
  if not public.is_active_platform_admin(auth.uid()) then
    raise exception 'Active platform admins only' using errcode = '42501';
  end if;

  select * into r
  from public.company_registrations
  where id = p_registration_id
    and status = 'docs_submitted'::public.company_reg_status
  for update;
  if not found then raise exception 'Registration is not awaiting review'; end if;
  if r.applicant_authorised is not true
     or r.authorised_at is null
     or r.cac_cert_path is null
     or r.cac_sha256 is null
     or r.cac_sha256 !~ '^[0-9a-fA-F]{64}$'
     or r.cac_sha256_verified_at is null
     or r.cac_cert_path !~ (
       '^' || r.user_id::text ||
       '/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-[a-z0-9._-]{0,80}$'
     )
     then
    raise exception 'Required applicant authorisation or CAC document is missing or invalid';
  end if;

  -- Hold a row lock until approval commits so a concurrent Storage delete
  -- cannot remove the reviewed object during this transaction.
  select o.created_at into v_cac_object_created_at
  from storage.objects o
  where o.bucket_id = 'company-documents'
    and o.name = r.cac_cert_path
  for key share;
  if v_cac_object_created_at is null then
    raise exception 'Required applicant authorisation or CAC document is missing or invalid';
  end if;

  select * into v_profile
  from public.profiles
  where id = r.user_id
  for update;
  if v_profile.id is null
     or v_profile.company_id is not null
     or v_profile.company_role is not null
     or 'company'::public.user_role = any(coalesce(v_profile.roles, '{}'::public.user_role[]))
     or exists (select 1 from public.company_members m where m.user_id = r.user_id) then
    raise exception 'Applicant already has company membership or a company role';
  end if;

  insert into public.companies (
    name, slug, type, contact_email, contact_phone, whatsapp_number, logo,
    onboarding_docs, verification_status, approval_registration_id
  ) values (
    r.company_name,
    lower(regexp_replace(r.company_name, '\s+', '-', 'g')) || '-' || left(r.id::text, 6),
    r.company_type::public.company_type,
    r.contact_email,
    r.contact_phone,
    r.whatsapp_number,
    r.logo_url,
    jsonb_build_object('cacCertificateUrl', r.cac_cert_path),
    'verified'::public.verification_status,
    r.id
  )
  returning id into v_company_id;

  insert into public.company_members (company_id, user_id, role, permissions)
  values (
    v_company_id,
    r.user_id,
    'admin'::public.company_member_role,
    '[]'::jsonb
  );

  update public.profiles p
  set company_id = v_company_id,
      company_role = 'admin'::public.company_member_role,
      roles = array(
        select distinct role_value
        from unnest(
          coalesce(p.roles, array['viewer'::public.user_role])
          || array['company'::public.user_role]
        ) as role_value
      ),
      active_role = 'company'::public.user_role
  where p.id = r.user_id;

  update public.company_registrations
  set status = 'verified'::public.company_reg_status,
      updated_at = now()
  where id = r.id;
  return v_company_id;
end;
$$;

create or replace function public.reject_company_registration(
  p_registration_id uuid,
  p_scope text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_active_platform_admin(auth.uid()) then
    raise exception 'Active platform admins only' using errcode = '42501';
  end if;
  if p_scope is null
     or p_scope not in ('cac_document', 'details', 'other')
     or nullif(btrim(p_reason), '') is null
     or char_length(btrim(p_reason)) > 1000 then
    raise exception 'A valid rejection scope and reason are required';
  end if;

  update public.company_registrations
  set status = 'rejected'::public.company_reg_status,
      rejection_scope = p_scope,
      rejection_reason = btrim(p_reason),
      updated_at = now()
  where id = p_registration_id
    and status = 'docs_submitted'::public.company_reg_status;
  if not found then raise exception 'Registration is not awaiting review'; end if;
end;
$$;

revoke all on function public.save_company_registration_draft(text, text, text, text, text, text, text, text)
  from public, anon, service_role;
revoke all on function public.finalize_company_registration(uuid, text, text, boolean, text, boolean, text, text)
  from public, anon, authenticated;
revoke all on function public.record_company_registration_cac_hash(uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.approve_company_registration(uuid)
  from public, anon, service_role;
revoke all on function public.reject_company_registration(uuid, text, text)
  from public, anon, service_role;
grant execute on function public.save_company_registration_draft(text, text, text, text, text, text, text, text)
  to authenticated;
grant execute on function public.finalize_company_registration(uuid, text, text, boolean, text, boolean, text, text)
  to service_role;
grant execute on function public.record_company_registration_cac_hash(uuid, uuid, text, text)
  to service_role;
grant execute on function public.approve_company_registration(uuid)
  to authenticated;
grant execute on function public.reject_company_registration(uuid, text, text)
  to authenticated;

-- Keep the applicant's private read policy, but ensure company documents are
-- never writable/deletable once submitted or approved. Unrelated buckets retain
-- their current owner update/delete behaviour.
drop policy if exists "Public read for public media buckets" on storage.objects;
create policy "Public read for public media buckets"
on storage.objects for select to anon, authenticated
using (bucket_id in ('property-images', 'avatars'));

drop policy if exists "Owners read their private files" on storage.objects;
create policy "Owners read their private files"
on storage.objects for select to authenticated
using (
  bucket_id in ('property-documents', 'company-documents')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users upload into their own folder" on storage.objects;
create policy "Users upload into their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('property-images', 'property-documents', 'company-documents', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (
    bucket_id <> 'company-documents'
    or name ~ (
      '^' || (select auth.uid())::text ||
      '/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-[a-z0-9._-]{0,80}$'
    )
  )
);

drop policy if exists "Users update their own files" on storage.objects;
create policy "Users update their own files"
on storage.objects for update to authenticated
using (
  bucket_id in ('property-images', 'property-documents', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('property-images', 'property-documents', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users delete their own files" on storage.objects;
create policy "Users delete their own files"
on storage.objects for delete to authenticated
using (
  bucket_id in ('property-images', 'property-documents', 'avatars')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Admins can read verification documents" on storage.objects;
drop policy if exists "Admins read company registration documents" on storage.objects;
create policy "Active platform admins read company registration documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'company-documents'
  and public.is_current_active_platform_admin()
);

-- Preserve the property-document review access that shared the legacy admin
-- policy, while applying the same active-admin check.
create policy "Active platform admins read property verification documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'property-documents'
  and public.is_current_active_platform_admin()
);

-- Company CAC files cannot be deleted through authenticated Storage requests.
-- This also closes the race where a delete begins while submission/approval
-- is attaching the object to a protected registration row.
drop policy if exists "Applicants delete unsubmitted company documents" on storage.objects;

update storage.buckets
set public = false
where id = 'company-documents';

commit;
