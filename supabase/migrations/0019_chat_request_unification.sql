-- Stage 4: unify "request chat" and "apply" into a single chat-first
-- flow. The existing Apply system stays in place but is no longer the
-- entry point - everything funnels through chat threads.
--
-- Rules:
--   - When user A sends their first message to user B, a pending
--     chat_contacts row (a -> b) is created with accepted_at = null.
--   - A can send up to 2 messages per 48-hour window before B accepts.
--   - Once B taps Accept (or this RPC's accept call fires), both rows
--     (a -> b, b -> a) are stamped accepted_at = now() and the limit
--     no longer applies in either direction.
--   - When 48h passes since the current window started AND the count
--     hit 2, the next send resets the window to start = now and count = 1.
--
-- Idempotent: safe to re-run.

-- 1. Add pending-state columns to chat_contacts -------------------
alter table public.chat_contacts
  add column if not exists accepted_at timestamptz;

alter table public.chat_contacts
  add column if not exists request_window_start_at timestamptz;

alter table public.chat_contacts
  add column if not exists request_message_count integer not null default 0;

-- Backfill: every pre-existing row was created by accept_chat_request,
-- so it should be considered accepted from the row's created_at.
update public.chat_contacts
set accepted_at = created_at
where accepted_at is null;

-- 2. Tighten chat_messages insert RLS so DIRECT inserts only work
-- once both sides have accepted. Pending sends must go through the
-- request_or_send_chat_message RPC (which is SECURITY DEFINER and
-- bypasses RLS on its own writes).
drop policy if exists "chat_messages insert via contact" on public.chat_messages;
create policy "chat_messages insert via contact"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_contacts
      where user_id = auth.uid()
        and contact_id = recipient_id
        and accepted_at is not null
    )
  );

-- 3. The unified send entry point. Handles all four cases:
--    a. accepted contact -> just insert
--    b. existing pending row, count < 2 -> increment + insert
--    c. existing pending row, count >= 2, window > 48h old -> reset
--       window + count = 1 + insert
--    d. existing pending row at limit, window fresh -> raise
--       'limit_reached' so the UI can render a friendly message
--    e. no row yet -> create pending row, count = 1, insert,
--       fire chat_request notification on the recipient.
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

  select
    user_id, contact_id, accepted_at,
    request_window_start_at, request_message_count
  into contact
  from public.chat_contacts
  where user_id = auth.uid()
    and contact_id = recipient_user_id;

  if not found then
    -- First time sending. Create the pending row, count = 1.
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
    -- Already accepted, no limit.
    null;
  else
    -- Pending. Decide whether to allow this send.
    if contact.request_message_count >= 2 then
      if contact.request_window_start_at is null
         or now() - contact.request_window_start_at > interval '48 hours' then
        -- Window expired. Reset.
        update public.chat_contacts
          set request_window_start_at = now(),
              request_message_count = 1
          where user_id = auth.uid()
            and contact_id = recipient_user_id;
      else
        raise exception 'limit_reached';
      end if;
    else
      -- Within window, room left.
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
    -- Tell the recipient there's a chat request waiting.
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

-- 4. Accept the inbound chat request from `requester_user_id`. Must
-- be called by the recipient. Stamps both rows accepted_at = now()
-- and creates the reverse row if needed.
create or replace function public.accept_chat_thread(
  requester_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if requester_user_id is null or requester_user_id = auth.uid() then
    raise exception 'invalid requester';
  end if;

  -- Stamp the requester's pending row as accepted.
  update public.chat_contacts
    set accepted_at = coalesce(accepted_at, now())
    where user_id = requester_user_id
      and contact_id = auth.uid();

  -- Create the reverse row (or stamp it accepted if it exists).
  insert into public.chat_contacts (user_id, contact_id, accepted_at)
  values (auth.uid(), requester_user_id, now())
  on conflict (user_id, contact_id) do update
    set accepted_at = coalesce(public.chat_contacts.accepted_at, excluded.accepted_at);

  -- Notify the requester their chat got accepted.
  select coalesce(nullif(full_name, ''), 'They') into recipient_name
  from public.profiles
  where user_id = auth.uid();

  insert into public.notifications (
    user_id, type, title, body, link, from_user_id
  )
  values (
    requester_user_id,
    'founder_outreach',
    recipient_name || ' accepted your chat',
    'Reply lifted - keep the conversation going.',
    '/chats',
    auth.uid()
  );
end $$;

grant execute on function public.accept_chat_thread(uuid) to authenticated;

-- 5. Read the current pending state for one thread. Mobile uses this
-- to render the limit indicator + Accept button.
create or replace function public.get_chat_thread_state(
  other_user_id uuid
)
returns table (
  -- "outbound" | "inbound" | "accepted" | "none"
  state text,
  accepted_at timestamptz,
  request_message_count integer,
  request_window_start_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  outbound record;
  inbound record;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select c.accepted_at, c.request_message_count, c.request_window_start_at
  into outbound
  from public.chat_contacts c
  where c.user_id = auth.uid()
    and c.contact_id = other_user_id;

  select c.accepted_at, c.request_message_count, c.request_window_start_at
  into inbound
  from public.chat_contacts c
  where c.user_id = other_user_id
    and c.contact_id = auth.uid();

  if outbound.accepted_at is not null or inbound.accepted_at is not null then
    return query
      select 'accepted'::text,
             coalesce(outbound.accepted_at, inbound.accepted_at),
             0, null::timestamptz;
    return;
  end if;

  if outbound.request_window_start_at is not null then
    return query
      select 'outbound'::text,
             outbound.accepted_at,
             outbound.request_message_count,
             outbound.request_window_start_at;
    return;
  end if;

  if inbound.request_window_start_at is not null then
    return query
      select 'inbound'::text,
             inbound.accepted_at,
             inbound.request_message_count,
             inbound.request_window_start_at;
    return;
  end if;

  return query select 'none'::text, null::timestamptz, 0, null::timestamptz;
end $$;

grant execute on function public.get_chat_thread_state(uuid) to authenticated;

-- 6. Update list_chat_threads to also surface pending inbound threads
-- that haven't received any reply yet. Sort by most recent message.
-- The 0013 version returned 4 columns; this version returns 6. Postgres
-- won't let `create or replace` change OUT-parameter shape, so drop
-- the old definition first. Idempotent.
drop function if exists public.list_chat_threads();
create function public.list_chat_threads()
returns table (
  contact_id uuid,
  last_body text,
  last_at timestamptz,
  last_sender uuid,
  state text,
  accepted_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with my_contacts as (
    -- Outbound rows: I requested or accepted with someone.
    select contact_id as other_id, accepted_at,
           'outbound'::text as direction
    from public.chat_contacts
    where user_id = auth.uid()
    union
    -- Inbound rows: they requested me. Without a row in `my_contacts`
    -- (above), I haven't accepted yet.
    select user_id as other_id, accepted_at,
           'inbound'::text as direction
    from public.chat_contacts
    where contact_id = auth.uid()
  ),
  rolled as (
    -- Combine duplicates: if both directions exist (accepted), prefer
    -- the outbound row's accepted_at since that's mine.
    select other_id,
           bool_or(accepted_at is not null) as is_accepted,
           min(accepted_at) as accepted_at
    from my_contacts
    group by other_id
  ),
  pairs as (
    select
      case when sender_id = auth.uid() then recipient_id else sender_id end as other_id,
      body,
      created_at,
      sender_id
    from public.chat_messages
    where sender_id = auth.uid() or recipient_id = auth.uid()
  ),
  ranked as (
    select other_id, body, created_at, sender_id,
           row_number() over (partition by other_id order by created_at desc) as rn
    from pairs
  )
  select
    coalesce(r.other_id, c.other_id) as contact_id,
    coalesce(r.body, '')             as last_body,
    coalesce(r.created_at, c.accepted_at) as last_at,
    r.sender_id                       as last_sender,
    case
      when c.is_accepted then 'accepted'
      when c.is_accepted is null then 'accepted'
      else case
        when exists (
          select 1 from public.chat_contacts
          where user_id = auth.uid()
            and contact_id = coalesce(r.other_id, c.other_id)
        ) then 'outbound'
        else 'inbound'
      end
    end                               as state,
    c.accepted_at
  from ranked r
  full outer join rolled c on c.other_id = r.other_id and r.rn = 1
  where (r.rn = 1 or r.rn is null)
    and coalesce(r.other_id, c.other_id) is not null
  order by coalesce(r.created_at, c.accepted_at) desc nulls last;
$$;

grant execute on function public.list_chat_threads() to authenticated;
