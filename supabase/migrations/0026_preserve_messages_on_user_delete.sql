-- Safeguard: deleting an auth.users row must NEVER again cascade
-- through the chat MESSAGE history.
--
-- Background: the original 0013 migration declared chat_messages
-- sender_id / recipient_id with `on delete cascade`. When the bulk
-- fake-account wipe ran, Postgres cascade-deleted every chat row
-- that referenced those users on either side, taking real threads
-- with them.
--
-- This migration changes chat_messages FKs to ON DELETE SET NULL
-- and makes the columns nullable so the row survives a user
-- delete. The chat body / timestamp stay intact; only the link to
-- the deleted party becomes NULL, which the UI renders as
-- "(Deleted user)".
--
-- chat_contacts is intentionally left alone: its user_id /
-- contact_id columns are both in the table's primary key and
-- Postgres won't allow nullable PK columns. Losing a contact entry
-- when one side deletes is acceptable -- it's just a thread-list
-- pointer; the message bodies (which is what we actually want to
-- preserve) live in chat_messages and are now safe.
--
-- Idempotent: safe to re-run.

-- ───────────────────────────────────────────────────────────────
-- 1. chat_messages FK rewire
-- ───────────────────────────────────────────────────────────────

alter table public.chat_messages
  drop constraint if exists chat_messages_sender_id_fkey;
alter table public.chat_messages
  drop constraint if exists chat_messages_recipient_id_fkey;

alter table public.chat_messages
  alter column sender_id drop not null,
  alter column recipient_id drop not null;

alter table public.chat_messages
  add constraint chat_messages_sender_id_fkey
  foreign key (sender_id) references auth.users(id) on delete set null;

alter table public.chat_messages
  add constraint chat_messages_recipient_id_fkey
  foreign key (recipient_id) references auth.users(id) on delete set null;

-- ───────────────────────────────────────────────────────────────
-- 2. RLS so the surviving party still sees the thread after their
--    counterparty is deleted (and one of sender_id / recipient_id
--    is now NULL).
-- ───────────────────────────────────────────────────────────────

drop policy if exists "chat_messages read participants" on public.chat_messages;
create policy "chat_messages read participants" on public.chat_messages for select
  using (
    sender_id = auth.uid() or recipient_id = auth.uid()
  );

-- ───────────────────────────────────────────────────────────────
-- 3. get_chat_messages RPC: surface threads whose counterparty
--    has been deleted so the survivor can still read history.
-- ───────────────────────────────────────────────────────────────

drop function if exists public.get_chat_messages(uuid);
create or replace function public.get_chat_messages(other_user_id uuid)
returns table (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  body text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select id, sender_id, recipient_id, body, created_at
  from public.chat_messages
  where (sender_id = auth.uid() and recipient_id = other_user_id)
     or (sender_id = other_user_id and recipient_id = auth.uid())
     -- Edge case: the OTHER side has been deleted, so their
     -- column is NULL. Show me the orphaned messages if I was the
     -- surviving side.
     or (sender_id = auth.uid() and recipient_id is null)
     or (sender_id is null and recipient_id = auth.uid())
  order by created_at asc;
$$;

grant execute on function public.get_chat_messages(uuid) to authenticated;
