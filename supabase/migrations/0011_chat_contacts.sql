-- NetStart chat contacts
-- Adds the sender on chat_request notifications, an accept flow that
-- promotes a chat_request into a mutual contact, and a list endpoint
-- so the chats page can show DMs.
-- Idempotent: safe to re-run.

-- 1. Track who sent each notification ------------------------------
alter table public.notifications
  add column if not exists from_user_id uuid references auth.users(id) on delete set null;

-- 2. Mutual contacts table -----------------------------------------
create table if not exists public.chat_contacts (
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, contact_id)
);

create index if not exists chat_contacts_user_idx
  on public.chat_contacts(user_id, created_at desc);

alter table public.chat_contacts enable row level security;

drop policy if exists "chat_contacts read own" on public.chat_contacts;
create policy "chat_contacts read own"
  on public.chat_contacts for select
  using (user_id = auth.uid());

-- 3. Update request_chat to set from_user_id -----------------------
create or replace function public.request_chat(
  target_user_id uuid,
  project_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  founder_name text;
  founder_linkedin text;
  body_text text;
  link_text text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if target_user_id is null or target_user_id = auth.uid() then
    raise exception 'invalid target';
  end if;

  select coalesce(nullif(full_name, ''), 'A founder'),
         coalesce(linkedin_url, '')
  into founder_name, founder_linkedin
  from public.profiles
  where user_id = auth.uid();

  body_text := founder_name || ' would like to start a conversation.';
  if length(founder_linkedin) > 0 then
    body_text := body_text || E'\n\nLinkedIn: ' || founder_linkedin;
  end if;

  link_text := '/chats';

  insert into public.notifications (
    user_id, type, title, body, link, from_user_id
  )
  values (
    target_user_id,
    'chat_request',
    founder_name || ' wants to chat',
    body_text,
    link_text,
    auth.uid()
  );
end $$;

grant execute on function public.request_chat(uuid, uuid) to authenticated;

-- 4. Accept a chat request -----------------------------------------
-- Promotes the requester into the recipient's contacts (and vice
-- versa) and marks the original notification read. Also notifies the
-- requester that their chat was accepted.
create or replace function public.accept_chat_request(
  notification_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  notif record;
  recipient_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id, user_id, from_user_id, type, read_at
  into notif
  from public.notifications
  where id = notification_id;

  if notif.id is null then
    raise exception 'notification not found';
  end if;
  if notif.user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;
  if notif.type <> 'chat_request' then
    raise exception 'not a chat request';
  end if;
  if notif.from_user_id is null then
    raise exception 'no sender on this request';
  end if;

  -- Both directions, idempotent
  insert into public.chat_contacts (user_id, contact_id)
  values (auth.uid(), notif.from_user_id)
  on conflict do nothing;

  insert into public.chat_contacts (user_id, contact_id)
  values (notif.from_user_id, auth.uid())
  on conflict do nothing;

  update public.notifications
    set read_at = coalesce(read_at, now())
    where id = notification_id;

  -- Tell the requester they got accepted (uses founder_outreach since
  -- it's allowed in the type_check and renders with the friendly icon).
  select coalesce(nullif(full_name, ''), 'They') into recipient_name
  from public.profiles
  where user_id = auth.uid();

  insert into public.notifications (
    user_id, type, title, body, link, from_user_id
  )
  values (
    notif.from_user_id,
    'founder_outreach',
    recipient_name || ' accepted your chat request',
    'You can now reach out from your DMs in /chats.',
    '/chats',
    auth.uid()
  );
end $$;

grant execute on function public.accept_chat_request(uuid) to authenticated;

-- 5. List my contacts ----------------------------------------------
create or replace function public.list_chat_contacts()
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
  select c.contact_id,
         coalesce(p.full_name, '') as full_name,
         coalesce(p.linkedin_url, '') as linkedin_url,
         p.avatar_path,
         c.created_at as connected_at
  from public.chat_contacts c
  left join public.profiles p on p.user_id = c.contact_id
  where c.user_id = auth.uid()
  order by c.created_at desc;
$$;

grant execute on function public.list_chat_contacts() to authenticated;
