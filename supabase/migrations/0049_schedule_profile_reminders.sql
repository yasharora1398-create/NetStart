-- Schedule the weekly profile-setup reminder via pg_cron.
--
-- After this runs, every Monday at 14:00 UTC pg_cron does a
-- net.http_post() to the profile-reminders Edge Function, which
-- queries the draft users + sends the Resend emails (see
-- supabase/functions/profile-reminders/index.ts).
--
-- The edge function gates on an x-webhook-secret header; we read
-- the matching secret out of Vault so we don't ship the raw value
-- in this migration. Set the Vault entry before running:
--
--   SELECT vault.create_secret('<your-webhook-secret>', 'profile_reminders_secret');
--
-- And the project-ref URL the same way (only needed once):
--
--   SELECT vault.create_secret('https://<project-ref>.functions.supabase.co', 'functions_base_url');
--
-- If you'd rather inline them (single-tenant project, low op risk),
-- swap the vault.read() calls below for literal strings. The Vault
-- version is preferred because the migration can then be checked
-- into version control without leaking either value.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule any prior version of this job (idempotent re-run).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'profile_reminders_weekly') THEN
    PERFORM cron.unschedule('profile_reminders_weekly');
  END IF;
END $$;

-- Mondays at 14:00 UTC. Adjust the cron string to taste; use
-- https://crontab.guru to sanity check.
SELECT cron.schedule(
  'profile_reminders_weekly',
  '0 14 * * 1',
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'functions_base_url'
      ) || '/profile-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'profile_reminders_secret'
        )
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS
  'Scheduled jobs. Polln8 uses it for profile_reminders_weekly (see migration 0049).';
