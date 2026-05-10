-- NetStart application archive
-- Adds per-side dismissal so each user can hide a resolved application
-- from their applications tab without affecting the other side's view,
-- plus an RPC for founders to list every application across all of
-- their projects in one shot.
-- Idempotent: safe to re-run.

-- 1. Per-side archive timestamps -----------------------------------
alter table public.applications
  add column if not exists candidate_archived_at timestamptz,
  add column if not exists owner_archived_at timestamptz;

-- 2. Update list_my_applications to filter the candidate's archive --
drop function if exists public.list_my_applications();
create function public.list_my_applications()
returns table (
  application_id      uuid,
  message             text,
  status              text,
  created_at          timestamptz,
  project_id          uuid,
  project_title       text,
  project_description text,
  founder_full_name   text,
  founder_linkedin    text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id, a.message, a.status, a.created_at,
    a.project_id, pr.title, pr.description,
    case when a.status = 'accepted' then coalesce(fp.full_name, '') else null end,
    case when a.status = 'accepted' then coalesce(fp.linkedin_url, '') else null end
  from public.applications a
  join public.projects pr on pr.id = a.project_id
  left join public.profiles fp on fp.user_id = pr.owner_id
  where a.candidate_user_id = auth.uid()
    and a.candidate_archived_at is null
  order by a.created_at desc;
$$;
grant execute on function public.list_my_applications() to authenticated;

-- 3. Founder-side: every application across every owned project ----
create or replace function public.list_received_applications()
returns table (
  application_id        uuid,
  message               text,
  status                text,
  created_at            timestamptz,
  project_id            uuid,
  project_title         text,
  candidate_user_id     uuid,
  candidate_full_name   text,
  candidate_linkedin    text,
  candidate_headline    text,
  candidate_skills      jsonb,
  candidate_location    text,
  candidate_commitment  text,
  candidate_resume_name text,
  candidate_resume_path text,
  candidate_avatar_path text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id, a.message, a.status, a.created_at,
    pr.id, pr.title,
    pf.user_id, coalesce(pf.full_name, ''), coalesce(pf.linkedin_url, ''),
    coalesce(pf.headline, ''), coalesce(pf.skills, '[]'::jsonb),
    coalesce(pf.candidate_location, ''), coalesce(pf.candidate_commitment, ''),
    pf.resume_name, pf.resume_path, pf.avatar_path
  from public.applications a
  join public.projects pr on pr.id = a.project_id
  left join public.profiles pf on pf.user_id = a.candidate_user_id
  where pr.owner_id = auth.uid()
    and a.owner_archived_at is null
  order by a.created_at desc;
$$;
grant execute on function public.list_received_applications() to authenticated;

-- 4. Archive RPCs ---------------------------------------------------
-- Each side can only archive its own view of the application. We
-- gate by the calling user's role on the row (candidate vs project
-- owner) inside the function instead of relying on a column flag.
create or replace function public.archive_application_for_candidate(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.applications
  set candidate_archived_at = now()
  where id = app_id
    and candidate_user_id = auth.uid()
    and status in ('accepted', 'rejected', 'withdrawn');
end $$;
grant execute on function public.archive_application_for_candidate(uuid) to authenticated;

create or replace function public.archive_application_for_owner(app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.applications
  set owner_archived_at = now()
  where id = app_id
    and exists (
      select 1 from public.projects p
      where p.id = applications.project_id
        and p.owner_id = auth.uid()
    )
    and status in ('accepted', 'rejected', 'withdrawn');
end $$;
grant execute on function public.archive_application_for_owner(uuid) to authenticated;
