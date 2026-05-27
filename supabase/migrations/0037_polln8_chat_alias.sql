-- Polln8-recommended chat alias.
--
-- When someone messages the admin via a Polln8-recommended project
-- card (e.g. they hit "Message" on the "redstring" card), the chat
-- contact_id is the admin's user_id - same as any normal DM. On the
-- ADMIN's side we want the chat to show the real requester's name
-- (no change). On the REQUESTER's side we want the contact to show
-- the project's polln8 founder name + photo ("redstring" / its logo)
-- instead of "Polln8".
--
-- Implementation:
--   1. chat_contacts gets a nullable via_project_id column. Stamped
--      on the requester's outbound row when the first message is sent
--      from a polln8 card. The admin's reverse row stays NULL so the
--      admin's chat list shows the real requester.
--   2. list_chat_contacts joins projects on via_project_id and, if
--      the project is_polln8_recommended, swaps in polln8_founder_name
--      + polln8_founder_avatar_path + polln8_founder_website.
--   3. list_chat_threads gains alias_name + alias_avatar_path so the
--      threads list + chat header can render the same override
--      without a second round-trip.
--   4. request_or_send_chat_message gains an optional via_project_id
--      parameter. Old callers still work (default null).
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + DROP / CREATE on functions.

alter table public.chat_contacts
  add column if not exists via_project_id uuid
  references public.projects(id) on delete set null;

-- list_chat_contacts: returns the contact display fields with the
-- polln8 alias overlay applied when the chat was opened via a
-- Polln8-recommended project. Output shape unchanged (drop-in).
drop function if exists public.list_chat_contacts();
create function public.list_chat_contacts()
returns table (
  contact_id uuid,
  full_name text,
  linkedin_url text,
  avatar_path text,
  connected_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    c.contact_id,
    case
      when coalesce(pr.is_polln8_recommended, false)
       and coalesce(pr.polln8_founder_name, '') <> ''
      then pr.polln8_founder_name
      else coalesce(p.full_name, '')
    end as full_name,
    case
      when coalesce(pr.is_polln8_recommended, false)
       and coalesce(pr.polln8_founder_website, '') <> ''
      then pr.polln8_founder_website
      else coalesce(p.linkedin_url, '')
    end as linkedin_url,
    case
      when coalesce(pr.is_polln8_recommended, false)
       and coalesce(pr.polln8_founder_avatar_path, '') <> ''
      then pr.polln8_founder_avatar_path
      else p.avatar_path
    end as avatar_path,
    c.created_at as connected_at
  from public.chat_contacts c
  left join public.profiles p on p.user_id = c.contact_id
  left join public.projects pr on pr.id = c.via_project_id
  where c.user_id = auth.uid()
  order by c.created_at desc;
$$;
grant execute on function public.list_chat_contacts() to authenticated;

-- list_chat_threads: extended with alias_name + alias_avatar_path so
-- both threads list and chat header can render the override from one
-- query. The original 6 output columns stay; two added at the end.
drop function if exists public.list_chat_threads();
create function public.list_chat_threads()
returns table (
  contact_id uuid,
  last_body text,
  last_at timestamptz,
  last_sender uuid,
  state text,
  accepted_at timestamptz,
  alias_name text,
  alias_avatar_path text
)
language sql
security definer
set search_path = public
as $$
  with my_contacts as (
    select contact_id as other_id, accepted_at, via_project_id,
           'outbound'::text as direction
    from public.chat_contacts
    where user_id = auth.uid()
    union
    select user_id as other_id, accepted_at, null::uuid as via_project_id,
           'inbound'::text as direction
    from public.chat_contacts
    where contact_id = auth.uid()
  ),
  rolled as (
    select other_id,
           bool_or(accepted_at is not null) as is_accepted,
           min(accepted_at) as accepted_at,
           -- Only outbound rows carry via_project_id; inbound rows
           -- always have null. Postgres has no max(uuid), so cast to
           -- text + back - the value is identical, only the type
           -- pipeline changes. (Picking the lexicographic max is fine
           -- because at most one row in this group has a non-null id.)
           max(via_project_id::text)::uuid as via_project_id
    from my_contacts
    group by other_id
  ),
  pairs as (
    select
      case when sender_id = auth.uid() then recipient_id else sender_id end as other_id,
      body, created_at, sender_id
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
    coalesce(r.body, '') as last_body,
    coalesce(r.created_at, c.accepted_at) as last_at,
    r.sender_id as last_sender,
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
    end as state,
    c.accepted_at,
    case
      when coalesce(pr.is_polln8_recommended, false)
       and coalesce(pr.polln8_founder_name, '') <> ''
      then pr.polln8_founder_name
      else null::text
    end as alias_name,
    case
      when coalesce(pr.is_polln8_recommended, false)
       and coalesce(pr.polln8_founder_avatar_path, '') <> ''
      then pr.polln8_founder_avatar_path
      else null::text
    end as alias_avatar_path
  from ranked r
  full outer join rolled c on c.other_id = r.other_id and r.rn = 1
  left join public.projects pr on pr.id = c.via_project_id
  where (r.rn = 1 or r.rn is null)
    and coalesce(r.other_id, c.other_id) is not null
  order by coalesce(r.created_at, c.accepted_at) desc nulls last;
$$;
grant execute on function public.list_chat_threads() to authenticated;

-- request_or_send_chat_message: optional via_project_id parameter so
-- a first message from a polln8 card stamps the alias onto the new
-- pending chat_contacts row. Old callers pass null (the default) and
-- get the unchanged behavior.
drop function if exists public.request_or_send_chat_message(uuid, text);
drop function if exists public.request_or_send_chat_message(uuid, text, uuid);
create function public.request_or_send_chat_message(
  recipient_user_id uuid,
  message_body text,
  via_project_id uuid default null
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
  notif_body text;
  is_first_send boolean := false;
  resolved_via_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if recipient_user_id is null or recipient_user_id = auth.uid() then
    raise exception 'invalid recipient';
  end if;
  if length(body_trim) = 0 then raise exception 'empty message'; end if;

  -- Only honor via_project_id when the project is real, polln8-
  -- recommended, AND owned by the recipient. Anything else gets
  -- discarded so a caller can't alias an arbitrary chat.
  if via_project_id is not null then
    select id into resolved_via_id
    from public.projects
    where id = via_project_id
      and owner_id = recipient_user_id
      and coalesce(is_polln8_recommended, false) = true;
  end if;

  select user_id, contact_id, accepted_at,
         request_window_start_at, request_message_count
  into contact
  from public.chat_contacts
  where user_id = auth.uid() and contact_id = recipient_user_id;

  if not found then
    insert into public.chat_contacts (
      user_id, contact_id, accepted_at,
      request_window_start_at, request_message_count, via_project_id
    ) values (
      auth.uid(), recipient_user_id, null, now(), 1, resolved_via_id
    );
    is_first_send := true;
  elsif contact.accepted_at is not null then
    -- Already accepted. If a via id arrived (e.g. user re-engaged
    -- via the polln8 card after accepting), stamp it so the alias
    -- still applies. Don't overwrite an existing alias - first one
    -- wins, otherwise the contact name could flicker between
    -- different polln8 projects.
    if resolved_via_id is not null then
      update public.chat_contacts
        set via_project_id = coalesce(via_project_id, resolved_via_id)
        where user_id = auth.uid() and contact_id = recipient_user_id;
    end if;
  else
    if contact.request_message_count >= 2 then
      if contact.request_window_start_at is null
         or now() - contact.request_window_start_at > interval '48 hours' then
        update public.chat_contacts
          set request_window_start_at = now(), request_message_count = 1
          where user_id = auth.uid() and contact_id = recipient_user_id;
      else
        raise exception 'limit_reached';
      end if;
    else
      update public.chat_contacts
        set request_message_count = request_message_count + 1,
            request_window_start_at = coalesce(request_window_start_at, now()),
            via_project_id = coalesce(via_project_id, resolved_via_id)
        where user_id = auth.uid() and contact_id = recipient_user_id;
    end if;
  end if;

  insert into public.chat_messages (sender_id, recipient_id, body)
  values (auth.uid(), recipient_user_id, body_trim)
  returning id into new_msg_id;

  if is_first_send then
    select coalesce(nullif(full_name, ''), 'Someone')
    into sender_name
    from public.profiles where user_id = auth.uid();

    notif_body := sender_name || ' sent you a chat request.';

    insert into public.notifications (
      user_id, type, title, body, link, from_user_id
    ) values (
      recipient_user_id, 'chat_request',
      sender_name || ' wants to chat',
      notif_body, '/chats', auth.uid()
    );
  end if;

  return query
    select new_msg_id,
           (contact.accepted_at is null and not is_first_send
              and contact.user_id is not null
              and contact.accepted_at is null)
           or is_first_send,
           coalesce((select request_message_count from public.chat_contacts
                     where user_id = auth.uid() and contact_id = recipient_user_id), 0),
           (select request_window_start_at from public.chat_contacts
              where user_id = auth.uid() and contact_id = recipient_user_id);
end $$;
grant execute on function public.request_or_send_chat_message(uuid, text, uuid)
  to authenticated;
