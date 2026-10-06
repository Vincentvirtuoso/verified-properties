\set ON_ERROR_STOP 0
-- Run on a fresh database after 001, 005, 006 ... 011.
-- c1 = verified agent (no listings), c2 = unverified agent with a live listing,
-- c3 = unverified agent, drafts only (must stay hidden), c4 = plain viewer.
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000c1','v@x.com','{"name":"Verified"}'),
 ('00000000-0000-0000-0000-0000000000c2','l@x.com','{"name":"Lister"}'),
 ('00000000-0000-0000-0000-0000000000c3','d@x.com','{"name":"Drafty"}'),
 ('00000000-0000-0000-0000-0000000000c4','w@x.com','{"name":"Viewer"}');
update profiles set roles = array['viewer','agent']::user_role[],
  agent_profile = jsonb_build_object('subRole','agent','verificationStatus',
    case id when '00000000-0000-0000-0000-0000000000c1' then 'verified' else 'unverified' end)
  where id in ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000c3');
insert into properties(slug,title,category,property_type,owner_id,owner_type,listing_purpose,address,city,state,status,price) values
 ('a','A','residential','apartment','00000000-0000-0000-0000-0000000000c2','agent','sale','1','Lekki','Lagos','active',100),
 ('b','B','residential','apartment','00000000-0000-0000-0000-0000000000c3','agent','sale','2','Ikeja','Lagos','draft',50);
insert into companies(id,name,slug,type,contact_email,verification_status,remittance_details) values
 ('44444444-0000-0000-0000-000000000001','Good Co','good-co','developer','g@x.com','verified','{"accountNumber":"123"}'),
 ('44444444-0000-0000-0000-000000000002','Hidden Co','hidden-co','developer','h@x.com','pending',null);

set role anon;
select 'D1 public agents (expect Lister,Verified)', string_agg(name, ',' order by name) from get_public_agents();
select 'D2 lister stats (expect 1, 100, {Lekki})', active_listings, total_value, cities from get_public_agents('00000000-0000-0000-0000-0000000000c2');
select 'D3 draft-only agent hidden (expect 0)', count(*) from get_public_agents('00000000-0000-0000-0000-0000000000c3');
select 'D4 public companies (expect Good Co)', string_agg(name, ',') from get_public_companies();
select 'D5 by slug (expect 1)', count(*) from get_public_companies('good-co');
select 'D6 pending company hidden (expect 0)', count(*) from get_public_companies('hidden-co');
select count(*) from companies; -- expect error (table stays private)
select count(*) from profiles; -- expect error (table stays private)
reset role;
