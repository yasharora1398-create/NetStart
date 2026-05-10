-- Rate limiting for write-heavy actions.
-- The chat-request flow already self-throttles (2 messages per 48 hours
-- on a pending thread). This migration adds two more guardrails:
--
--   1. Project creation: max 5 new projects per founder per 24 hours.
--      Stops a single account from spinning up dozens of fake listings.
--
--   2. Chat send total: max 100 messages per user per 24 hours across
--      all threads. Prevents anyone from blasting the platform.
--
-- Idempotent: safe to re-run.

-- 1. rate_limit_events table ---------------------------------------
create table if not exists public.rate_limit_events (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  action      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists rate_limit_events_user_action_idx
  on public.rate_limit_events(user_id, action, created_at desc);

alter table public.rate_limit_events enable row level security;

-- Only the function below ever touches this table; users have no
-- direct read/write access. SECURITY DEFINER bypasses RLS.
drop policy if exists "rate_limit_events: no client access" on public.rate_limit_events;
create policy "rate_limit_events: no client access" on public.rate_limit_events
  for all using (false) with check (false);

-- 2. Enforcement helper --------------------------------------------
-- Counts the caller's events for `action` in the last `minutes`
-- minutes. If under `max`, logs a new event and returns; otherwise
-- raises 'rate_limited' so the client can render a clear message.
-- Parameters are prefixed with `p_` so they don't collide with the
-- column names on rate_limit_events (action / created_at / user_id).
-- The original version used `action` for both, which Postgres flags
-- as `column reference "action" is ambiguous (42702)` the moment the
-- function actually runs. Dropping first lets a re-run of the
-- migration rename the params (`create or replace` can't change
-- argument names — same rule that bit list_chat_threads).
drop function if exists public.enforce_rate_limit(text, integer, integer);
create function public.enforce_rate_limit(
  p_action text,
  p_max_count integer,
  p_minutes integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select count(*)
  into recent_count
  from public.rate_limit_events
  where user_id = auth.uid()
    and action = p_action
    and created_at > now() - make_interval(mins => p_minutes);

  if recent_count >= p_max_count then
    raise exception 'rate_limited: too many % requests', p_action;
  end if;

  insert into public.rate_limit_events (user_id, action)
  values (auth.uid(), p_action);
end $$;

grant execute on function public.enforce_rate_limit(text, integer, integer) to authenticated;

-- 3. Apply to project creation -------------------------------------
-- Trigger before insert on projects: 5 new per 24 hours per founder.
create or replace function public.projects_enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id = auth.uid() then
    perform public.enforce_rate_limit('create_project', 5, 24 * 60);
  end if;
  return new;
end $$;

drop trigger if exists projects_rate_limit on public.projects;
create trigger projects_rate_limit
  before insert on public.projects
  for each row execute function public.projects_enforce_rate_limit();

-- 4. Apply to chat sends -------------------------------------------
-- Wrap request_or_send_chat_message with a global ceiling of 100
-- messages per user per 24 hours. The per-thread 2/48h logic stays.
create or replace function public.request_or_send_chat_message(
  recipient_user_id uuid,
  message_body text
)
returns table (
  message_id uuid,
  is_pending boolean,
  pending_count integer,
  pending_window_start_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  contact record;
  body_trim text := trim(message_body);
  new_msg_id uuid;
  sender_name text;
  sender_linkedin text;
  notif_body text;
  is_first_send boolean := false;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if recipient_user_id is null or recipient_user_id = auth.uid() then
    raise exception 'invalid recipient';
  end if;
  if length(body_trim) = 0 then
    raise exception 'empty message';
  end if;

  -- Global daily ceiling. Throws 'rate_limited' so the chat UI can
  -- show a plain "you've sent too many messages today" alert.
  perform public.enforce_rate_limit('send_chat_message', 100, 24 * 60);

  select
    user_id, contact_id, accepted_at,
    request_window_start_at, request_message_count
  into contact
  from public.chat_contacts
  where user_id = auth.uid()
    and contact_id = recipient_user_id;

  if not found then
    insert into public.chat_contacts (
      user_id, contact_id,
      accepted_at,
      request_window_start_at,
      request_message_count
    )
    values (
      auth.uid(), recipient_user_id,
      null,
      now(),
      1
    );
    is_first_send := true;
  elsif contact.accepted_at is not null then
    null;
  else
    if contact.request_message_count >= 2 then
      if contact.request_window_start_at is null
         or now() - contact.request_window_start_at > interval '48 hours' then
        update public.chat_contacts
          set request_window_start_at = now(),
              request_message_count = 1
          where user_id = auth.uid()
            and contact_id = recipient_user_id;
      else
        raise exception 'limit_reached';
      end if;
    else
      update public.chat_contacts
        set request_message_count = request_message_count + 1,
            request_window_start_at = coalesce(request_window_start_at, now())
        where user_id = auth.uid()
          and contact_id = recipient_user_id;
    end if;
  end if;

  insert into public.chat_messages (sender_id, recipient_id, body)
  values (auth.uid(), recipient_user_id, body_trim)
  returning id into new_msg_id;

  if is_first_send then
    select
      coalesce(nullif(full_name, ''), 'Someone'),
      coalesce(linkedin_url, '')
    into sender_name, sender_linkedin
    from public.profiles
    where user_id = auth.uid();

    notif_body := sender_name || ' sent you a chat request.';

    insert into public.notifications (
      user_id, type, title, body, link, from_user_id
    )
    values (
      recipient_user_id,
      'chat_request',
      sender_name || ' wants to chat',
      notif_body,
      '/chats',
      auth.uid()
    );
  end if;

  return query
    select new_msg_id,
           (contact.accepted_at is null
              and not is_first_send
              and contact.user_id is not null
              and contact.accepted_at is null)
           or is_first_send,
           coalesce(
             (select request_message_count
                from public.chat_contacts
                where user_id = auth.uid()
                  and contact_id = recipient_user_id),
             0
           ),
           (select request_window_start_at
              from public.chat_contacts
              where user_id = auth.uid()
                and contact_id = recipient_user_id);
end $$;

grant execute on function public.request_or_send_chat_message(uuid, text) to authenticated;
