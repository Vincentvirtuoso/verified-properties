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

## Step 7 — Admin approvals, audit log, video review (013_admin_moderation.sql)

Run `013_admin_moderation.sql` in the Supabase SQL Editor after 012.

**What admins now control (Admin page → tabs)**
- **Listings**: Publish now means "Submit for review". A listing goes live only when an admin approves it. Every property document must be approved first. Changing price, location or listing type, or adding/replacing/removing documents, takes a live listing down and sends it back to review. Title/description edits don't. Owners can hide and re-show an approved listing without a new review.
- **Verification**: agents upload a government ID (NIN, passport, driver's licence, voter's card) on `/verification`. Admins review ID cards, company CAC documents and agents/companies themselves. An agent can't be approved until their ID is approved.
- **Videos**: owners upload a video file per listing on My Listings (up to 500 MB; your Supabase plan's upload limit also applies, 50 MB on Free). Admins watch it, then Approve / Reject / Request changes. Only videos for approved, live listings from verified owners can be approved. Approved videos are posted to the Affilhomes YouTube channel. When a listing is sold, rented or hidden, its video switches to unlisted. Rejected video files are deleted after 30 days unless an appeal is open.
- **JV**: JV listings can't go live without admin approval. Key changes send them back to review.
- **Accounts**: suspend or unsuspend a user or a company. Suspension hides all their live listings and JV listings, blocks publishing and removes them from the public directory.
- **Appeals**: rejected users get an Appeal button (listing, document, video, ID, verification, suspension). Accepting an appeal puts the item back in the review queue, or lifts the suspension. "Contact support" is always shown as the fallback.
- **Support**: the support form now saves real tickets. Admins close them with a note.
- **Audit log**: every admin action is recorded with who, what, when and the reason. Rows can't be edited or deleted, not even by admins. Earlier verification decisions were copied in.

Every decision needs a reason. The database enforces this too.

**Also connected**: company enquiries (teammates can read conversations; only the assigned agent can reply), JV pages (live data), an Admin link in the menu (admins only).

**Files**: `supabase/migrations/013_admin_moderation.sql`, `supabase/tests/admin_moderation.test.sql`, `client/lib/supabase/{admin,moderation,jv}.ts`, `client/lib/youtube.ts`, `client/app/api/admin/videos/[id]/publish/route.ts`, `client/app/api/cron/videos/route.ts`, `client/app/(authenticated)/admin/*`, `my-listings`, `(auth)/verification`, `company/enquiries`, `company/listings`, `list-property`, JV pages, support form, UserMenu, EnquiryThread, publicProperties/properties mapping, `proxy.ts` (`/verification` requires login).

**Environment variables (server only, never NEXT_PUBLIC_)**
- `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`: from a Google Cloud OAuth client with the YouTube Data API v3 enabled, authorised by the Affilhomes Google account that owns the channel (scopes `youtube.upload` and `youtube`). Until these are set, approved videos wait, and nothing breaks.
- `CRON_SECRET`: any long random string.
- `SUPABASE_SERVICE_ROLE_KEY`: used **only** by `/api/cron/videos`, which runs with no user signed in.
- `NEXT_PUBLIC_SITE_URL`: e.g. https://affilhomes.com (used in YouTube descriptions).

**Schedule** `GET /api/cron/videos` every 15 minutes with header `Authorization: Bearer <CRON_SECRET>` (Vercel Cron, cron-job.org, etc.). It retries YouTube posts, keeps video privacy in sync with listing status, and deletes rejected files after 30 days.

**YouTube limits**: new Google projects get roughly 6 uploads a day (10,000 quota units; one upload costs 1,600) and uploads start as private until Google audits the app. Request an audit and higher quota in Google Cloud Console before launch.

**Tests**: `admin_moderation.test.sql` covers 21 rules, all passing. All earlier tests still pass. `admin_publishing.test.sql` is noted as partly superseded, because owners can no longer publish directly.

**Not built yet**: team invites, unread message counts, AI call recordings/summaries, a form for owners to create JV listings (the database is ready; JV rows can be added in Supabase for now).
