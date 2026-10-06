\set ON_ERROR_STOP 0
-- Run on a fresh database after 001, 005, 006, 007, 008, 009.
-- c1 = buyer, c2 = listing owner (agent), c3 = stranger.
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000c1','b@x.com','{"name":"Buyer"}'),
 ('00000000-0000-0000-0000-0000000000c2','a@x.com','{"name":"Agent"}'),
 ('00000000-0000-0000-0000-0000000000c3','s@x.com','{"name":"Stranger"}');
insert into properties(id,slug,title,category,property_type,owner_id,owner_type,listing_purpose,address,city,state,status) values
 ('22222222-0000-0000-0000-000000000001','live','Live','residential','apartment','00000000-0000-0000-0000-0000000000c2','agent','sale','1','Lekki','Lagos','active'),
 ('22222222-0000-0000-0000-000000000002','draft','Draft','residential','apartment','00000000-0000-0000-0000-0000000000c2','agent','sale','2','Ikeja','Lagos','draft');

set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c1';
select 'E1 enquiry created', create_enquiry('22222222-0000-0000-0000-000000000001','Buyer B','+2348000000000','Hello') is not null;
select create_enquiry('22222222-0000-0000-0000-000000000001','Buyer B','+2348000000000','Again') is not null;
select 'E2 second send reuses it (expect 1 enquiry, 2 messages)',
  (select count(*) from inquiries), (select count(*) from inquiry_messages);
select create_enquiry('22222222-0000-0000-0000-000000000002','B','+2348000000000','x'); -- expect error (draft)
update inquiries set stage='inspection'; -- expect error (buyer cannot change stage)
update inquiries set assigned_cs_agent='00000000-0000-0000-0000-0000000000c1'; -- expect error (reassign)
select 'E3 buyer sees no phone (expect null)', contact_phone from get_my_enquiries();

set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c2';
select create_enquiry('22222222-0000-0000-0000-000000000001','A','+2348000000000','x'); -- expect error (own listing)
select 'E4 agent sees enquiry + phone', listing_title, viewer_name, contact_phone, last_message from get_my_enquiries();
update inquiries set stage='inspection';
select 'E5 stage now (expect inspection)', stage from inquiries;
insert into inquiry_messages(inquiry_id,sender_id,sender_type,content)
  select id, auth.uid(), 'viewer', 'Reply' from inquiries;
select 'E6 agent reply typed cs_agent (expect cs_agent)', sender_type from inquiry_messages where content='Reply';
update inquiries set contact_phone='1'; -- expect error (agent edits buyer phone)

set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000c3';
select 'E7 stranger sees nothing (expect 0,0,0)',
  (select count(*) from inquiries), (select count(*) from inquiry_messages), (select count(*) from get_my_enquiries());
insert into inquiry_messages(inquiry_id,sender_id,sender_type,content)
  select '00000000-0000-0000-0000-000000000000'::uuid, auth.uid(), 'viewer', 'x'; -- expect error

reset role;
select 'E8 listing counter (expect 1)', total_inquiries from properties where slug='live';
set role anon;
select get_my_enquiries(); -- expect error (visitor)
reset role;
