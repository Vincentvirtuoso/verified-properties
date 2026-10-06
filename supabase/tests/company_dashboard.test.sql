\set ON_ERROR_STOP 0
-- Run on a fresh database after 001, 005, 006 ... 012.
-- c1, c2 = members of company K; c3 = outsider.
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000c1','a@x.com','{"name":"A"}'),
 ('00000000-0000-0000-0000-0000000000c2','b@x.com','{"name":"B"}'),
 ('00000000-0000-0000-0000-0000000000c3','c@x.com','{"name":"C"}');
insert into companies(id,name,slug,type,contact_email,verification_status) values
 ('55555555-0000-0000-0000-000000000001','K','k','developer','k@x.com','verified');
insert into company_members(company_id,user_id,role) values
 ('55555555-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000c1','admin'),
 ('55555555-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000c2','member');
insert into properties(id,slug,title,category,property_type,owner_id,owner_type,listing_purpose,address,city,state,status,price) values
 ('66666666-0000-0000-0000-000000000001','l1','L1','residential','apartment','00000000-0000-0000-0000-0000000000c1','company','sale','1','Lekki','Lagos','active',300),
 ('66666666-0000-0000-0000-000000000002','l2','L2','residential','apartment','00000000-0000-0000-0000-0000000000c2','company','sale','2','Ikeja','Lagos','draft',100),
 ('66666666-0000-0000-0000-000000000003','l3','L3','residential','apartment','00000000-0000-0000-0000-0000000000c3','company','sale','3','Yaba','Lagos','active',999);
insert into inquiries(listing_id, viewer_id) values
 ('66666666-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000c3');

set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c2';
select 'C1 stats (expect team 2, live 1, draft 1, value 300, enquiries 1/1)',
  team_size, active_listings, draft_listings, live_value, total_enquiries, open_enquiries
  from get_company_dashboard_stats('55555555-0000-0000-0000-000000000001');
select 'C2 member sees teammate draft (expect 2)', count(*) from properties
  where owner_type='company' and owner_id in ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000c2');
update properties set status='inactive' where id='66666666-0000-0000-0000-000000000001';
select 'C3 cannot edit teammate listing (expect 0 changed)', count(*) from properties where status='inactive';
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c3';
select get_company_dashboard_stats('55555555-0000-0000-0000-000000000001'); -- expect error
reset role;
