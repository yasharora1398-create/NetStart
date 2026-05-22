-- Nuclear option: delete EVERY auth.users row except your own.
--
-- Use when so many synthetic accounts have piled up that listing
-- them by name in the migration is no longer practical, and you're
-- the only "real" user on the platform.
--
-- HOW TO USE
--   1. Replace OWNER_EMAIL below with your account's email.
--   2. Paste the whole file into the Supabase SQL editor.
--   3. Run.
--
-- Everything FK'd to auth.users is ON DELETE CASCADE, so deleting
-- the auth row wipes profiles, projects, saved_*, chat_*,
-- notifications, push_tokens, user_reports for every purged user.
--
-- THIS IS NOT A MIGRATION. It lives under supabase/scripts/ so it
-- doesn't get auto-applied by any tooling. Run it by hand only.

\set OWNER_EMAIL 'YOUR_REAL_EMAIL@example.com'

delete from auth.users
where lower(email) <> lower(:'OWNER_EMAIL');

-- If your DB is on Supabase Cloud (which doesn't support \set), use
-- this inline version instead - just substitute YOUR_REAL_EMAIL:
--
--   delete from auth.users
--   where lower(email) <> lower('YOUR_REAL_EMAIL@example.com');
