-- ============================================================
-- 007 PUBLIC LISTINGS
-- Lets visitors (signed in or not) see who published an active
-- listing and which ownership documents it has, without opening
-- up the profiles, companies or property_documents tables.
--
-- profiles / companies / property_documents stay private (RLS
-- unchanged). These functions return only safe, listing-related
-- fields, and only for owners/properties that have an ACTIVE
-- listing, so they cannot be used to enumerate every user.
-- ============================================================

-- Public "business card" for owners of active listings.
create or replace function public.get_public_listing_owners(_owner_ids uuid[])
returns table (
  id uuid,
  name text,
  avatar text,
  email text,
  phone text,
  whatsapp_number text,
  active_role public.user_role,
  agent_sub_role text,
  agent_verification_status text,
  agent_logo text,
  company_id uuid,
  company_name text,
  company_slug text,
  company_logo text,
  company_type public.company_type,
  company_verification_status public.verification_status,
  company_contact_email text,
  company_contact_phone text,
  company_whatsapp_number text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    p.avatar,
    p.email,
    p.phone,
    p.whatsapp_number,
    p.active_role,
    p.agent_profile ->> 'subRole',
    coalesce(p.agent_profile ->> 'verificationStatus', 'unverified'),
    p.agent_profile ->> 'logo',
    c.id,
    c.name,
    c.slug,
    c.logo,
    c.type,
    c.verification_status,
    c.contact_email,
    c.contact_phone,
    c.whatsapp_number,
    p.created_at
  from public.profiles p
  left join public.companies c on c.id = p.company_id
  where p.id = any(_owner_ids)
    and exists (
      select 1 from public.properties pr
      where pr.owner_id = p.id and pr.status = 'active'
    );
$$;

-- Document TYPES attached to active listings (e.g. "C of O").
-- File URLs are intentionally not returned: the files stay in the
-- private property-documents bucket.
create or replace function public.get_public_listing_document_types(_property_ids uuid[])
returns table (
  id uuid,
  property_id uuid,
  document_type text,
  title text,
  uploaded_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select d.id, d.property_id, d.document_type::text, d.title, d.uploaded_at
  from public.property_documents d
  join public.properties pr on pr.id = d.property_id
  where d.property_id = any(_property_ids)
    and pr.status = 'active';
$$;

revoke all on function public.get_public_listing_owners(uuid[]) from public;
revoke all on function public.get_public_listing_document_types(uuid[]) from public;
grant execute on function public.get_public_listing_owners(uuid[]) to anon, authenticated;
grant execute on function public.get_public_listing_document_types(uuid[]) to anon, authenticated;
