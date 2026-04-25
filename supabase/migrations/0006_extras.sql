-- NetStart marketplace extras
-- Avatars, notifications, mutual contact exchange.
-- Idempotent: safe to re-run.

-- 1. Avatars ---------------------------------------------------------
alter table public.profiles add column if not exists avatar_path text;

-- Storage policies for the 'avatars' bucket. Bucket must be created in
-- Supabase Dashboard (Storage -> New bucket -> 'avatars', PUBLIC = ON).
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars insert own" on storage.objects;
create policy "avatars insert own" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Notifications ---------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in (
    'application_received',
    'application_accepted',
    'application_rejected',
    'profile_accepted',
    'profile_rejected'
  )),
  title       text not null,
  body        text not null default '',
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id) where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications delete own" on public.notifications;
create policy "notifications delete own" on public.notifications for delete
  using (user_id = auth.uid());

-- 3. Triggers that emit notifications -------------------------------
create or replace function public.notify_application_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  proj record;
  candidate_name text;
begin
  select id, owner_id, title into proj from public.projects where id = new.project_id;
  if proj.id is null then return new; end if;

  if tg_op = 'INSERT' then
    select coalesce(full_name, '') into candidate_name
    from public.profiles where user_id = new.candidate_user_id;
    insert into public.notifications (user_id, type, title, body, link)
    values (
      proj.owner_id,
      'application_received',
      'New application',
      coalesce(nullif(candidate_name, ''), 'A candidate') || ' applied to ' || proj.title,
      '/mynet'
    );
  elsif tg_op = 'UPDATE' and new.status <> old.status then
    if new.status = 'accepted' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.candidate_user_id,
        'application_accepted',
        'Application accepted',
        proj.title || ' accepted your application.',
        '/mynet'
      );
    elsif new.status = 'rejected' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.candidate_user_id,
        'application_rejected',
        'Application rejected',
        proj.title || ' passed on your application.',
        '/mynet'
      );
    end if;
  end if;

  return new;
end $$;

drop trigger if exists applications_notify on public.applications;
create trigger applications_notify
  after insert or update on public.applications
  for each row execute function public.notify_application_event();

create or replace function public.notify_profile_review_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.review_status is distinct from old.review_status then
    if new.review_status = 'accepted' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.user_id,
        'profile_accepted',
        'Profile accepted',
        'You can now create projects and be discovered as a candidate.',
        '/mynet'
      );
    elsif new.review_status = 'rejected' then
      insert into public.notifications (user_id, type, title, body, link)
      values (
        new.user_id,
        'profile_rejected',
        'Profile rejected',
        coalesce(nullif(new.review_reason, ''), 'Update your credentials and resubmit.'),
        '/mynet'
      );
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_notify_review on public.profiles;
create trigger profiles_notify_review
  after update on public.profiles
  for each row execute function public.notify_profile_review_event();

-- 4. Updated RPCs to include avatar_path + founder contact -----------
drop function if exists public.list_open_candidates();
create function public.list_open_candidates()
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
  resume_path          text,
  avatar_path          text
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
    p.resume_name, p.resume_path, p.avatar_path
  from public.profiles p
  where p.is_open_to_work = true
    and p.review_status = 'accepted'
    and p.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
$$;
grant execute on function public.list_open_candidates() to authenticated;

drop function if exists public.get_candidates_by_ids(uuid[]);
create function public.get_candidates_by_ids(ids uuid[])
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
  resume_path          text,
  avatar_path          text
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
    p.resume_name, p.resume_path, p.avatar_path
  from public.profiles p
  where p.user_id = any(ids);
$$;
grant execute on function public.get_candidates_by_ids(uuid[]) to authenticated;

drop function if exists public.list_applications_for_project(uuid);
create function public.list_applications_for_project(p_id uuid)
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
  candidate_resume_path text,
  candidate_avatar_path text
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
      p.resume_name, p.resume_path, p.avatar_path
    from public.applications a
    join public.profiles p on p.user_id = a.candidate_user_id
    where a.project_id = p_id
    order by a.created_at desc;
end $$;
grant execute on function public.list_applications_for_project(uuid) to authenticated;

-- Outgoing applications now expose founder contact when status = accepted
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
  order by a.created_at desc;
$$;
grant execute on function public.list_my_applications() to authenticated;
