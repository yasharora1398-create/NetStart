-- Public founder profile gains website_url.
--
-- Stage 2 added `website_url` to public.profiles (and the founder
-- credentials wizard captures it), but the public profile page could
-- never surface it because get_public_founder didn't expose it. This
-- migration adds the column to the RPC's return shape; the frontend
-- renders the link next to LinkedIn.
--
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
  is_open_to_work      boolean,
  website_url          text
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
    coalesce(p.is_open_to_work, false),
    coalesce(p.website_url, '')
  from public.profiles p
  where p.user_id = target_user_id;
$$;
grant execute on function public.get_public_founder(uuid) to authenticated;
