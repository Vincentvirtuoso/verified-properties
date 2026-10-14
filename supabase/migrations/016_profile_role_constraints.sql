-- 016_profile_role_constraints.sql
alter table public.profiles
  add constraint active_role_profile_only
  check (active_role in ('viewer', 'agent', 'company'));

alter table public.profiles
  add constraint roles_profile_only
  check (roles <@ array['viewer', 'agent', 'company']::text[]);