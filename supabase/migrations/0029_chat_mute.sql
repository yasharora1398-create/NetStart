-- Per-contact mute. Recipients can silence a specific sender so
-- their messages no longer trigger the email-on-DM notification
-- (migration 0028). The in-app bell still suppresses them too —
-- the notification row simply isn't inserted when the sender is
-- muted.
--
-- Schema:
--   chat_contacts.muted boolean — defaults false. A row at
--   (user_id=me, contact_id=them, muted=true) means "I have them
--   muted." Mute is one-sided; muting someone doesn't tell them.
--
-- Idempotent: safe to re-run.

-- 1. Add the column -------------------------------------------------
alter table public.chat_contacts
  add column if not exists muted boolean not null default false;

create index if not exists chat_contacts_muted_idx
  on public.chat_contacts(user_id, contact_id) where muted = true;

-- 2. RPC the client calls to toggle mute ----------------------------
-- Idempotent — setting muted to the same value is a no-op insert
-- via on conflict do update, so the client can flip freely without
-- worrying about whether the row exists yet (it always should for
-- accepted chats, but defensive anyway).
create or replace function public.set_chat_mute(
  other_user_id uuid,
  next_muted boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if other_user_id is null or other_user_id = auth.uid() then
    raise exception 'invalid contact';
  end if;

  -- We only ever update the caller's own row. If the row doesn't
  -- exist (no chat history yet), we insert a stub so the mute
  -- preference is preserved if/when they do start chatting.
  insert into public.chat_contacts (user_id, contact_id, muted)
  values (auth.uid(), other_user_id, next_muted)
  on conflict (user_id, contact_id)
  do update set muted = excluded.muted;
end $$;

grant execute on function public.set_chat_mute(uuid, boolean) to authenticated;

-- 3. Update the chat_message email trigger to skip muted senders ---
-- Re-declare the function from 0028 with the mute check. Behaviour
-- is identical except: if the recipient has muted the sender, the
-- notification row is never inserted, so no email/push fires.
create or replace function public.notify_recipient_on_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_muted boolean;
  sender_name text;
  preview text;
  title_text text;
begin
  -- Recipient's perspective: have they muted the sender?
  select coalesce(muted, false)
  into is_muted
  from public.chat_contacts
  where user_id = new.recipient_id and contact_id = new.sender_id;

  if is_muted then
    return new;
  end if;

  select coalesce(nullif(trim(full_name), ''), 'Someone')
  into sender_name
  from public.profiles
  where user_id = new.sender_id;
  if sender_name is null then
    sender_name := 'Someone';
  end if;

  preview := trim(new.body);
  if length(preview) > 140 then
    preview := substring(preview from 1 for 137) || '...';
  end if;

  title_text := 'New message from ' || sender_name;

  insert into public.notifications (
    user_id, type, title, body, link, from_user_id
  )
  values (
    new.recipient_id,
    'chat_message',
    title_text,
    preview,
    '/chats/' || new.sender_id::text,
    new.sender_id
  );

  return new;
end;
$$;

-- 4. Surface muted state in list_chat_threads ----------------------
-- The chat list pane needs to render a small muted indicator next
-- to muted contacts. Re-declare the function with the extra column.
drop function if exists public.list_chat_threads();
create function public.list_chat_threads()
returns table (
  contact_id uuid,
  last_body text,
  last_at timestamptz,
  last_sender uuid,
  state text,
  accepted_at timestamptz,
  muted boolean
)
language sql
security definer
set search_path = public
as $$
  with my_contacts as (
    select contact_id as other_id, accepted_at, declined_at, muted
    from public.chat_contacts
    where user_id = auth.uid()
    union
    select user_id as other_id, accepted_at, declined_at, false as muted
    from public.chat_contacts
    where contact_id = auth.uid()
  ),
  rolled as (
    select other_id,
           bool_or(accepted_at is not null) as is_accepted,
           bool_or(declined_at is not null) as is_declined,
           min(accepted_at) as accepted_at,
           bool_or(muted) as muted
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
      when c.is_declined then 'declined'
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
    c.accepted_at,
    coalesce(c.muted, false)         as muted
  from ranked r
  full outer join rolled c on c.other_id = r.other_id and r.rn = 1
  where (r.rn = 1 or r.rn is null)
    and coalesce(r.other_id, c.other_id) is not null
  order by coalesce(r.created_at, c.accepted_at) desc nulls last;
$$;
grant execute on function public.list_chat_threads() to authenticated;

-- 5. Helper RPC to read the mute state for a single contact --------
-- Used by the chat header when entering a thread (the list_chat_threads
-- pull may be stale by the time the user opens a specific thread).
create or replace function public.get_chat_mute(other_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(muted, false)
  from public.chat_contacts
  where user_id = auth.uid() and contact_id = other_user_id;
$$;

grant execute on function public.get_chat_mute(uuid) to authenticated;
