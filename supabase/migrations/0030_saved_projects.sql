-- Server-backed store of which projects a builder has saved.
--
-- Before this migration, builder-side "Save" lived only in
-- localStorage, so opening the app on a second device showed an
-- empty Saved tab. The web AuthGate copy explicitly promised
-- cross-device sync, so this was a lie.
--
-- Schema:
--   user_id     — the builder who saved
--   project_id  — the project they saved (cascades on project delete)
--   is_active   — at most one saved project per builder can be marked
--                 active. Mirrors the founder-side "active project"
--                 concept and surfaces as a star icon in the UI.
--   saved_at    — for ordering
--
-- The `is_active` uniqueness is enforced by a partial unique index
-- (Postgres lets you do this without enforcing uniqueness when the
-- flag is false). Setting a new active row requires the caller to
-- clear the previous one first, or use the `set_active_saved_project`
-- RPC below which does it in a single transaction.

create table if not exists public.saved_projects (
  user_id    uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  is_active  boolean not null default false,
  saved_at   timestamptz not null default now(),
  primary key (user_id, project_id)
);

create index if not exists saved_projects_user_idx
  on public.saved_projects (user_id, saved_at desc);

-- At most one active saved project per builder.
create unique index if not exists saved_projects_one_active_per_user
  on public.saved_projects (user_id)
  where is_active = true;

alter table public.saved_projects enable row level security;

-- Users can read / write only their own rows.
drop policy if exists "saved_projects read own" on public.saved_projects;
create policy "saved_projects read own"
  on public.saved_projects for select
  using (auth.uid() = user_id);

drop policy if exists "saved_projects insert own" on public.saved_projects;
create policy "saved_projects insert own"
  on public.saved_projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_projects update own" on public.saved_projects;
create policy "saved_projects update own"
  on public.saved_projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saved_projects delete own" on public.saved_projects;
create policy "saved_projects delete own"
  on public.saved_projects for delete
  using (auth.uid() = user_id);

-- Returns the builder's saved projects with the same fields the
-- list_published_projects RPC returns, so the client can render them
-- without a separate founder-lookup roundtrip.
create or replace function public.list_saved_projects()
returns table (
  id                  uuid,
  owner_id            uuid,
  title               text,
  description         text,
  criteria            jsonb,
  business_type       text,
  lifecycle_state     text,
  created_at          timestamptz,
  founder_full_name   text,
  founder_headline    text,
  founder_avatar_path text,
  is_active           boolean,
  saved_at            timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.owner_id,
    p.title,
    p.description,
    p.criteria,
    coalesce(p.business_type, '')                as business_type,
    coalesce(p.lifecycle_state, 'active')        as lifecycle_state,
    p.created_at,
    coalesce(prof.full_name, '')                 as founder_full_name,
    coalesce(prof.headline, '')                  as founder_headline,
    prof.avatar_path                             as founder_avatar_path,
    sp.is_active,
    sp.saved_at
  from public.saved_projects sp
  join public.projects p on p.id = sp.project_id
  left join public.profiles prof on prof.user_id = p.owner_id
  where sp.user_id = auth.uid()
  order by sp.saved_at desc;
$$;

grant execute on function public.list_saved_projects() to authenticated;

-- Set or clear the builder's active saved project in a single
-- transaction. Pass null to clear. Pass a project_id that exists in
-- the builder's saved_projects to flip it on (and any previous
-- active row off).
create or replace function public.set_active_saved_project(
  target_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_project_id is null then
    update public.saved_projects
       set is_active = false
     where user_id = auth.uid()
       and is_active = true;
    return;
  end if;

  -- Verify the caller owns a saved row for this project.
  if not exists (
    select 1 from public.saved_projects
     where user_id = auth.uid()
       and project_id = target_project_id
  ) then
    raise exception 'project not in saved list';
  end if;

  update public.saved_projects
     set is_active = false
   where user_id = auth.uid()
     and is_active = true
     and project_id <> target_project_id;

  update public.saved_projects
     set is_active = true
   where user_id = auth.uid()
     and project_id = target_project_id;
end;
$$;

grant execute on function public.set_active_saved_project(uuid) to authenticated;
