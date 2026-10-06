-- ============================================================
-- 008 SAVED PROPERTIES
-- A user's saved ("hearted") listings. Private to each user.
-- ============================================================

create table if not exists public.saved_properties (
  user_id uuid not null default auth.uid()
    references public.profiles(id)
    on delete cascade,
  property_id uuid not null
    references public.properties(id)
    on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create index if not exists saved_properties_property_id_idx
  on public.saved_properties(property_id);

grant select, insert, delete on public.saved_properties to authenticated;
grant all on public.saved_properties to service_role;

alter table public.saved_properties enable row level security;

create policy "Users can view their saved properties"
on public.saved_properties
for select
to authenticated
using (user_id = auth.uid());

-- Only listings the user can currently see as active can be saved.
create policy "Users can save active properties"
on public.saved_properties
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.properties p
    where p.id = property_id and p.status = 'active'
  )
);

create policy "Users can unsave their properties"
on public.saved_properties
for delete
to authenticated
using (user_id = auth.uid());
