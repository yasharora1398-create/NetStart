-- Email a user the moment a DM lands in their inbox.
--
-- Every INSERT into public.chat_messages now inserts a row into
-- public.notifications for the recipient with type='chat_message'.
-- The existing trigger from 0023_notifications_email_trigger fires
-- the notify-email edge function on that insert, which renders the
-- HTML email via Resend and ships it to the recipient's address.
--
-- The in-app bell already filters by type so it picks up the new
-- 'chat_message' rows without any UI change. Push notifications
-- are still wired through the same notifications table via
-- notify-push, but the user can keep that function undeployed if
-- they want email-only delivery (which is the current direction).
--
-- Idempotent: safe to re-run.

-- 1. Allow 'chat_message' as a notification type --------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'application_received',
    'application_accepted',
    'application_rejected',
    'profile_accepted',
    'profile_rejected',
    'founder_outreach',
    'chat_request',
    'review_request',
    'chat_message'
  ));

-- 2. Trigger function: insert a notification on every chat message --
create or replace function public.notify_recipient_on_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
  preview text;
  title_text text;
begin
  -- Pull the sender's display name (falls back to "Someone" if the
  -- profile row is missing).
  select coalesce(nullif(trim(full_name), ''), 'Someone')
  into sender_name
  from public.profiles
  where user_id = new.sender_id;
  if sender_name is null then
    sender_name := 'Someone';
  end if;

  -- Trim the message body to a 140-char preview so the email subject
  -- + body don't get unwieldy when the message is long.
  preview := trim(new.body);
  if length(preview) > 140 then
    preview := substring(preview from 1 for 137) || '...';
  end if;

  title_text := 'New message from ' || sender_name;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    new.recipient_id,
    'chat_message',
    title_text,
    preview,
    '/chats/' || new.sender_id::text
  );

  return new;
end;
$$;

-- 3. Attach the trigger ---------------------------------------------
drop trigger if exists notify_email_on_chat_message on public.chat_messages;
create trigger notify_email_on_chat_message
  after insert on public.chat_messages
  for each row execute function public.notify_recipient_on_chat_message();
