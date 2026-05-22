-- Nuclear option: delete EVERY auth.users row except your own.
--
-- Use when so many synthetic accounts have piled up that listing
-- them by name in the migration is no longer practical, and you
-- are the only "real" user on the platform.
--
-- HOW TO USE in the Supabase web SQL editor
--   1. Replace the email below with your account's email. Match is
--      case-insensitive so capitalisation doesn't matter.
--   2. Paste the block.
--   3. Run.
--
-- Everything FK'd to auth.users is ON DELETE CASCADE, so deleting
-- the auth row wipes profiles, projects, saved_*, chat_*,
-- notifications, push_tokens, user_reports for every purged user.
--
-- THIS IS NOT A MIGRATION. It lives under supabase/scripts/ so it
-- doesn't get auto-applied by any tooling. Run it by hand only.
--
-- Note: the previous version used psql's `\set` meta-command which
-- only works from the psql CLI - Supabase's web SQL editor rejects
-- it as a syntax error. This file is now plain SQL.

delete from auth.users
where lower(email) <> lower('NetStartapp@outlook.com');
