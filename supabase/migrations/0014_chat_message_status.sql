-- NetStart chat message status (WhatsApp-style read receipts)
-- Adds the 1-check / 2-check / 2-green-check progression:
--   sent      → row inserted, delivered_at is null
--   delivered → recipient's device has the row (delivered_at set)
--   read      → recipient opened the chat with this sender (read_at set)
--
-- Idempotent: safe to re-run.

-- 1. Status columns -------------------------------------------------
alter table public.chat_messages
  add column if not exists delivered_at timestamptz,
  add column if not exists read_at timestamptz;

create index if not exists chat_messages_undelivered_idx
  on public.chat_messages (recipient_id, sender_id)
  where delivered_at is null;

create index if not exists chat_messages_unread_idx
  on public.chat_messages (recipient_id, sender_id)
  where read_at is null;

-- 2. RLS for UPDATE -------------------------------------------------
-- The recipient should be able to flip delivered_at / read_at on
-- messages addressed to them. Body / sender / recipient are immutable
-- because the status RPCs go through SECURITY DEFINER, but if a
-- direct update sneaks through, this policy still gates it.
drop policy if exists "chat_messages recipient updates status"
  on public.chat_messages;
create policy "chat_messages recipient updates status"
  on public.chat_messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- 3. list_chat_thread now returns the new fields --------------------
-- Drop the old signature first because the return shape changed.
drop function if exists public.list_chat_thread(uuid, integer);

create or replace function public.list_chat_thread(
  other_user_id uuid,
  msg_limit integer default 200
)
returns table (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  body text,
  created_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz
)
language sql
security invoker
set search_path = public
as $$
  select id, sender_id, recipient_id, body, created_at,
         delivered_at, read_at
  from public.chat_messages
  where (sender_id = auth.uid() and recipient_id = other_user_id)
     or (sender_id = other_user_id and recipient_id = auth.uid())
  order by created_at asc
  limit msg_limit;
$$;

grant execute on function public.list_chat_thread(uuid, integer) to authenticated;

-- 4. Mark messages delivered ----------------------------------------
-- Called by the recipient as soon as their device has received the
-- INSERT (typically from a global realtime subscription). Bulk-marks
-- every undelivered message from a specific sender to the caller.
create or replace function public.mark_messages_delivered(
  other_user_id uuid
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
  update public.chat_messages
    set delivered_at = coalesce(delivered_at, now())
    where recipient_id = auth.uid()
      and sender_id = other_user_id
      and delivered_at is null;
end $$;

grant execute on function public.mark_messages_delivered(uuid) to authenticated;

-- 5. Mark messages read ---------------------------------------------
-- Called when the recipient opens the chat with this sender (and on
-- every new INSERT while the chat is in the foreground). Sets both
-- delivered_at and read_at so the sender sees the green double-check.
create or replace function public.mark_messages_read(
  other_user_id uuid
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
  update public.chat_messages
    set delivered_at = coalesce(delivered_at, now()),
        read_at = coalesce(read_at, now())
    where recipient_id = auth.uid()
      and sender_id = other_user_id
      and read_at is null;
end $$;

grant execute on function public.mark_messages_read(uuid) to authenticated;

-- 6. Realtime — broadcast UPDATEs so senders see status flips ------
-- Replica identity must include all columns so UPDATE payloads
-- include the new delivered_at / read_at values, not just the PK.
alter table public.chat_messages replica identity full;

-- Make sure chat_messages is in the supabase_realtime publication
-- (this lets the client subscribe to INSERT/UPDATE/DELETE events).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
end $$;
