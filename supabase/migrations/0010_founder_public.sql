-- NetStart public founder profile
-- Single RPC returning a founder's public-facing profile fields plus their
-- published projects, so the /u/:id page can render in one round trip.
-- Idempotent: safe to re-run.

drop function if exists public.get_public_founder(uuid);
create function public.get_public_founder(target_user_id uuid)
returns table (
  user_id              uuid,
  full_name            text,
  headline             text,
  bio                  text,
  skills               jsonb,
  candidate_location   text,
  candidate_commitment text,
  linkedin_url         text,
  avatar_path          text,
  is_open_to_work      boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    coalesce(p.full_name, ''),
    coalesce(p.headline, ''),
    coalesce(p.bio, ''),
    p.skills,
    coalesce(p.candidate_location, ''),
    coalesce(p.candidate_commitment, ''),
    coalesce(p.linkedin_url, ''),
    p.avatar_path,
    coalesce(p.is_open_to_work, false)
  from public.profiles p
  where p.user_id = target_user_id;
$$;
grant execute on function public.get_public_founder(uuid) to authenticated;

drop function if exists public.list_published_projects_for_owner(uuid);
create function public.list_published_projects_for_owner(target_user_id uuid)
returns table (
  id          uuid,
  owner_id    uuid,
  title       text,
  description text,
  criteria    jsonb,
  created_at  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.owner_id, p.title, p.description,
    p.criteria, p.created_at
  from public.projects p
  where p.is_published = true
    and p.owner_id = target_user_id
  order by p.created_at desc;
$$;
grant execute on function public.list_published_projects_for_owner(uuid) to authenticated;
