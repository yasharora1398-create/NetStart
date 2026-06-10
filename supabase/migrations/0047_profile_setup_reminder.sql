-- Weekly profile-setup reminder bookkeeping.
--
-- The Vercel cron route /api/cron/profile-reminders runs every Monday.
-- For each user whose profile.review_status = 'draft', the route
-- sends a Resend email reminding them to finish setup. We stamp the
-- send timestamp here so:
--   1. A flaky cron run (or manual re-trigger) can't double-email
--      anyone inside the same week.
--   2. An admin can SELECT to see who got the latest reminder and
--      when.
-- Cleared back to NULL automatically when review_status flips off
-- 'draft' so a draft → submitted → re-draft loop resets the gate.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_setup_reminder_at timestamptz;

COMMENT ON COLUMN public.profiles.last_setup_reminder_at IS
  'Set by the weekly profile-setup reminder cron when an email is sent. NULL means the user has never received one (or their review_status left and re-entered draft, see trigger below).';

-- When a draft user submits (status moves off 'draft'), wipe the
-- reminder timestamp so the cron starts from scratch if they ever
-- bounce back to draft (e.g. admin rejects, user re-edits).
CREATE OR REPLACE FUNCTION public.reset_setup_reminder_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.review_status = 'draft'
    AND NEW.review_status IS DISTINCT FROM 'draft'
    AND NEW.last_setup_reminder_at IS NOT NULL THEN
    NEW.last_setup_reminder_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reset_setup_reminder_trg ON public.profiles;
CREATE TRIGGER reset_setup_reminder_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_setup_reminder_on_status_change();
