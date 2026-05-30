-- Verified founder feature.
--
-- A paid perk (10 cents - payment surface comes later) unlocks three
-- things for a founder:
--   1. is_verified_founder flag - drives a 'Verified' badge + green
--      outline on their card in the Match deck (mirroring the visual
--      treatment of Polln8-recommended posts).
--   2. Extended profile fields - room for a deeper venture
--      description, a pitch link, project links, and references from
--      past collaborators. Standard profiles ignore these columns.
--   3. Click-through behavior - partners who accept a verified
--      founder's card land on the founder's full /u/<id> page
--      (driven by client routing) instead of the slim info panel.
--
-- Payment isn't wired yet; this migration just adds the schema +
-- flips the flag on netstartapp@outlook.com so the developer has a
-- live test account.
--
-- Idempotent: all ALTER + UPDATE statements are safe to re-run.

alter table public.profiles
  add column if not exists is_verified_founder boolean not null default false;

-- Free-form long-form venture / story. Markdown-friendly but stored
-- as plain text; the client decides how to render.
alter table public.profiles
  add column if not exists extended_description text not null default '';

-- External URL the founder pastes for their pitch deck (Google
-- Slides, Notion page, hosted PDF, etc.). Skipping file upload for
-- v1 - cleaner UX + no new storage bucket needed; users already host
-- decks elsewhere.
alter table public.profiles
  add column if not exists pitch_url text not null default '';

-- Array of project links: [{ "title": string, "url": string }, ...].
-- Stored as jsonb so the client can read/write without a side table.
alter table public.profiles
  add column if not exists project_links jsonb not null default '[]'::jsonb;

-- Array of references from past collaborators:
-- [{ "name": string, "role": string, "text": string }, ...]
-- Same storage rationale as project_links.
alter table public.profiles
  add column if not exists collaborator_references jsonb not null default '[]'::jsonb;

-- Bootstrap the Polln8 admin account as verified so the developer
-- can test the entire flow end-to-end without a payment surface.
-- The lookup is case-insensitive against auth.users.email so casing
-- in the email column doesn't matter.
update public.profiles
set is_verified_founder = true
where user_id in (
  select id from auth.users
  where lower(email) = lower('netstartapp@outlook.com')
);

-- Expose the new fields on the public founder RPC so partners
-- visiting /u/<id> can render them. The signature gains five
-- columns; old callers reading by named column still work.
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
  collaborator_references jsonb
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
    coalesce(p.collaborator_references, '[]'::jsonb)
  from public.profiles p
  where p.user_id = target_user_id;
$$;
grant execute on function public.get_public_founder(uuid) to authenticated;
grant execute on function public.get_public_founder(uuid) to anon;
