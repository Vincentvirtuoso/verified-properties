-- ============================================================
-- Affilhomes — Initial Supabase Schema
-- Migration: 001_initial_schema
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type public.user_role as enum (
  'viewer',
  'agent',
  'company'
);

create type public.company_type as enum (
  'real_estate_company',
  'developer',
  'broker'
);

create type public.verification_status as enum (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

create type public.company_member_role as enum (
  'admin',
  'member'
);

create type public.property_owner_type as enum (
  'agent',
  'company'
);

create type public.property_tier as enum (
  'featured',
  'standard'
);

create type public.listing_purpose as enum (
  'rent',
  'sale'
);

create type public.property_status as enum (
  'draft',
  'active',
  'sold',
  'rented',
  'inactive'
);

create type public.inquiry_status as enum (
  'open',
  'in_progress',
  'deal_closed',
  'cancelled'
);

create type public.transaction_status as enum (
  'pending_remittance',
  'remittance_received',
  'disputed'
);

create type public.remitting_party_type as enum (
  'landlord',
  'company'
);

-- ============================================================
-- PROFILES
-- Supabase Auth owns credentials.
-- This table stores application-level user information.
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  email text not null,
  name text not null,
  phone text,
  whatsapp_number text,
  avatar text,

  is_email_verified boolean not null default false,
  is_phone_verified boolean not null default false,

  active_role public.user_role not null default 'viewer',

  viewer_profile jsonb,
  agent_profile jsonb,

  company_id uuid,

  company_role public.company_member_role,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- COMPANIES
-- ============================================================

create table public.companies (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  logo text,

  type public.company_type not null,

  verification_status public.verification_status
    not null default 'unverified',

  onboarding_docs jsonb not null default '{}'::jsonb,

  features jsonb not null default jsonb_build_object(
    'whatsappNotifications', false,
    'prioritySupport', false,
    'dedicatedAccountManager', false,
    'whiteLabel', false
  ),

  contact_email text not null,
  contact_phone text,
  whatsapp_number text,

  active_listings integer not null default 0,
  total_remitted numeric(18,2) not null default 0,

  remittance_details jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add the company foreign key after companies exists.
alter table public.profiles
  add constraint profiles_company_id_fkey
  foreign key (company_id)
  references public.companies(id)
  on delete set null;

-- ============================================================
-- COMPANY MEMBERS
-- ============================================================

create table public.company_members (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.companies(id)
    on delete cascade,

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  role public.company_member_role not null default 'member',

  permissions jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(company_id, user_id)
);

-- ============================================================
-- PROPERTIES
-- ============================================================

create table public.properties (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,

  title text not null,
  description text,

  category text not null,
  property_type text not null,

  features text[] not null default '{}',

  owner_id uuid not null
    references public.profiles(id)
    on delete restrict,

  owner_type public.property_owner_type not null,

  tier public.property_tier not null default 'standard',

  listing_purpose public.listing_purpose not null,

  status public.property_status not null default 'draft',

  price numeric(18,2) not null default 0,
  currency text not null default 'NGN',

  negotiable boolean not null default false,

  discount jsonb,

  address text not null,
  city text not null,
  state text not null,
  country text not null default 'Nigeria',

  latitude double precision,
  longitude double precision,

  bedrooms integer not null default 0,
  bathrooms numeric(4,1) not null default 0,
  area numeric(18,2) not null default 0,

  total_inquiries integer not null default 0,
  total_closed_deals integer not null default 0,

  active_boost_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_owner_id_idx
  on public.properties(owner_id);

create index properties_status_idx
  on public.properties(status);

create index properties_listing_purpose_idx
  on public.properties(listing_purpose);

create index properties_category_idx
  on public.properties(category);

create index properties_city_idx
  on public.properties(city);

create index properties_price_idx
  on public.properties(price);

create index properties_created_at_idx
  on public.properties(created_at desc);

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================

create table public.property_images (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references public.properties(id)
    on delete cascade,

  url text not null,
  alt text,

  sort_order integer not null default 0,

  created_at timestamptz not null default now()
);

create index property_images_property_id_idx
  on public.property_images(property_id);

-- ============================================================
-- PROPERTY DOCUMENTS
-- ============================================================

create table public.property_documents (
  id uuid primary key default gen_random_uuid(),

  property_id uuid not null
    references public.properties(id)
    on delete cascade,

  document_type text not null,
  title text,

  file_url text not null,

  uploaded_by uuid
    references public.profiles(id)
    on delete set null,

  uploaded_at timestamptz not null default now()
);

create index property_documents_property_id_idx
  on public.property_documents(property_id);

-- ============================================================
-- JV PROPERTIES
-- ============================================================

create table public.jv_properties (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,

  title text not null,
  description text,

  address text not null,
  city text not null,
  state text not null,
  country text not null default 'Nigeria',

  latitude double precision,
  longitude double precision,

  image text,

  price numeric(18,2) not null default 0,
  currency text not null default 'NGN',

  land_value numeric(18,2),
  land_size text,
  premium numeric(18,2),

  minimum_investment numeric(18,2) not null default 0,

  roi numeric(8,2) not null default 0,

  investment_duration text not null,

  sharing_formula text,

  facilitator_fee jsonb,

  category text,
  property_type text,

  purpose_description text,

  google_pin text,

  total_investors integer not null default 0,
  max_investors integer,

  status public.property_status not null default 'draft',

  property_id uuid
    references public.properties(id)
    on delete set null,

  owner_id uuid not null
    references public.profiles(id)
    on delete restrict,

  owner_type text not null
    check (owner_type in ('agent', 'landlord', 'company')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jv_properties_owner_id_idx
  on public.jv_properties(owner_id);

create index jv_properties_status_idx
  on public.jv_properties(status);

-- JV gallery
create table public.jv_property_images (
  id uuid primary key default gen_random_uuid(),

  jv_property_id uuid not null
    references public.jv_properties(id)
    on delete cascade,

  url text not null,
  alt text,

  sort_order integer not null default 0,

  created_at timestamptz not null default now()
);

-- ============================================================
-- INQUIRIES
-- ============================================================

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),

  listing_id uuid not null
    references public.properties(id)
    on delete cascade,

  viewer_id uuid not null
    references public.profiles(id)
    on delete restrict,

  status public.inquiry_status not null default 'open',

  assigned_cs_agent uuid
    references public.profiles(id)
    on delete set null,

  transaction_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiries_listing_id_idx
  on public.inquiries(listing_id);

create index inquiries_viewer_id_idx
  on public.inquiries(viewer_id);

create index inquiries_status_idx
  on public.inquiries(status);

-- ============================================================
-- INQUIRY MESSAGES
-- ============================================================

create table public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),

  inquiry_id uuid not null
    references public.inquiries(id)
    on delete cascade,

  sender_id uuid not null
    references public.profiles(id)
    on delete restrict,

  sender_type text not null
    check (sender_type in ('viewer', 'cs_agent', 'system')),

  content text not null,

  sent_at timestamptz not null default now()
);

create index inquiry_messages_inquiry_id_idx
  on public.inquiry_messages(inquiry_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

create table public.transactions (
  id uuid primary key default gen_random_uuid(),

  listing_id uuid not null
    references public.properties(id)
    on delete restrict,

  inquiry_id uuid not null
    references public.inquiries(id)
    on delete restrict,

  remitting_party_id uuid not null
    references public.profiles(id)
    on delete restrict,

  remitting_party_type public.remitting_party_type not null,

  deal_value numeric(18,2) not null,
  remittance_amount numeric(18,2) not null,

  currency text not null default 'NGN',

  status public.transaction_status
    not null default 'pending_remittance',

  remitted_at timestamptz,

  handled_by_cs_agent uuid
    references public.profiles(id)
    on delete set null,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_listing_id_idx
  on public.transactions(listing_id);

create index transactions_inquiry_id_idx
  on public.transactions(inquiry_id);

create index transactions_status_idx
  on public.transactions(status);

-- Add circular reference after transactions exists.
alter table public.inquiries
  add constraint inquiries_transaction_id_fkey
  foreign key (transaction_id)
  references public.transactions(id)
  on delete set null;

-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

create trigger company_members_set_updated_at
before update on public.company_members
for each row
execute function public.set_updated_at();

create trigger properties_set_updated_at
before update on public.properties
for each row
execute function public.set_updated_at();

create trigger jv_properties_set_updated_at
before update on public.jv_properties
for each row
execute function public.set_updated_at();

create trigger inquiries_set_updated_at
before update on public.inquiries
for each row
execute function public.set_updated_at();

create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

-- ============================================================
-- PROFILE CREATION TRIGGER
-- Creates an application profile whenever a Supabase user
-- signs up.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    name,
    is_email_verified
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.email_confirmed_at is not null
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_documents enable row level security;
alter table public.jv_properties enable row level security;
alter table public.jv_property_images enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_messages enable row level security;
alter table public.transactions enable row level security;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ============================================================
-- COMPANY POLICIES
-- ============================================================

create policy "Authenticated users can view companies"
on public.companies
for select
to authenticated
using (true);

create policy "Company admins can update their company"
on public.companies
for update
to authenticated
using (
  exists (
    select 1
    from public.company_members cm
    where cm.company_id = companies.id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.company_id = companies.id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  )
);

-- ============================================================
-- COMPANY MEMBERS POLICIES
-- ============================================================

create policy "Members can view their company membership"
on public.company_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.company_members admin_member
    where admin_member.company_id = company_members.company_id
      and admin_member.user_id = auth.uid()
      and admin_member.role = 'admin'
  )
);

-- ============================================================
-- PUBLIC PROPERTY READ ACCESS
-- ============================================================

create policy "Anyone can view active properties"
on public.properties
for select
to anon, authenticated
using (status = 'active');

create policy "Owners can view their properties"
on public.properties
for select
to authenticated
using (owner_id = auth.uid());

create policy "Owners can create properties"
on public.properties
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Owners can update their properties"
on public.properties
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================

create policy "Anyone can view images for active properties"
on public.property_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_images.property_id
      and p.status = 'active'
  )
);

create policy "Property owners can manage images"
on public.property_images
for all
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_images.property_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_images.property_id
      and p.owner_id = auth.uid()
  )
);

-- ============================================================
-- PROPERTY DOCUMENTS
-- ============================================================

create policy "Property owners can view their documents"
on public.property_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_documents.property_id
      and p.owner_id = auth.uid()
  )
);

create policy "Property owners can manage documents"
on public.property_documents
for all
to authenticated
using (
  exists (
    select 1
    from public.properties p
    where p.id = property_documents.property_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.properties p
    where p.id = property_documents.property_id
      and p.owner_id = auth.uid()
  )
);

-- ============================================================
-- JV PROPERTY POLICIES
-- ============================================================

create policy "Anyone can view active JV properties"
on public.jv_properties
for select
to anon, authenticated
using (status = 'active');

create policy "JV owners can create properties"
on public.jv_properties
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "JV owners can update properties"
on public.jv_properties
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Anyone can view active JV images"
on public.jv_property_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.jv_properties jp
    where jp.id = jv_property_images.jv_property_id
      and jp.status = 'active'
  )
);

-- ============================================================
-- INQUIRY POLICIES
-- ============================================================

create policy "Users can view their inquiries"
on public.inquiries
for select
to authenticated
using (
  viewer_id = auth.uid()
  or assigned_cs_agent = auth.uid()
);

create policy "Users can create inquiries"
on public.inquiries
for insert
to authenticated
with check (viewer_id = auth.uid());

create policy "Assigned agents can update inquiries"
on public.inquiries
for update
to authenticated
using (
  assigned_cs_agent = auth.uid()
  or viewer_id = auth.uid()
)
with check (
  assigned_cs_agent = auth.uid()
  or viewer_id = auth.uid()
);

-- ============================================================
-- INQUIRY MESSAGE POLICIES
-- ============================================================

create policy "Inquiry participants can view messages"
on public.inquiry_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.inquiries i
    where i.id = inquiry_messages.inquiry_id
      and (
        i.viewer_id = auth.uid()
        or i.assigned_cs_agent = auth.uid()
      )
  )
);

create policy "Inquiry participants can send messages"
on public.inquiry_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.inquiries i
    where i.id = inquiry_messages.inquiry_id
      and (
        i.viewer_id = auth.uid()
        or i.assigned_cs_agent = auth.uid()
      )
  )
);

-- ============================================================
-- TRANSACTION POLICIES
-- ============================================================

create policy "Transaction participants can view transactions"
on public.transactions
for select
to authenticated
using (
  remitting_party_id = auth.uid()
  or handled_by_cs_agent = auth.uid()
);

-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.profiles is
'Application profile linked one-to-one with Supabase Auth users.';

comment on table public.companies is
'Real-estate companies, developers and brokers.';

comment on table public.properties is
'Core real-estate listings.';

comment on table public.jv_properties is
'Joint-venture and investment opportunities.';

comment on table public.inquiries is
'Property inquiries and lead/deal workflow.';

comment on table public.transactions is
'Property transaction and remittance records.';