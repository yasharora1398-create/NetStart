-- Revert migration 0039: the verified-founder paid perk concept is
-- being removed entirely. Drops the five columns it added and
-- rebuilds get_public_founder() without them. Banner column (added
-- in 0040) stays.
--
-- Idempotent: DROP COLUMN IF EXISTS + CREATE OR REPLACE on the RPC.

alter table public.profiles
  drop column if exists is_verified_founder,
  drop column if exists extended_description,
  drop column if exists pitch_url,
  drop column if exists project_links,
  drop column if exists collaborator_references;

-- Rebuild the public-founder RPC so it no longer references the
-- dropped columns. Same field order it had after migration 0040,
-- minus the verified-perk fields.
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
  website_url          text,
  banner_image_path    text
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
    coalesce(p.website_url, ''),
    coalesce(p.banner_image_path, '')
  from public.profiles p
  where p.user_id = target_user_id;
$$;
grant execute on function public.get_public_founder(uuid) to authenticated;
grant execute on function public.get_public_founder(uuid) to anon;
