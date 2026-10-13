
alter table public.profiles
  add column if not exists admin_status text;

alter table public.profiles
  drop constraint if exists profiles_admin_status_check;

alter table public.profiles
  add constraint profiles_admin_status_check
  check (admin_status in ('pending', 'active', 'rejected', 'suspended'));

create index if not exists profiles_admin_status_idx
  on public.profiles (admin_status)
  where admin_status is not null;