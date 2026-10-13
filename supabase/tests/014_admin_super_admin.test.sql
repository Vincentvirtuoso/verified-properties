begin;
select plan(10);

-- Users
insert into auth.users(id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local',   '{"name":"Owner"}'),
  ('00000000-0000-0000-0000-000000000002', 'candidate@test.local','{"name":"Candidate"}'),
  ('00000000-0000-0000-0000-000000000003', 'viewer@test.local',  '{"name":"Viewer"}');

insert into public.profiles(id, email, name) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local',    'Owner'),
  ('00000000-0000-0000-0000-000000000002', 'candidate@test.local','Candidate'),
  ('00000000-0000-0000-0000-000000000003', 'viewer@test.local',   'Viewer');

-- Bootstrap super_admin
insert into public.user_roles(user_id, role)
values ('00000000-0000-0000-0000-000000000001', 'super_admin');
update public.profiles set admin_status = 'active'
where id = '00000000-0000-0000-0000-000000000001';

-- Candidate applies
update public.profiles set admin_status = 'pending'
where id = '00000000-0000-0000-0000-000000000002';

-- ---- As Owner ----
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

select ok(public.is_super_admin(), 'owner is super_admin');
select ok(public.is_admin(),       'super_admin is also admin');

select lives_ok(
  $$ select public.approve_admin('00000000-0000-0000-0000-000000000002') $$,
  'approve_admin succeeds'
);

select is(
  (select admin_status::text from public.profiles
   where id = '00000000-0000-0000-0000-000000000002'),
  'active',
  'candidate is active'
);

select is(
  (select role::text from public.user_roles
   where user_id = '00000000-0000-0000-0000-000000000002'),
  'admin',
  'candidate has admin role'
);

select throws_ok(
  $$ select public.suspend_admin('00000000-0000-0000-0000-000000000001','x') $$,
  'You cannot change your own admin status',
  'owner cannot modify self'
);

select lives_ok(
  $$ select public.suspend_admin('00000000-0000-0000-0000-000000000002','test') $$,
  'suspend_admin succeeds'
);

-- ---- As suspended candidate ----
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000002';
select ok(not public.is_admin(), 'suspended admin loses access');

-- ---- As viewer ----
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000003';
select throws_ok(
  $$ select public.approve_admin('00000000-0000-0000-0000-000000000002') $$,
  'Super admins only',
  'viewer cannot approve'
);

select ok(not public.is_admin(), 'viewer is not admin');

select * from finish();
rollback;