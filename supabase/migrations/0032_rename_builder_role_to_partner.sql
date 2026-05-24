-- Rename the candidate role label from 'builder' to 'partner'.
--
-- The role is stored in auth.users.raw_user_meta_data (the jsonb the
-- Supabase JS SDK exposes as `user_metadata`). It's the only place
-- the value lives - there is no profiles.role column, no enum type,
-- and no check constraint on it.
--
-- This migration rewrites every existing 'builder' value to 'partner'
-- so the new UI copy ("Partner mode", "Find partners", etc.) lines up
-- with what the auth session actually carries. New sign-ups already
-- write 'partner' via the updated client code.
--
-- Idempotent: re-running after rewrite matches zer
o rows because the
-- WHERE clause filters on the literal 'builder' string. Real accounts
-- that picked 'founder' are untouched.

update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"partner"'::jsonb,
  true
)
where raw_user_meta_data ->> 'role' = 'builder';
