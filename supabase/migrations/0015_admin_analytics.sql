-- NetStart admin analytics + Polln8 admin email
-- Adds:
--   1. page_views table for unique-per-day visitor tracking.
--   2. Polln8@outlook.com to the admin allow-list (in addition to
--      the existing NetStartapp@outlook.com).
-- Idempotent: safe to re-run.

-- 1. page_views ----------------------------------------------------
-- One row per (device_id, day). Same device hitting the page multiple
-- times in the same calendar day collapses to one row via the unique
-- index + ON CONFLICT DO NOTHING on insert.
create table if not exists public.page_views (
  device_id   text not null,
  day         date not null,
  created_at  timestamptz not null default now(),
  primary key (device_id, day)
);

create index if not exists page_views_day_idx
  on public.page_views(day);

alter table public.page_views enable row level security;

-- Anyone (including anonymous waitlist visitors) can insert their
-- own row. Conflicts on (device_id, day) silently no-op via the
-- client-side ON CONFLICT clause.
drop policy if exists "page_views anon insert" on public.page_views;
create policy "page_views anon insert" on public.page_views for insert
  with check (true);

-- Only admins can read aggregate data.
drop policy if exists "page_views admin read" on public.page_views;
create policy "page_views admin read" on public.page_views for select
  using (public.is_admin());

-- 2. Polln8@outlook.com admin allow-list ---------------------------
-- Update the new-user trigger to flag both admin emails on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, email, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    lower(new.email) in (
      lower('NetStartapp@outlook.com'),
      lower('Polln8@outlook.com')
    )
  )
  on conflict (user_id) do update set
    email = excluded.email,
    is_admin = public.profiles.is_admin or excluded.is_admin;
  return new;
end $$;

-- Backfill: flag any existing Polln8@outlook.com profile as admin.
update public.profiles
set is_admin = true
where user_id in (
  select id from auth.users where lower(email) = lower('Polln8@outlook.com')
);
