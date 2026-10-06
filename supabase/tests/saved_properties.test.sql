\set ON_ERROR_STOP 0
-- Run on a fresh database after 001, 005, 006, 007, 008.
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000c1','u1@x.com','{"name":"U1"}'),
 ('00000000-0000-0000-0000-0000000000c2','u2@x.com','{"name":"U2"}');
insert into properties(id,slug,title,category,property_type,owner_id,owner_type,listing_purpose,address,city,state,status) values
 ('22222222-0000-0000-0000-000000000001','live','Live','residential','apartment','00000000-0000-0000-0000-0000000000c2','agent','sale','1','Lekki','Lagos','active'),
 ('22222222-0000-0000-0000-000000000002','draft','Draft','residential','apartment','00000000-0000-0000-0000-0000000000c2','agent','sale','2','Ikeja','Lagos','draft');
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c1';
insert into saved_properties(property_id) values ('22222222-0000-0000-0000-000000000001');
select 'S1 saved active (expect 1)', count(*) from saved_properties;
insert into saved_properties(property_id) values ('22222222-0000-0000-0000-000000000002'); -- expect error (draft)
insert into saved_properties(user_id,property_id) values ('00000000-0000-0000-0000-0000000000c2','22222222-0000-0000-0000-000000000001'); -- expect error (other user)
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c2';
select 'S2 other user sees none (expect 0)', count(*) from saved_properties;
delete from saved_properties;
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c1';
select 'S3 still saved (expect 1)', count(*) from saved_properties;
delete from saved_properties where property_id='22222222-0000-0000-0000-000000000001';
select 'S4 unsaved (expect 0)', count(*) from saved_properties;
reset role; set role anon;
select 'S5 visitor (expect error)', count(*) from saved_properties;
reset role;
