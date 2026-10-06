\set ON_ERROR_STOP 0
-- Run on a fresh database after 001, 005, 006 ... 010.
-- c1 = agent, c9 = admin, c3 = ordinary user.
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000c1','agent@x.com','{"name":"Agent"}'),
 ('00000000-0000-0000-0000-0000000000c9','admin@x.com','{"name":"Admin"}'),
 ('00000000-0000-0000-0000-0000000000c3','u@x.com','{"name":"User"}');
update profiles set roles = array['viewer','agent']::user_role[],
  agent_profile = '{"subRole":"agent","verificationStatus":"unverified","activeListings":0,"activeBoostedListings":0}'
  where id='00000000-0000-0000-0000-0000000000c1';
insert into user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000c9','admin');

set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c1';
insert into properties(id,slug,title,category,property_type,owner_type,listing_purpose,address,city,state) values
 ('33333333-0000-0000-0000-000000000001','p1','P1','residential','apartment','agent','sale','1','Lekki','Lagos');
update properties set status='active'; -- expect error (not verified)
insert into user_roles(user_id, role) values (auth.uid(),'admin'); -- expect error (self-grant)
select 'A1 is_admin for agent (expect f)', is_admin();
select admin_verification_queue(); -- expect error (admins only)
select 'A2 request verification (expect pending)', request_agent_verification();

set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c9';
select 'A3 admin queue has agent (expect 1)', count(*) from admin_verification_queue() where subject_type='agent';
select admin_set_verification('agent','00000000-0000-0000-0000-0000000000c1','verified','ok');
select 'A4 review logged (expect 1)', count(*) from verification_reviews;

set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c1';
update properties set status='active';
select 'A5 published (expect active)', status from properties;
select 'A6 agent cannot read reviews (expect 0)', count(*) from verification_reviews;

set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c3';
select admin_unpublish_property('33333333-0000-0000-0000-000000000001'); -- expect error
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c9';
select admin_unpublish_property('33333333-0000-0000-0000-000000000001');
reset role;
select 'A7 taken down (expect inactive)', status from properties;
set role anon;
select is_admin(); -- expect error
reset role;
