-- NetStart MyNet schema
-- Paste this into the Supabase SQL editor (Project → SQL Editor → + New query → Run).
-- Idempotent: safe to re-run.

-- Extensions ----------------------------------------------------------
create extension if not exists "pgcrypto";

-- profiles ------------------------------------------------------------
create table if not exists public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  full_name      text,
  linkedin_url   text,
  resume_path    text,
  resume_name    text,
  resume_size    integer,
  resume_uploaded_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- projects ------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text not null default '',
  criteria    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists projects_owner_idx on public.projects(owner_id);

-- saved_people: candidate decisions per project -----------------------
create table if not exists public.saved_people (
  project_id  uuid not null references public.projects(id) on delete cascade,
  person_id   text not null,
  status      text not null check (status in ('saved', 'passed')),
  created_at  timestamptz not null default now(),
  primary key (project_id, person_id)
);
create index if not exists saved_people_project_idx on public.saved_people(project_id);

-- updated_at triggers -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Row Level Security --------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.projects     enable row level security;
alter table public.saved_people enable row level security;

-- profiles: each user owns one row keyed by auth.uid()
drop policy if exists "profiles read own"   on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles delete own" on public.profiles;

create policy "profiles read own"   on public.profiles for select using (user_id = auth.uid());
create policy "profiles insert own" on public.profiles for insert with check (user_id = auth.uid());
create policy "profiles update own" on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "profiles delete own" on public.profiles for delete using (user_id = auth.uid());

-- projects: each user sees their own projects
drop policy if exists "projects read own"   on public.projects;
drop policy if exists "projects insert own" on public.projects;
drop policy if exists "projects update own" on public.projects;
drop policy if exists "projects delete own" on public.projects;

create policy "projects read own"   on public.projects for select using (owner_id = auth.uid());
create policy "projects insert own" on public.projects for insert with check (owner_id = auth.uid());
create policy "projects update own" on public.projects for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "projects delete own" on public.projects for delete using (owner_id = auth.uid());

-- saved_people: gated through ownership of the parent project
drop policy if exists "saved_people read"   on public.saved_people;
drop policy if exists "saved_people insert" on public.saved_people;
drop policy if exists "saved_people update" on public.saved_people;
drop policy if exists "saved_people delete" on public.saved_people;

create policy "saved_people read" on public.saved_people for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "saved_people insert" on public.saved_people for insert
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "saved_people update" on public.saved_people for update
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "saved_people delete" on public.saved_people for delete
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- Auto-create a profile row when a user signs up ----------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage: resumes bucket --------------------------------------------
-- Create the bucket via Dashboard (Storage → New bucket → "resumes", private)
-- OR uncomment the line below if your project allows it from SQL:
-- insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false) on conflict (id) do nothing;

-- Storage policies: each user can only access their own folder (resumes/<uid>/...)
drop policy if exists "resumes read own"   on storage.objects;
drop policy if exists "resumes insert own" on storage.objects;
drop policy if exists "resumes update own" on storage.objects;
drop policy if exists "resumes delete own" on storage.objects;

create policy "resumes read own" on storage.objects for select
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes insert own" on storage.objects for insert
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes update own" on storage.objects for update
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "resumes delete own" on storage.objects for delete
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
