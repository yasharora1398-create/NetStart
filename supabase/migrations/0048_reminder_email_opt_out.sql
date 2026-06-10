-- Opt-out for the weekly profile-setup reminder.
--
-- Two new columns on public.profiles:
--   email_reminders_enabled  - boolean, default true. Set false by
--                              the user (Settings toggle) or by the
--                              one-click unsubscribe link in the
--                              email itself.
--   reminder_unsub_token     - random UUID per profile. Used as the
--                              query param on the one-click unsub
--                              URL so the user doesn't have to log
--                              in to opt out (the token replaces
--                              auth). Unique index so the lookup is
--                              O(1) and the route can refuse to
--                              flip more than one row.
--
-- Backfill: the new column defaults to TRUE for every existing row,
-- which is the legally safe default — nobody who is already getting
-- reminders gets cut off by this migration. The unsub token gets a
-- gen_random_uuid() value for every existing row so every user has a
-- working unsub link from the first send after this migration runs.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_reminders_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_unsub_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS profiles_reminder_unsub_token_uidx
  ON public.profiles (reminder_unsub_token);

COMMENT ON COLUMN public.profiles.email_reminders_enabled IS
  'When false, the weekly profile-setup reminder cron skips this user. Flipped by the Settings toggle OR by the one-click unsubscribe link in any reminder email.';

COMMENT ON COLUMN public.profiles.reminder_unsub_token IS
  'Per-user random token embedded in the reminder email unsubscribe URL so the recipient can opt out without signing in.';
