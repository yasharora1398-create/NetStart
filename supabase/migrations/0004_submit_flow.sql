-- NetStart submit flow
-- Adds 'draft' state so users can edit credentials before sending to admin.
-- Idempotent: safe to re-run.

-- 1. Allow 'draft' as a status, default new rows to 'draft' ----------
alter table public.profiles drop constraint if exists profiles_review_status_check;
alter table public.profiles
  add constraint profiles_review_status_check
  check (review_status in ('draft', 'pending', 'accepted', 'rejected'));

alter table public.profiles alter column review_status set default 'draft';

-- 2. Backfill ------------------------------------------------------
-- Admins skip the queue. Everyone else stays in their current state.
update public.profiles
set review_status = 'accepted'
where is_admin = true and review_status <> 'accepted';

-- 3. New-user trigger uses 'draft' -----------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin_user boolean := lower(new.email) = lower('NetStartapp@outlook.com');
begin
  insert into public.profiles (user_id, full_name, email, is_admin, review_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    is_admin_user,
    case when is_admin_user then 'accepted' else 'draft' end
  )
  on conflict (user_id) do update set
    email = excluded.email,
    is_admin = public.profiles.is_admin or excluded.is_admin;
  return new;
end $$;

-- 4. submit_profile() ------------------------------------------------
-- Caller submits their own profile. Only transitions draft/rejected → pending,
-- so accepted users editing minor things stay accepted.
create or replace function public.submit_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    review_status = case
      when review_status in ('draft', 'rejected') then 'pending'
      else review_status
    end,
    review_reason = case
      when review_status = 'rejected' then null
      else review_reason
    end,
    reviewed_at = case
      when review_status in ('draft', 'rejected') then null
      else reviewed_at
    end,
    reviewed_by = case
      when review_status in ('draft', 'rejected') then null
      else reviewed_by
    end
  where user_id = auth.uid();
end $$;

grant execute on function public.submit_profile() to authenticated;
