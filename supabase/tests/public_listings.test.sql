\set ON_ERROR_STOP 0
-- Run after 001, 005, 006, 007 on a throwaway database.
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000a1','agent@x.com','{"name":"Agent","phone":"+234800"}'),
 ('00000000-0000-0000-0000-0000000000b2','draftonly@x.com','{"name":"Drafty"}');
-- Setup as the database owner (bypasses guards): one active listing for agent, one draft for the other user.
insert into properties(id,slug,title,category,property_type,owner_id,owner_type,listing_purpose,address,city,state,status,tier) values
 ('11111111-0000-0000-0000-000000000001','live-house','Live House','residential','apartment','00000000-0000-0000-0000-0000000000a1','agent','sale','1 st','Lekki','Lagos','active','featured'),
 ('11111111-0000-0000-0000-000000000002','draft-house','Draft House','residential','apartment','00000000-0000-0000-0000-0000000000b2','agent','sale','2 st','Ikeja','Lagos','draft','standard');
insert into property_documents(property_id,document_type,title,file_url) values
 ('11111111-0000-0000-0000-000000000001','certificateOfOccupancy','C of O','u/secret.pdf'),
 ('11111111-0000-0000-0000-000000000002','survey','Survey','u/secret2.pdf');
set role anon;
select 'P1 visitor sees only active (expect 1)', count(*) from properties;
select 'P2 visitor cannot read profiles (expect error)', count(*) from profiles;
select 'P3 owner card for active owner (expect Agent)', name from get_public_listing_owners(array['00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b2']::uuid[]);
select 'P4 draft-only owner hidden (expect 0)', count(*) from get_public_listing_owners(array['00000000-0000-0000-0000-0000000000b2']::uuid[]);
select 'P5 doc types for active only (expect 1)', count(*) from get_public_listing_document_types(array['11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000002']::uuid[]);
select 'P6 visitor cannot read document files (expect error)', count(*) from property_documents;
reset role;
