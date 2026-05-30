-- Profile banner image. Cover image at the top of /u/<id>; users
-- (verified founders especially) upload a custom banner to brand the
-- page. Stored as a path into the existing 'avatars' bucket under
-- <uid>/banner/<ts>.<ext> so the public-URL pipeline (getAvatarUrl)
-- just works without a new bucket.
--
-- Empty string = no banner uploaded; the public page renders a
-- neutral gradient placeholder, and on the owner's view the banner
-- area is click-to-upload.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE on the
-- public RPC.

alter table public.profiles
  add column if not exists banner_image_path text not null default '';

-- Extend the public-founder RPC with banner_image_path. Old callers
-- reading by named column still work; the column just appears at the
-- end of the returned row.
drop function if exists public.get_public_founder(uuid);
create function public.get_public_founder(target_user_id uuid)
returns table (
  user_id                 uuid,
  full_name               text,
  headline                text,
  bio                     text,
  skills                  jsonb,
  candidate_location      text,
  candidate_commitment    text,
  linkedin_url            text,
  avatar_path             text,
  is_open_to_work         boolean,
  website_url             text,
  is_verified_founder     boolean,
  extended_description    text,
  pitch_url               text,
  project_links           jsonb,
  collaborator_references jsonb,
  banner_image_path       text
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
    coalesce(p.is_verified_founder, false),
    coalesce(p.extended_description, ''),
    coalesce(p.pitch_url, ''),
    coalesce(p.project_links, '[]'::jsonb),
    coalesce(p.collaborator_references, '[]'::jsonb),
    coalesce(p.banner_image_path, '')
  from public.profiles p
  where p.user_id = target_user_id;
$$;
grant execute on function public.get_public_founder(uuid) to authenticated;
grant execute on function public.get_public_founder(uuid) to anon;
