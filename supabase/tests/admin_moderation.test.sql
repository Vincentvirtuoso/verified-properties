\set ON_ERROR_STOP 0
-- Run on a fresh database after 001, 005, 006 ... 013.
-- d1 = agent, d9 = admin, d3 = ordinary user (buyer).
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-0000000000d1','agent@x.com','{"name":"Agent"}'),
 ('00000000-0000-0000-0000-0000000000d9','admin@x.com','{"name":"Admin"}'),
 ('00000000-0000-0000-0000-0000000000d3','u@x.com','{"name":"User"}');
update profiles set roles = array['viewer','agent']::user_role[],
  agent_profile = '{"subRole":"agent","verificationStatus":"unverified"}'
  where id='00000000-0000-0000-0000-0000000000d1';
insert into user_roles(user_id, role) values ('00000000-0000-0000-0000-0000000000d9','admin');

-- ---------- verification needs an ID ----------
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
select request_agent_verification(); -- expect error (no ID yet)
insert into identity_documents(id, doc_type, file_path) values
 ('44444444-0000-0000-0000-000000000001','nin','00000000-0000-0000-0000-0000000000d1/nin.jpg');
insert into identity_documents(doc_type, file_path, status) values
 ('nin','00000000-0000-0000-0000-0000000000d1/x.jpg','approved'); -- expect error (cannot self-approve)
select 'M1 request verification (expect pending)', request_agent_verification();

set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select admin_set_verification('agent','00000000-0000-0000-0000-0000000000d1','approve',''); -- expect error (reason required)
select admin_set_verification('agent','00000000-0000-0000-0000-0000000000d1','approve','looks fine'); -- expect error (ID not approved)
select admin_review_identity_document('44444444-0000-0000-0000-000000000001','approve','NIN matches name');
select admin_set_verification('agent','00000000-0000-0000-0000-0000000000d1','approve','ID and details checked');
select 'M2 audit rows (expect 2)', count(*) from admin_audit_log;

-- ---------- listing needs admin approval ----------
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
insert into properties(id,slug,title,category,property_type,owner_type,listing_purpose,address,city,state,price) values
 ('33333333-0000-0000-0000-000000000011','m1','M1','residential','apartment','agent','sale','1','Lekki','Lagos',100);
insert into property_documents(id, property_id, document_type, file_url, review_status) values
 ('55555555-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000011','c_of_o','00000000-0000-0000-0000-0000000000d1/cofo.pdf','approved');
select 'M3 doc forced pending (expect pending)', review_status from property_documents;
update properties set status='active'; -- expect error (needs approval)
update properties set review_status='approved'; -- silently ignored
select 'M4 still none (expect none)', review_status from properties;
select 'M5 submit (expect pending)', submit_listing_for_review('33333333-0000-0000-0000-000000000011');

set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select admin_review_listing('33333333-0000-0000-0000-000000000011','approve','ok'); -- expect error (doc not approved)
select admin_review_property_document('55555555-0000-0000-0000-000000000001','approve','C of O verified');
select admin_review_listing('33333333-0000-0000-0000-000000000011','approve','All good');
reset role;
select 'M6 live (expect active approved)', status, review_status from properties;

-- key change sends it back
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
update properties set price = 200;
reset role;
select 'M7 back to review (expect inactive pending)', status, review_status from properties;
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select admin_review_listing('33333333-0000-0000-0000-000000000011','approve','New price fine');
-- title change does not
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
update properties set title = 'M1 renamed';
-- owner hides then re-shows an approved listing without review
update properties set status='inactive';
update properties set status='active';
reset role;
select 'M8 still live (expect active approved)', status, review_status from properties;

-- ---------- video review ----------
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
insert into listing_videos(id, property_id, storage_path) values
 ('66666666-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000011','00000000-0000-0000-0000-0000000000d1/tour.mp4');
insert into listing_videos(property_id, storage_path, status) values
 ('33333333-0000-0000-0000-000000000011','00000000-0000-0000-0000-0000000000d1/t2.mp4','approved'); -- expect error
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d3';
select 'M9 stranger sees no videos (expect 0)', count(*) from listing_videos;
select admin_review_video('66666666-0000-0000-0000-000000000001','approve','x'); -- expect error (admins only)
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select admin_review_video('66666666-0000-0000-0000-000000000001','approve','Clear tour, no contact details');
select admin_mark_video_posted('66666666-0000-0000-0000-000000000001','yt123','public');
set role anon;
select 'M10 public video (expect yt123)', youtube_video_id from get_public_listing_videos(array['33333333-0000-0000-0000-000000000011']::uuid[]);
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
update properties set status='sold';
reset role;
select 'M11 sold -> unlisted wanted (expect unlisted)', youtube_desired_privacy from listing_videos;

-- ---------- rejection, appeal ----------
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
insert into listing_videos(id, property_id, storage_path) values
 ('66666666-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000011','00000000-0000-0000-0000-0000000000d1/t3.mp4');
select submit_appeal('video','66666666-0000-0000-0000-000000000002','please look again'); -- expect error (not rejected)
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select admin_review_video('66666666-0000-0000-0000-000000000002','reject','Shows phone number on screen');
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
select 'M12 appeal sent (expect t)', submit_appeal('video','66666666-0000-0000-0000-000000000002','The number is the office line, allowed?') is not null;
select submit_appeal('video','66666666-0000-0000-0000-000000000002','second appeal again'); -- expect error (already open)
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select admin_resolve_appeal(id, true, 'Fair point, re-reviewing') from admin_list_appeals('open');
reset role;
select 'M13 video back to pending (expect pending)', status from listing_videos where id='66666666-0000-0000-0000-000000000002';

-- ---------- suspension ----------
update properties set status='active' where id='33333333-0000-0000-0000-000000000011';
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select admin_suspend('user','00000000-0000-0000-0000-0000000000d1','Fake listings reported');
reset role;
select 'M14 listing hidden (expect inactive)', status from properties;
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
select 'M15 cannot publish (expect f)', can_publish_listings(auth.uid());
select submit_listing_for_review('33333333-0000-0000-0000-000000000011'); -- expect error (suspended)
set role anon;
select 'M16 not in directory (expect 0)', count(*) from get_public_agents();
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select admin_unsuspend('user','00000000-0000-0000-0000-0000000000d1','Cleared after call');

-- ---------- audit log is permanent & private ----------
reset role;
update admin_audit_log set reason = 'x'; -- expect error
delete from admin_audit_log; -- expect error
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
select 'M17 agent cannot read audit (expect 0)', count(*) from admin_audit_log;
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select 'M18 admin sees actions (expect 11)', count(*) from admin_audit_log;

-- ---------- support tickets ----------
set role anon;
insert into support_tickets(name, email, message) values ('Visitor','v@x.com','Help please');
insert into support_tickets(name, email, message, status) values ('V','v@x.com','x','closed'); -- expect error
select count(*) from support_tickets; -- expect error (visitors can't read tickets)
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select 'M19 admin sees ticket (expect 1)', count(*) from admin_list_tickets('open');

-- ---------- JV needs approval ----------
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d1';
insert into jv_properties(id, slug, title, address, city, state, investment_duration, owner_type, status) values
 ('77777777-0000-0000-0000-000000000001','jv1','JV1','1','Abuja','FCT','36 months','agent','active'); -- expect error
insert into jv_properties(id, slug, title, address, city, state, investment_duration, owner_type) values
 ('77777777-0000-0000-0000-000000000001','jv1','JV1','1','Abuja','FCT','36 months','agent');
select 'M20 submit JV (expect pending)', submit_jv_for_review('77777777-0000-0000-0000-000000000001');
set request.jwt.claim.sub='00000000-0000-0000-0000-0000000000d9';
select admin_review_jv('77777777-0000-0000-0000-000000000001','approve','Title verified');
set role anon;
select 'M21 JV public (expect 1)', count(*) from jv_properties;
reset role;
