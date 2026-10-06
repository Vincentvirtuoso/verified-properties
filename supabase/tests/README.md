# Database tests

Run against a throwaway local Postgres (not your real project):

    createdb vp_test
    psql -d vp_test -f supabase_stub.sql          # minimal auth/storage stand-ins
    psql -d vp_test -f ../migrations/001_initial_schema.sql
    psql -d vp_test -f ../migrations/005_company_onboarding.sql
    psql -d vp_test -f ../migrations/006_backend_foundation.sql
    psql -d vp_test -f ../migrations/007_public_listings.sql
    psql -d vp_test -f backend_foundation.test.sql

For public_listings, saved_properties and enquiries tests, use a fresh database cluster with all migrations (001, 005, 006 … 012) applied.

Lines marked "expect error" must fail; every T-line shows the expected value.
