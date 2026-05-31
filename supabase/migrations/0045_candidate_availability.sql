-- Three-state candidate availability. Replaces the binary
-- is_open_to_work flag with a tri-state column that gives users
-- a middle option ("discoverable") for "don't deal me into the
-- founder Match deck, but let founders find me when they're
-- actively searching for someone for their project."
--
-- States:
--   closed         - hide me everywhere. Default.
--   discoverable   - hidden from the swipe deck (list_open_candidates),
--                    surfaced when a founder runs a project search
--                    via FindPeopleSheet (list_searchable_candidates +
--                    match_candidates_for_project).
--   open           - in the swipe deck AND in search.
--
-- is_open_to_work stays on the table for now (acts as a mirror of
-- availability='open') so any legacy code that still reads the old
-- column keeps working. A future migration can drop it.

alter table public.profiles
  add column if not exists availability text not null default 'closed';

-- Tag the constraint by name so it's idempotent on re-run.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_availability_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_availability_check
      check (availability in ('closed', 'discoverable', 'open'));
  end if;
end $$;

-- Backfill: any existing row where is_open_to_work was true gets
-- 'open'. Default 'closed' already covers everyone else. Skip rows
-- that already have a non-default availability so re-running the
-- migration doesn't clobber values someone has already changed
-- through the new UI.
update public.profiles
set availability = 'open'
where is_open_to_work = true
  and availability = 'closed';

-- Keep is_open_to_work in sync as a write-only mirror via a trigger.
-- The new UI writes availability; older code paths that still read
-- is_open_to_work see the correct value. Drop the trigger + column
-- in a follow-up migration once nothing reads is_open_to_work
-- anymore.
create or replace function public.sync_is_open_to_work()
returns trigger language plpgsql as $$
begin
  new.is_open_to_work := (new.availability = 'open');
  return new;
end $$;

drop trigger if exists profiles_sync_open_to_work on public.profiles;
create trigger profiles_sync_open_to_work
  before insert or update of availability on public.profiles
  for each row execute function public.sync_is_open_to_work();

-- Update list_open_candidates to filter on availability = 'open'
-- so the swipe Match deck only surfaces fully-open candidates.
drop function if exists public.list_open_candidates();
create function public.list_open_candidates()
returns setof public.profiles
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.profiles
  where review_status = 'accepted'
    and availability = 'open'
    and user_id <> auth.uid()
  order by created_at desc
  limit 500;
$$;
grant execute on function public.list_open_candidates() to authenticated;

-- New: list_searchable_candidates returns both 'open' AND
-- 'discoverable'. Used by FindPeopleSheet (project-side founder
-- search) so users who turn on "discoverable" appear when a
-- founder actively looks for someone for their project, but stay
-- out of the swipe deck.
drop function if exists public.list_searchable_candidates();
create function public.list_searchable_candidates()
returns setof public.profiles
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.profiles
  where review_status = 'accepted'
    and availability in ('open', 'discoverable')
    and user_id <> auth.uid()
  order by created_at desc
  limit 500;
$$;
grant execute on function public.list_searchable_candidates() to authenticated;

-- Update the AI vector-matching RPC the same way: founder-side
-- search should see 'open' + 'discoverable'.
drop function if exists public.match_candidates_for_project(uuid);
create function public.match_candidates_for_project(p_id uuid)
returns table (
  user_id              uuid,
  full_name            text,
  linkedin_url         text,
  headline             text,
  bio                  text,
  skills               jsonb,
  candidate_location   text,
  candidate_commitment text,
  resume_name          text,
  resume_path          text,
  avatar_path          text,
  similarity           real
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  proj_emb vector(768);
begin
  select embedding into proj_emb
  from public.projects where id = p_id;

  return query
    select
      p.user_id, coalesce(p.full_name, ''),
      coalesce(p.linkedin_url, ''),
      p.headline, p.bio, p.skills,
      p.candidate_location, p.candidate_commitment,
      p.resume_name, p.resume_path, p.avatar_path,
      case
        when proj_emb is null or p.embedding is null then 0::real
        else (1.0 - (p.embedding <=> proj_emb))::real
      end as similarity
    from public.profiles p
    where p.availability in ('open', 'discoverable')
      and p.review_status = 'accepted'
      and p.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    order by similarity desc nulls last;
end $$;
grant execute on function public.match_candidates_for_project(uuid) to authenticated;
