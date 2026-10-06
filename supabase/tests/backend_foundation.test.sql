\set ON_ERROR_STOP 0
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','a@x.com','{"name":"Ann","phone":"+2348000000001"}'),
 ('00000000-0000-0000-0000-00000000000b','b@x.com','{"name":"Ben"}');
select 'T1 profile+phone', name, phone, whatsapp_number is null from profiles where email='a@x.com';
update auth.users set email_confirmed_at=now() where email='a@x.com';
select 'T2 verified sync', is_email_verified from profiles where email='a@x.com';
set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-00000000000a';
select 'T3 sees own only', count(*) from profiles;
update profiles set roles=array['viewer','company']::user_role[] where true;   -- expect error
update profiles set is_email_verified=false, company_role='admin', name='Ann2' where true;
select 'T4 guarded', name, is_email_verified, company_role from profiles;
update profiles set roles=array['viewer','agent']::user_role[], active_role='agent', agent_profile='{"subRole":"realtor","verificationStatus":"verified","activeListings":99}' where true;
select 'T5 agent', active_role, agent_profile->>'verificationStatus', agent_profile->>'activeListings' from profiles;
insert into properties(slug,title,category,property_type,owner_id,owner_type,listing_purpose,address,city,state,status,tier) values('p1','House','residential','apartment','00000000-0000-0000-0000-00000000000a','agent','sale','1 st','Lagos','Lagos','draft','featured');
select 'T6 listing', tier, status from properties;
insert into properties(slug,title,category,property_type,owner_id,owner_type,listing_purpose,address,city,state,status) values('p2','H','residential','apartment','00000000-0000-0000-0000-00000000000a','agent','sale','1','L','L','active'); -- expect error unverified
update profiles set active_role='viewer' where true;
select 'T7 switch', active_role from profiles;
select 'T8 company', name from create_company_for_current_user('Acme','acme','developer','a@x.com');
select 'T9 profile', active_role, roles, company_role from profiles;
update profiles set active_role='viewer' where true; -- expect locked error
select 'T10 team', count(*) from company_members;
select 'T11 docs', verification_status from submit_company_onboarding_docs((select id from companies),'{"cacCertificateUrl":"a/cac.pdf"}');
update companies set verification_status='verified' where true;
select 'T12 still', verification_status from companies;
set request.jwt.claim.sub='00000000-0000-0000-0000-00000000000b';
select 'T13 B sees A listing', count(*) from properties;
select 'T14 B team', count(*) from company_members;
select 'T15 B docs', 1 from submit_company_onboarding_docs((select id from companies),'{"cacCertificateUrl":"x"}'); -- expect error
reset role;
