-- Polln8 recommendation logo / founder photo. Admin can upload an
-- image when posting (or editing) a recommendation; the partner-side
-- Match card uses this image as the founder photo instead of the
-- silhouette fallback.
--
-- Stored as a path into the existing 'avatars' bucket so the public
-- URL resolution path (getAvatarUrl) just works without a new
-- storage bucket.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE on the RPC.

alter table public.projects
  add column if not exists polln8_founder_avatar_path text not null default '';

drop function if exists public.list_published_projects_with_founder();
create function public.list_published_projects_with_founder()
returns table (
  id                          uuid,
  owner_id                    uuid,
  title                       text,
  description                 text,
  criteria                    jsonb,
  created_at                  timestamptz,
  founder_full_name           text,
  founder_headline            text,
  founder_avatar              text,
  business_type               text,
  is_polln8_recommended       boolean,
  polln8_founder_name         text,
  polln8_founder_headline     text,
  polln8_founder_website      text,
  polln8_founder_avatar_path  text
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
    coalesce(pr.polln8_founder_website, ''),
    coalesce(pr.polln8_founder_avatar_path, '')
  from public.projects pr
  left join public.profiles p on p.user_id = pr.owner_id
  where pr.is_published = true
  order by
    coalesce(pr.is_polln8_recommended, false) desc,
    pr.created_at desc;
$$;
grant execute on function public.list_published_projects_with_founder() to authenticated;
