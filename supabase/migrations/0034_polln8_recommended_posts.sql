-- Polln8-recommended posts. Admin posts a startup card on behalf of
-- someone else; the card shows that named person as the founder and
-- gets a 'Recommended by Polln8' badge on the partner side of the
-- Match deck.
--
-- Three columns on public.projects:
--   is_polln8_recommended   - boolean flag. Filter on this in the
--                              RPC so the partner-side deck can apply
--                              the green outline + badge.
--   polln8_founder_name     - free-text founder name to display in
--                              place of the project owner's profile
--                              name. Used only when
--                              is_polln8_recommended is true.
--   polln8_founder_headline - matching free-text headline.
--
-- The project itself is still owned by the admin's user_id so the
-- existing chat / save / decline flows work without changes; the
-- partner side just renders a different name + style based on the
-- flag.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE on the RPC.

alter table public.projects
  add column if not exists is_polln8_recommended boolean not null default false;

alter table public.projects
  add column if not exists polln8_founder_name text not null default '';

alter table public.projects
  add column if not exists polln8_founder_headline text not null default '';

alter table public.projects
  add column if not exists polln8_founder_website text not null default '';

create index if not exists projects_polln8_recommended_idx
  on public.projects(is_polln8_recommended) where is_polln8_recommended = true;

-- Update the public-facing RPC so the new fields flow to the client.
-- We keep founder_full_name / founder_headline / founder_avatar
-- returning the joined profile values (the client picks which to
-- display based on is_polln8_recommended); polln8_founder_name and
-- polln8_founder_headline ride along as separate columns.
drop function if exists public.list_published_projects_with_founder();
create function public.list_published_projects_with_founder()
returns table (
  id                       uuid,
  owner_id                 uuid,
  title                    text,
  description              text,
  criteria                 jsonb,
  created_at               timestamptz,
  founder_full_name        text,
  founder_headline         text,
  founder_avatar           text,
  business_type            text,
  is_polln8_recommended    boolean,
  polln8_founder_name      text,
  polln8_founder_headline  text,
  polln8_founder_website   text
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
    coalesce(pr.is_polln8_recommended, false),
    coalesce(pr.polln8_founder_name, ''),
    coalesce(pr.polln8_founder_headline, ''),
    coalesce(pr.polln8_founder_website, '')
  from public.projects pr
  left join public.profiles p on p.user_id = pr.owner_id
  where pr.is_published = true
  order by
    -- Polln8 recommendations float to the top of the deck so the
    -- curated picks land in front of partners first.
    coalesce(pr.is_polln8_recommended, false) desc,
    pr.created_at desc;
$$;
grant execute on function public.list_published_projects_with_founder() to authenticated;
