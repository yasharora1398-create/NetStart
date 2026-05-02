-- NetStart real chat messaging between contacts
-- Enables 1-to-1 messages with RLS that requires both users to be in
-- chat_contacts together. Idempotent: safe to re-run.

-- 1. Messages table -------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_pair_idx
  on public.chat_messages (
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id),
    created_at desc
  );

create index if not exists chat_messages_recipient_idx
  on public.chat_messages (recipient_id, created_at desc);

-- 2. RLS ------------------------------------------------------------
alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages read own" on public.chat_messages;
create policy "chat_messages read own"
  on public.chat_messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- Insert is allowed only if the sender is the caller AND they are
-- contacts with the recipient (someone has accepted the chat).
drop policy if exists "chat_messages insert via contact" on public.chat_messages;
create policy "chat_messages insert via contact"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_contacts
      where user_id = auth.uid()
        and contact_id = recipient_id
    )
  );

-- 3. List one thread (messages with another user) ------------------
create or replace function public.list_chat_thread(
  other_user_id uuid,
  msg_limit integer default 200
)
returns table (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  body text,
  created_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select id, sender_id, recipient_id, body, created_at
  from public.chat_messages
  where (sender_id = auth.uid() and recipient_id = other_user_id)
     or (sender_id = other_user_id and recipient_id = auth.uid())
  order by created_at asc
  limit msg_limit;
$$;

grant execute on function public.list_chat_thread(uuid, integer) to authenticated;

-- 4. Last message per contact (for the threads list) ---------------
create or replace function public.list_chat_threads()
returns table (
  contact_id uuid,
  last_body text,
  last_at timestamptz,
  last_sender uuid
)
language sql
security invoker
set search_path = public
as $$
  with pairs as (
    select
      case when sender_id = auth.uid() then recipient_id else sender_id end
        as other_id,
      body,
      created_at,
      sender_id
    from public.chat_messages
    where sender_id = auth.uid() or recipient_id = auth.uid()
  ),
  ranked as (
    select
      other_id, body, created_at, sender_id,
      row_number() over (partition by other_id order by created_at desc)
        as rn
    from pairs
  )
  select other_id as contact_id,
         body as last_body,
         created_at as last_at,
         sender_id as last_sender
  from ranked
  where rn = 1
  order by created_at desc;
$$;

grant execute on function public.list_chat_threads() to authenticated;

-- 5. Send a message --------------------------------------------------
-- Wraps the insert so we can also fire a notification on the recipient.
create or replace function public.send_chat_message(
  recipient_user_id uuid,
  message_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  sender_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if recipient_user_id is null or recipient_user_id = auth.uid() then
    raise exception 'invalid recipient';
  end if;
  if message_body is null or length(trim(message_body)) = 0 then
    raise exception 'empty message';
  end if;
  if not exists (
    select 1 from public.chat_contacts
    where user_id = auth.uid()
      and contact_id = recipient_user_id
  ) then
    raise exception 'not contacts yet';
  end if;

  insert into public.chat_messages (sender_id, recipient_id, body)
  values (auth.uid(), recipient_user_id, trim(message_body))
  returning id into new_id;

  return new_id;
end $$;

grant execute on function public.send_chat_message(uuid, text) to authenticated;
