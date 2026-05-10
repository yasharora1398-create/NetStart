-- Email notifications via pg_net + the notify-email edge function.
--
-- Replaces the dashboard "Database Webhooks" wiring. Every row inserted
-- into public.notifications fires an HTTP POST to the edge function,
-- which renders the email and hands it to Resend.
--
-- One-time setup (run once in SQL Editor BEFORE this migration applies):
--
--   select vault.create_secret(
--     '<your-webhook-secret>',
--     'notify_email_webhook_secret',
--     'X-Webhook-Secret for notify-email edge function'
--   );
--
-- The same secret must also be set as the WEBHOOK_SECRET edge-function
-- secret so the function can verify inbound calls.

create extension if not exists pg_net with schema extensions;

-- Trigger function. SECURITY DEFINER so it runs with privileges to read
-- vault and call net.http_post regardless of who inserted the row.
create or replace function public.notify_email_on_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
begin
  -- Read secret from Supabase Vault. Soft-fail if the secret isn't set
  -- yet so notifications still insert; emails just don't go out.
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'notify_email_webhook_secret'
  limit 1;

  if v_secret is null or v_secret = '' then
    return new;
  end if;

  perform net.http_post(
    url := 'https://egvimlyfcbnblxbtklqi.supabase.co/functions/v1/notify-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Webhook-Secret', v_secret
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists notify_email_after_insert on public.notifications;
create trigger notify_email_after_insert
  after insert on public.notifications
  for each row execute function public.notify_email_on_notification();
