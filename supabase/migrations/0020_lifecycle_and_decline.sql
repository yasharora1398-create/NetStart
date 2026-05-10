-- Stages 2 + 4 followups.
--
-- 1. Project lifecycle states
--    Founders mark a project as filled / paused / closed once they've
--    found someone or stepped away. Browse / Search hide non-active
--    projects so builders don't waste pitches on dead listings.
--
-- 2. Chat decline + per-side delete
--    Recipient can now Decline a chat request instead of leaving it
--    pending forever. A declined thread shows the requester a
--    blurred-out "declined" card. Either party can then Delete the
--    thread, which scrubs THEIR side of chat_contacts (the other
--    side keeps their copy until they delete too).
--
-- Idempotent: safe to re-run.

-- 1. Project lifecycle ----------------------------------------------
alter table public.projects
  add column if not exists lifecycle_state text not null default 'active'
    check (lifecycle_state in ('active', 'paused', 'filled', 'closed'));

create index if not exists projects_lifecycle_idx
  on public.projects(lifecycle_state)
  where lifecycle_state = 'active';

-- Update list_published_projects_with_founder so Browse / Search
-- only surface active published projects.
drop function if exists public.list_published_projects_with_founder();
create function public.list_published_projects_with_founder()
returns table (
  id                  uuid,
  owner_id            uuid,
  title               text,
  description         text,
  criteria            jsonb,
  created_at          timestamptz,
  founder_full_name   text,
  founder_headline    text,
  founder_avatar      text,
  business_type       text,
  lifecycle_state     text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pr.id, pr.owner_id, pr.title, pr.description, pr.criteria,
    pr.created_at,
    coalesce(p.full_name, ''),
    coalesce(p.headline, ''),
    p.avatar_path,
    coalesce(pr.business_type, ''),
    pr.lifecycle_state
  from public.projects pr
  left join public.profiles p on p.user_id = pr.owner_id
  where pr.is_published = true
    and pr.lifecycle_state = 'active'
  order by pr.created_at desc;
$$;
grant execute on function public.list_published_projects_with_founder() to authenticated;

-- 2. Chat decline ---------------------------------------------------
alter table public.chat_contacts
  add column if not exists declined_at timestamptz;

-- Decline RPC. Recipient calls it when they don't want to chat.
-- Stamps declined_at on the requester's row so the requester sees
-- the "declined" state. We deliberately don't insert a notification
-- here - the decline is silent on the requester's notification feed,
-- it just shows in their thread view.
create or replace function public.decline_chat_thread(
  requester_user_id uuid
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
  if requester_user_id is null or requester_user_id = auth.uid() then
    raise exception 'invalid requester';
  end if;

  update public.chat_contacts
    set declined_at = coalesce(declined_at, now())
    where user_id = requester_user_id
      and contact_id = auth.uid();
end $$;
grant execute on function public.decline_chat_thread(uuid) to authenticated;

-- 3. Per-side delete ------------------------------------------------
-- Removes the caller's chat_contacts row(s) involving `other_user_id`.
-- The other party keeps their row until they delete too. We don't
-- delete chat_messages - they're tied to RLS-restricted reads, so
-- once both contact rows are gone the messages effectively vanish
-- from both sides. Keeping the rows lets either party recover them
-- by sending a fresh request later.
create or replace function public.delete_chat_thread(
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
  if other_user_id is null or other_user_id = auth.uid() then
    raise exception 'invalid other';
  end if;

  -- Drop my outbound row to them.
  delete from public.chat_contacts
    where user_id = auth.uid()
      and contact_id = other_user_id;
  -- Drop the inbound row from them to me too. Without this the
  -- thread reappears in my list whenever they send another message.
  delete from public.chat_contacts
    where user_id = other_user_id
      and contact_id = auth.uid();
end $$;
grant execute on function public.delete_chat_thread(uuid) to authenticated;

-- 4. Surface decline state in get_chat_thread_state -----------------
-- Adds 'declined' to the possible state values. Existing return
-- shape unchanged so the frontend can switch on the new variant.
create or replace function public.get_chat_thread_state(
  other_user_id uuid
)
returns table (
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

  select c.accepted_at, c.declined_at, c.request_message_count, c.request_window_start_at
  into outbound
  from public.chat_contacts c
  where c.user_id = auth.uid()
    and c.contact_id = other_user_id;

  select c.accepted_at, c.declined_at, c.request_message_count, c.request_window_start_at
  into inbound
  from public.chat_contacts c
  where c.user_id = other_user_id
    and c.contact_id = auth.uid();

  -- Decline trumps everything: if either side has a declined_at,
  -- the thread is dead until someone deletes it.
  if outbound.declined_at is not null or inbound.declined_at is not null then
    return query
      select 'declined'::text,
             coalesce(outbound.accepted_at, inbound.accepted_at),
             0, null::timestamptz;
    return;
  end if;

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

-- 5. Surface decline in list_chat_threads --------------------------
-- "declined" rows still appear in the list (so users can delete or
-- see the status), but with state=declined. Drop first so re-running
-- on a DB that still has the 0013-shape function (4 cols) doesn't
-- trip the OUT-parameter check.
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
    select contact_id as other_id, accepted_at, declined_at
    from public.chat_contacts
    where user_id = auth.uid()
    union
    select user_id as other_id, accepted_at, declined_at
    from public.chat_contacts
    where contact_id = auth.uid()
  ),
  rolled as (
    select other_id,
           bool_or(accepted_at is not null) as is_accepted,
           bool_or(declined_at is not null) as is_declined,
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
    c.accepted_at
  from ranked r
  full outer join rolled c on c.other_id = r.other_id and r.rn = 1
  where (r.rn = 1 or r.rn is null)
    and coalesce(r.other_id, c.other_id) is not null
  order by coalesce(r.created_at, c.accepted_at) desc nulls last;
$$;
grant execute on function public.list_chat_threads() to authenticated;

-- 6. Project lifecycle setter --------------------------------------
-- Owner-only. Validates the state value and writes it.
create or replace function public.set_project_lifecycle(
  project_id uuid,
  new_state text
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
  if new_state not in ('active', 'paused', 'filled', 'closed') then
    raise exception 'invalid lifecycle state';
  end if;

  update public.projects
    set lifecycle_state = new_state
    where id = project_id
      and owner_id = auth.uid();
end $$;
grant execute on function public.set_project_lifecycle(uuid, text) to authenticated;
