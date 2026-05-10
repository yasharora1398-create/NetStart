-- Project business type + per-user active project pointer.
-- Adds two unrelated-but-small fields:
--   1. projects.business_type      - one-of from BUSINESS_TYPE_OPTIONS;
--                                    drives the builder-side Search
--                                    "what kind of business" filter.
--   2. profiles.active_project_id  - nullable FK to the founder's
--                                    currently-focused project. Drives
--                                    Browse / Search ranking on mobile;
--                                    cleared on delete via ON DELETE SET NULL.
-- Idempotent: safe to re-run.

alter table public.projects
  add column if not exists business_type text not null default '';

create index if not exists projects_business_type_idx
  on public.projects(business_type);

alter table public.profiles
  add column if not exists active_project_id uuid
    references public.projects(id) on delete set null;

-- Update list_published_projects_with_founder so the new column flows
-- to the mobile/web Browse tab. Read-side only, signature appends
-- founder_avatar already; we add business_type at the end.
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
  business_type       text
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
    coalesce(pr.business_type, '')
  from public.projects pr
  left join public.profiles p on p.user_id = pr.owner_id
  where pr.is_published = true
  order by pr.created_at desc;
$$;
grant execute on function public.list_published_projects_with_founder() to authenticated;
