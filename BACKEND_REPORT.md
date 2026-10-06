# Backend foundation: report

## Gaps found before changes
- `company_members` select policy queried itself, so it recursed forever. Every team or company read failed.
- `profiles` update policy let users change their own `roles`, `company_id`, `company_role`, `is_email_verified` and agent `verificationStatus` (privilege escalation).
- AuthContext `companies` was always `[]`, so the company dashboard and team page always showed "No Company Found".
- Company sign-up never created a company. `completeRegistration` ignored it, and logo/CAC were only temporary `blob:` URLs.
- The List Property form posted to `/api/properties`, which did not exist.
- Sign-up dropped phone/WhatsApp. The profile mapper wrote `whatsapp` instead of `whatsappNumber`.
- Forgot-password was simulated, and there was no reset-password page.
- The email confirmation link went to a protected page, so the proxy bounced it to login before a session existed.
- No storage buckets were set up for images or documents.
- No table GRANTs (newer Supabase projects need them).
- The listing form saved `File` objects to localStorage, which broke uploads after a reload.

## Migration created (none modified)
`supabase/migrations/006_backend_foundation.sql`:
- GRANTs.
- Non-recursive membership helpers: `is_company_member`, `is_company_admin`, `shares_company_with`, `can_publish_listings`.
- Replaced the recursive policy. Teammates can view each other.
- Admins can update or remove other members.
- Guard triggers on profiles, companies, company_members and properties block client writes to privileged fields. Security-definer RPCs such as `create_company_for_current_user` are unaffected.
- Company accounts stay locked to the company role.
- `properties.video_links` column (the form already collected it).
- Company members can see company listings. Owners can delete their drafts.
- `handle_new_user` stores phone/WhatsApp. Email confirmation syncs `is_email_verified`.
- RPC `submit_company_onboarding_docs` (status goes to `pending`).
- Storage buckets `property-images` (public), `avatars` (public), `property-documents` (private), `company-documents` (private). Users can only write inside their own `<user_id>/` folder.

## Files changed
- client/contexts/AuthContext.tsx
- client/lib/supabase/auth.ts
- client/lib/supabase/companies.ts
- client/lib/supabase/storage.ts (new)
- client/lib/supabase/properties.ts (new)
- client/app/api/properties/route.ts (new)
- client/app/auth/callback/route.ts (new)
- client/app/(auth)/reset-password/page.tsx (new, uses the existing AuthForm/Field)
- client/app/(auth)/register/page.tsx
- client/app/(auth)/forgot-password/page.tsx
- client/app/(authenticated)/complete-registration/page.tsx
- client/app/(authenticated)/dashboard/page.tsx
- client/app/(authenticated)/list-property/page.tsx
- client/app/(authenticated)/list-property/hooks/useListPropertyForm.ts
- client/proxy.ts (all `/company/*` pages are now protected)
- server/README.md
- supabase/tests/*

## Verification
- `next build`: passes (34 routes). `tsc`: clean. ESLint: no new errors on changed files.
- The SQL was run on a local Postgres with stand-ins for Supabase's auth and storage, applying 001, 005 and 006 in order. Then `supabase/tests/backend_foundation.test.sql` checked:
  - the sign-up profile and phone
  - email-verified sync
  - blocked self-grant of the company role
  - guarded fields
  - agent upgrade, with verification forced to unverified
  - draft listing, with tier forced to standard
  - publishing blocked while unverified
  - role switching
  - company RPC and admin membership
  - company role lock
  - document submission
  - verification status protected
  - cross-user isolation
- **Not verified:** the app was not run against your real Supabase project. Logins, uploads and listings need a manual test after you apply 006.

## Still incomplete / manual steps
1. Apply `006_backend_foundation.sql` to your Supabase project (SQL editor or `supabase db push`).
2. In Supabase, go to Auth, then URL Configuration. Add `<your-site>/auth/callback` to Redirect URLs.
3. New listings save as **draft**. They can only be published (`active`) by a verified agent or a member of a verified company. No admin screen exists yet to verify accounts, so set `verification_status` / `agentProfile.verificationStatus` in Supabase for now.
4. Public pages still use sample data: properties list/detail, agents, companies, JV, academy, and the viewer "Recommended" block.
5. Not built: inviting company members (no invitation flow), company listings page (still a placeholder), avatar upload at sign-up, inquiries/transactions UI, boosts.

## Merge (feature-backend-supabase-foundation)
Combined the uploaded branch (new Saved Properties, Enquiries, AI Calling pages, design updates) with the backend fixes that had been dropped:
- lib/supabase/auth.ts: phone/WhatsApp at sign-up, sendPasswordResetEmail, updatePassword (reset-password page needed it — build was broken)
- forgot-password: real reset email again
- AuthContext + lib/supabase/companies.ts: loads the user's company and team (fixes "No Company Found"); company sign-up uploads logo/CAC
- register / complete-registration: confirmation link goes through /auth/callback
- list-property page + form hook: saves as draft, clears form, returns to /dashboard
- proxy.ts: all /company/* pages require login
- dashboard: your edits kept, real listings restored
- package-lock.json refreshed (it was out of sync with package.json)
`next build` passes (37 routes).
Still open: Enquiries and Saved Properties use sample data; welcome page links to /dashboard/listings, which doesn't exist.

## Step 1 — Public property pages on real data
- New migration `007_public_listings.sql` (run after 006). Adds two read-only functions:
  - `get_public_listing_owners(uuid[])`: name, photo, contact, verification and company card, only for people who have an active listing. The profiles/companies tables stay private.
  - `get_public_listing_document_types(uuid[])`: which documents (e.g. C of O) an active listing has; file links are never returned.
- `client/lib/supabase/publicProperties.ts` (new): fetchActiveProperties, fetchPropertyBySlug, fetchPublicStats.
- `lib/api.ts`: home page Featured Deals and stats read live data ("happy clients" stays a fixed marketing number).
- `properties/PropertiesContent.tsx`: search page loads active listings, with loading and error states; filters (price, area, location, types) are built from real listings.
- `properties/[slug]/page.tsx`: detail page loads from the database; unknown or draft slugs show "not found".
- `hooks/useProperty.ts` takes the loaded listings; `MobileFilterDropdown.tsx` uses the options passed in.
- Tests: `supabase/tests/public_listings.test.sql` (visitors see only active listings; owner card hidden for draft-only users; document files unreadable).
- Only ACTIVE listings appear publicly. New listings are drafts until a publish step exists (step 4), so the pages will be empty until a listing is set to active in Supabase.

## Step 2 — Saved Properties on real data
- New migration `008_saved_properties.sql` (run after 007): `saved_properties` table (user, property, saved date). Each user can only see, add and remove their own saved items, and only live (active) listings can be saved.
- `client/lib/supabase/savedProperties.ts` (new): load saved IDs, load saved listings, save, unsave.
- `client/contexts/SavedPropertiesContext.tsx` (new, mounted in `app/layout.tsx`): one shared saved list for the whole app.
- `components/property/PropertyCard.tsx`: the heart now saves/unsaves for real; signed-out visitors are sent to login and brought back.
- Removed the hard-coded "always saved" heart on the search and saved pages.
- `saved-properties/page.tsx`: loads the user's saved listings (newest first); un-hearting removes the card straight away.
- Dashboard and profile "Saved" counters show the real count; "/favorites" links (a page that doesn't exist) now go to /saved-properties.
- `lib/supabase/publicProperties.ts`: added fetchActivePropertiesByIds.
- Tests: `supabase/tests/saved_properties.test.sql`.
- Note: the old `viewer_profile.savedListingIds` field is no longer used for saving.
