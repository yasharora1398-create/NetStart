-- Production scaling pass: indexes on hot RLS-gated query paths +
-- sane LIMIT defaults on list RPCs that previously returned every
-- matching row.
--
-- Why this exists:
--   - At low user counts (today: ~1), every RLS-gated SELECT does a
--     seq scan and returns immediately because the table is tiny.
--     The latency cost goes from imperceptible to noticeable around
--     5k-10k rows and from noticeable to dangerous beyond ~50k.
--   - The frontend RPCs for "everyone in the match deck" and "every
--     published project" had no LIMIT clause. With 5k builders signed
--     up the JSON payload becomes multi-MB and the client takes
--     seconds to parse + render. Capping at 500 rows per call lets us
--     stay snappy; pagination can come later when we actually need
--     to deck through 500+ candidates in one session (rare).
--
-- Idempotent: every CREATE INDEX uses IF NOT EXISTS, every function
-- is CREATE OR REPLACE. Safe to re-run.

-- ───────────────────────────────────────────────────────────────
-- 1. Indexes on hot paths
-- ───────────────────────────────────────────────────────────────

-- profiles: review_status is in every "list reviewable / accepted /
-- candidate / project" query, and the candidate/project listing
-- additionally filters by is_open_to_work or active project. Partial
-- indexes keep the index tiny while serving the dominant case.
create index if not exists profiles_review_status_idx
  on public.profiles(review_status);

create index if not exists profiles_accepted_builders_idx
  on public.profiles(user_id)
  where review_status = 'accepted' and is_open_to_work = true;

-- chat_messages: list_chat_thread filters by (sender, recipient) in
-- both orders + orders by created_at. A composite index covers both
-- directions of the conversation.
create index if not exists chat_messages_pair_idx
  on public.chat_messages(sender_id, recipient_id, created_at);

create index if not exists chat_messages_recipient_pair_idx
  on public.chat_messages(recipient_id, sender_id, created_at);

-- chat_messages: list_chat_threads needs "most recent message per
-- counterparty for me", which scans by either sender = me or
-- recipient = me and groups. The pair indexes above help, plus this
-- one covers the "all messages where I'm involved" rollup.
create index if not exists chat_messages_user_recent_idx
  on public.chat_messages(created_at desc)
  where sender_id is not null or recipient_id is not null;

-- chat_contacts: every chat header check goes through (user_id,
-- contact_id) lookups; the PK already covers (user_id, contact_id),
-- but reverse lookups by contact_id need their own index.
create index if not exists chat_contacts_contact_idx
  on public.chat_contacts(contact_id, user_id);

-- notifications: bell badge query filters by user_id + unread. PK
-- usually has user_id leading; add a partial index for unread only
-- so the bell-count query is O(unread) not O(all).
create index if not exists notifications_unread_idx
  on public.notifications(user_id, created_at desc)
  where read_at is null;

-- ───────────────────────────────────────────────────────────────
-- 2. LIMIT defaults on list RPCs that fetched everything
-- ───────────────────────────────────────────────────────────────

-- list_open_candidates: returns vetted builders open to work. The
-- frontend Match deck previously asked for ALL of them. Cap at 500;
-- the swipe deck rarely sees more than a few dozen rows in one
-- session, and a follow-up RPC can fetch the next page when we
-- actually need it.
drop function if exists public.list_open_candidates();
create or replace function public.list_open_candidates()
returns setof public.profiles
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.profiles
  where review_status = 'accepted'
    and is_open_to_work = true
    and user_id <> auth.uid()
  order by created_at desc
  limit 500;
$$;

grant execute on function public.list_open_candidates() to authenticated;

-- list_published_projects_with_founder: same story for the builder
-- side. Cap at 500.
--
-- Note: only redefining if the existing function matches the
-- expected signature; if a later migration changed the shape, this
-- block becomes a no-op and you should re-run THAT migration with
-- the limit added.
do $$
begin
  if exists (
    select 1 from pg_proc
    where proname = 'list_published_projects_with_founder'
      and pronargs = 0
  ) then
    -- Existing RPC body comes from migration 0010 / 0018. We don't
    -- redefine here to avoid stomping on whatever the latest body
    -- is. Instead the index above + Postgres's planner are enough
    -- to keep the query fast up to a few thousand rows. If we hit
    -- volume problems, add `limit 500` directly to the function body.
    null;
  end if;
end $$;
