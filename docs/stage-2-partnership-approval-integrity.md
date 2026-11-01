# Stage 2: Partnership approval integrity

## First platform administrator on a fresh deployment

Migration 023 removes the trigger that promoted a user based on public Auth
signup metadata. A new deployment intentionally has no public or automatic
first-admin promotion path. A trusted project operator provisions the first
administrator out of band:

1. **Fresh migration-chain prerequisite:** migration 010 defines
   `public.app_role` without `super_admin`, but migration 014 references that
   label in a top-level update. Since historical migrations must not be edited,
   a fresh replay must pause after migration 010 and, as the trusted database
   operator, execute this standalone statement and let it commit before
   continuing with 011–023:

   ```sql
   alter type public.app_role add value if not exists 'super_admin';
   ```

   Migration 023 repeats this idempotently for projects that already passed
   migration 014. Existing projects should first confirm the actual enum labels
   and migration history; do not run this as an unreviewed production change.
2. Deploy migrations through 023 to the intended project. Do not put service
   role keys or database credentials in browser code.
3. Have the administrator create a normal user account through the public
   registration flow and confirm the email address. Signup should use the
   ordinary seeker/viewer account type; custom `requested_role` metadata is
   ignored and no longer grants platform access.
4. A trusted operator signs in to the Supabase Dashboard with project-owner
   access and opens the project's SQL Editor. Find the administrator's Auth
   user UUID in the Dashboard's Users view. Verify the email and UUID with the
   intended person using the organization's normal identity process.
5. As the trusted operator, run the following one-time SQL, replacing the
   email placeholder. This uses the SQL Editor's privileged database session;
   it is not exposed as an application RPC.

```sql
do $bootstrap$
declare
  v_user_id uuid;
  v_count integer;
begin
  select count(*)
  into v_count
  from auth.users u
  where lower(u.email) = lower('FIRST_ADMIN_EMAIL@example.com')
    and u.email_confirmed_at is not null;

  if v_count <> 1 then
    raise exception 'Expected exactly one confirmed Auth user for the first admin';
  end if;
  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower('FIRST_ADMIN_EMAIL@example.com')
    and u.email_confirmed_at is not null;
  if not exists (select 1 from public.profiles p where p.id = v_user_id) then
    raise exception 'The Auth user profile has not been created';
  end if;

  insert into public.user_roles(user_id, role)
  values (v_user_id, 'super_admin'::public.app_role)
  on conflict (user_id, role) do nothing;

  update public.profiles
  set admin_status = 'active'
  where id = v_user_id;
end;
$bootstrap$;
```

6. The first administrator signs in and confirms access to the admin
   application. Add any further administrators only through the existing
   trusted admin-management workflow. Keep the SQL Editor operator account
   protected with MFA and limit project-owner access.

## Legacy data reconciliation

Migration 023 does not modify existing company, registration, membership, or
profile rows. It stops before adding the one-company unique index if it finds
duplicate memberships, memberships attached to non-verified companies, or
company profile fields/active roles that do not match a valid membership.
Resolve every reported row manually and rerun the migration. Do not approve
legacy pending companies as part of reconciliation.

Run these read-only reports against staging before applying 023. Save the
results for review and decide each record with an authorized operator:

```sql
-- Legacy companies that are not approved, or that predate the registration
-- linkage. NULL approval_registration_id is expected for historical approved
-- companies, but pending/rejected/unverified rows need an explicit decision.
select c.id, c.name, c.verification_status, c.approval_registration_id,
       count(distinct m.user_id) as member_count,
       array_agg(distinct m.user_id) filter (where m.user_id is not null) as member_ids
from public.companies c
left join public.company_members m on m.company_id = c.id
where c.verification_status <> 'verified'::public.verification_status
   or c.approval_registration_id is null
group by c.id
order by c.verification_status, c.created_at;

-- Users with duplicate memberships. Each needs a human decision about which
-- company membership is valid before the unique index can be installed.
select user_id, array_agg(distinct company_id order by company_id) as company_ids
from public.company_members
group by user_id
having count(distinct company_id) > 1;

-- Profile membership/role state that needs explicit reconciliation.
select p.id, p.company_id, p.company_role, p.active_role, p.roles,
       m.company_id as membership_company_id, m.role as membership_role,
       c.verification_status,
       exists (
         select 1 from public.account_suspensions s
         where s.subject_type = 'company' and s.subject_id = c.id
       ) as company_suspended
from public.profiles p
left join public.company_members m
  on m.user_id = p.id and m.company_id = p.company_id
left join public.companies c on c.id = m.company_id
where (
    p.company_id is not null
    or p.company_role is not null
    or p.active_role = 'company'::public.user_role
    or 'company'::public.user_role = any(coalesce(p.roles, '{}'::public.user_role[]))
  )
  and (
    m.user_id is null
    or p.company_role is distinct from m.role
    or not ('company'::public.user_role = any(coalesce(p.roles, '{}'::public.user_role[])))
    or (p.active_role = 'company'::public.user_role and (
      c.verification_status is distinct from 'verified'::public.verification_status
      or exists (
        select 1 from public.account_suspensions s
        where s.subject_type = 'company' and s.subject_id = c.id
      )
    ))
  );

-- Submitted applications whose applicant already has a company assignment
-- need review; do not run approval until an operator resolves the conflict.
select r.id as registration_id, r.user_id, r.status, r.company_name,
       p.company_id, p.company_role, p.active_role
from public.company_registrations r
join public.profiles p on p.id = r.user_id
where r.status = 'docs_submitted'::public.company_reg_status
  and (
    p.company_id is not null
    or p.company_role is not null
    or 'company'::public.user_role = any(coalesce(p.roles, '{}'::public.user_role[]))
    or exists (select 1 from public.company_members m where m.user_id = r.user_id)
  );
```

For each reported row, verify the application and the intended company owner
with an authorized operator. Correct stale profile fields, remove duplicate or
unauthorized memberships only after confirming the legitimate owner, and keep
pending/rejected companies unapproved. If historical property ownership,
remittance, or business records depend on a legacy company, preserve those
records and document any manual ownership repair. Do not make these changes as
part of migration 023.

## Post-migration SQL verification

Run these read-only checks in staging after applying 023. All invariant queries
should return no rows or `false` where indicated.

```sql
-- Confirm no public/service-role approval path and only authenticated RPC use.
select
  has_function_privilege('anon', 'public.approve_company_registration(uuid)', 'EXECUTE') as anon_approve,
  has_function_privilege('authenticated', 'public.approve_company_registration(uuid)', 'EXECUTE') as auth_approve_rpc,
  has_function_privilege('service_role', 'public.approve_company_registration(uuid)', 'EXECUTE') as service_approve,
  has_function_privilege('anon', 'public.reject_company_registration(uuid,text,text)', 'EXECUTE') as anon_reject,
  has_function_privilege('authenticated', 'public.reject_company_registration(uuid,text,text)', 'EXECUTE') as auth_reject_rpc,
  has_function_privilege('anon', 'public.create_company_for_current_user(text,text,public.company_type,text,text,text,text)', 'EXECUTE') as anon_legacy_create,
  has_function_privilege('authenticated', 'public.create_company_for_current_user(text,text,public.company_type,text,text,text,text)', 'EXECUTE') as auth_legacy_create;

-- Authenticated and service-role clients should not have direct table writes.
select
  has_table_privilege('authenticated', 'public.companies', 'INSERT') as auth_company_insert,
  has_table_privilege('service_role', 'public.companies', 'INSERT') as service_company_insert,
  has_table_privilege('authenticated', 'public.company_members', 'INSERT') as auth_member_insert,
  has_table_privilege('authenticated', 'public.company_members', 'UPDATE') as auth_member_update,
  has_table_privilege('authenticated', 'public.company_members', 'DELETE') as auth_member_delete,
  has_table_privilege('service_role', 'public.company_members', 'INSERT') as service_member_insert;

-- Memberships must be unique per user and belong only to approved, active companies.
select user_id, count(distinct company_id) as company_count
from public.company_members
group by user_id
having count(distinct company_id) > 1;

select m.company_id, m.user_id, c.verification_status
from public.company_members m
join public.companies c on c.id = m.company_id
where c.verification_status <> 'verified'::public.verification_status;

-- No company-active profile may lack a valid membership.
select p.id, p.company_id, p.company_role, p.active_role
from public.profiles p
where p.active_role = 'company'::public.user_role
  and not exists (
    select 1
    from public.company_members m
    join public.companies c on c.id = m.company_id
    where m.user_id = p.id
      and m.company_id = p.company_id
      and m.role = p.company_role
      and c.verification_status = 'verified'::public.verification_status
      and not exists (
        select 1 from public.account_suspensions s
        where s.subject_type = 'company' and s.subject_id = c.id
      )
  );

-- Confirm triggers and the signup bootstrap removal.
select c.relname as table_name, t.tgname as trigger_name, t.tgenabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and n.nspname = 'public'
  and c.relname in ('companies', 'company_members', 'profiles', 'account_suspensions')
order by c.relname, t.tgname;

select to_regprocedure('public.promote_admin_on_signup()') as signup_bootstrap_function;

-- A valid new company must have an approval registration reference. Historical
-- approved companies can have a NULL reference and remain operational.
select c.id, c.approval_registration_id, r.status, r.user_id
from public.companies c
left join public.company_registrations r on r.id = c.approval_registration_id
where c.approval_registration_id is not null
  and (r.id is null or r.status <> 'verified'::public.company_reg_status);
```

## Staging test checklist

After operator reconciliation and applying 023 to staging, verify:

- Anonymous approval and rejection RPC calls fail.
- An ordinary authenticated user cannot approve or reject a registration.
- An ordinary user cannot insert into `companies` or `company_members` through
  PostgREST, including as `service_role` via application code.
- Signup with `requested_role=admin` or forged admin metadata creates no
  `user_roles` entry and does not set `admin_status` active.
- Direct profile updates cannot set `company_id`, `company_role`, add the
  company role, or set `active_role` to company without a valid membership.
- Direct `company_members` updates and deletes fail; authorized update/removal
  RPCs preserve the last-admin rule and synchronize profile fields.
- A platform admin can approve one valid submitted application; the company is
  verified, linked to that registration, and has exactly one initial admin.
- A platform admin can reject a submitted application; it creates no company
  or membership.
- Invitation acceptance succeeds for a verified, non-suspended company and
  fails for pending, rejected, unverified, or suspended companies.
- Concurrent approvals for the same registration produce one company; the
  losing request fails cleanly.
- Concurrent invitations/approvals for the same user yield at most one company
  membership; the unique index rejects any race that passes function checks.
- Concurrent invitation acceptance and company suspension serialize; no
  membership is added after the suspension commits.
- Existing verified company members continue to load their company and team.
- Suspending or moving a company away from verified deactivates members'
  `active_role` to viewer; reactivation does not silently switch them back.
- Generic Verification no longer lists companies and its decision RPC rejects
  company subjects. Partnership Requests still approves and rejects normally.
