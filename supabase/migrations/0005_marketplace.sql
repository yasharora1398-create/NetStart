-- NetStart marketplace
-- Adds candidate-side fields, project publishing, and applications.
-- Idempotent: safe to re-run.

-- 1. Candidate fields on profiles ------------------------------------
alter table public.profiles add column if not exists headline text not null default '';
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists skills jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists candidate_location text not null default '';
alter table public.profiles add column if not exists candidate_commitment text not null default '';
alter table public.profiles add column if not exists is_open_to_work boolean not null default false;

-- 2. Project publishing ----------------------------------------------
alter table public.projects add column if not exists is_published boolean not null default false;
create index if not exists projects_published_idx on public.projects(is_published) where is_published = true;

-- 3. Applications table ----------------------------------------------
create table if not exists public.applications (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  candidate_user_id  uuid not null references auth.users(id) on delete cascade,
  message            text not null default '',
  status             text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (project_id, candidate_user_id)
);
create index if not exists applications_project_idx on public.applications(project_id);
create index if not exists applications_candidate_idx on public.applications(candidate_user_id);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

alter table public.applications enable row level security;

drop policy if exists "applications candidate select own" on public.applications;
create policy "applications candidate select own" on public.applications for select
  using (candidate_user_id = auth.uid());

drop policy if exists "applications candidate insert own" on public.applications;
create policy "applications candidate insert own" on public.applications for insert
  with check (candidate_user_id = auth.uid());

drop policy if exists "applications candidate update own" on public.applications;
create policy "applications candidate update own" on public.applications for update
  using (candidate_user_id = auth.uid())
  with check (candidate_user_id = auth.uid());

drop policy if exists "applications owner select" on public.applications;
create policy "applications owner select" on public.applications for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

drop policy if exists "applications owner update" on public.applications;
create policy "applications owner update" on public.applications for update
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- 4. Public projects RLS --------------------------------------------
-- Published projects are readable by any authenticated user.
drop policy if exists "projects read published" on public.projects;
create policy "projects read published" on public.projects for select
  using (is_published = true);

-- 5. Candidate discovery via SECURITY DEFINER functions -------------
-- Direct RLS would expose every column on a candidate's profile row;
-- the function pattern lets us return only safe public fields.
create or replace function public.list_open_candidates()
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
  resume_path          text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id, coalesce(p.full_name, ''),
    coalesce(p.linkedin_url, ''),
    p.headline, p.bio, p.skills,
    p.candidate_location, p.candidate_commitment,
    p.resume_name, p.resume_path
  from public.profiles p
  where p.is_open_to_work = true
    and p.review_status = 'accepted'
    and p.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
$$;

grant execute on function public.list_open_candidates() to authenticated;

create or replace function public.get_candidates_by_ids(ids uuid[])
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
  resume_path          text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id, coalesce(p.full_name, ''),
    coalesce(p.linkedin_url, ''),
    p.headline, p.bio, p.skills,
    p.candidate_location, p.candidate_commitment,
    p.resume_name, p.resume_path
  from public.profiles p
  where p.user_id = any(ids);
$$;

grant execute on function public.get_candidates_by_ids(uuid[]) to authenticated;

-- 6. Per-project applications joined with applicant data -------------
create or replace function public.list_applications_for_project(p_id uuid)
returns table (
  application_id        uuid,
  message               text,
  status                text,
  created_at            timestamptz,
  candidate_user_id     uuid,
  candidate_full_name   text,
  candidate_linkedin    text,
  candidate_headline    text,
  candidate_skills      jsonb,
  candidate_location    text,
  candidate_commitment  text,
  candidate_resume_name text,
  candidate_resume_path text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.projects where id = p_id and owner_id = auth.uid()
  ) then
    raise exception 'not authorized';
  end if;

  return query
    select
      a.id, a.message, a.status, a.created_at,
      a.candidate_user_id,
      coalesce(p.full_name, ''),
      coalesce(p.linkedin_url, ''),
      p.headline, p.skills,
      p.candidate_location, p.candidate_commitment,
      p.resume_name, p.resume_path
    from public.applications a
    join public.profiles p on p.user_id = a.candidate_user_id
    where a.project_id = p_id
    order by a.created_at desc;
end $$;

grant execute on function public.list_applications_for_project(uuid) to authenticated;

-- 7. Outgoing applications joined with project data ------------------
create or replace function public.list_my_applications()
returns table (
  application_id     uuid,
  message            text,
  status             text,
  created_at         timestamptz,
  project_id         uuid,
  project_title      text,
  project_description text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id, a.message, a.status, a.created_at,
    a.project_id, pr.title, pr.description
  from public.applications a
  join public.projects pr on pr.id = a.project_id
  where a.candidate_user_id = auth.uid()
  order by a.created_at desc;
$$;

grant execute on function public.list_my_applications() to authenticated;

-- 8. Resume access for project owners reviewing applicants -----------
-- Owners can read resume files for users who applied to their projects.
drop policy if exists "resumes owner read applicants" on storage.objects;
create policy "resumes owner read applicants" on storage.objects for select
  using (
    bucket_id = 'resumes'
    and exists (
      select 1
      from public.applications a
      join public.projects pr on pr.id = a.project_id
      join public.profiles pf on pf.user_id = a.candidate_user_id
      where pr.owner_id = auth.uid()
        and pf.resume_path = storage.objects.name
    )
  );
