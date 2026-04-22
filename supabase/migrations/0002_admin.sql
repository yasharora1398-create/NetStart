-- NetStart admin access
-- Adds is_admin flag, email column, admin RLS for profiles + storage.
-- Idempotent: safe to re-run.

-- 1. Schema changes -------------------------------------------------
alter table public.profiles
  add column if not exists email text;

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Helper: is_admin() --------------------------------------------
-- SECURITY DEFINER avoids RLS recursion when policies reference it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where user_id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- 3. Updated new-user trigger --------------------------------------
-- Stores email and auto-flags the admin account on signup.
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
    lower(new.email) = lower('NetStartapp@outlook.com')
  )
  on conflict (user_id) do update set
    email = excluded.email,
    is_admin = public.profiles.is_admin or excluded.is_admin;
  return new;
end $$;

-- 4. Backfill existing rows ----------------------------------------
update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and (p.email is null or p.email = '');

update public.profiles
set is_admin = true
where user_id in (
  select id from auth.users where lower(email) = lower('NetStartapp@outlook.com')
);

-- 5. Admin RLS on profiles -----------------------------------------
drop policy if exists "profiles admin read all" on public.profiles;
create policy "profiles admin read all" on public.profiles for select
  using (public.is_admin());

-- 6. Admin RLS on storage.objects (resumes bucket) -----------------
drop policy if exists "resumes admin read all" on storage.objects;
create policy "resumes admin read all" on storage.objects for select
  using (bucket_id = 'resumes' and public.is_admin());
