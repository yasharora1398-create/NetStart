-- NetStart review workflow
-- Adds accept/reject status to profiles so admins can gate project access.
-- Idempotent: safe to re-run.

-- 1. Schema ---------------------------------------------------------
alter table public.profiles
  add column if not exists review_status text
    not null default 'pending'
    check (review_status in ('pending', 'accepted', 'rejected'));

alter table public.profiles
  add column if not exists review_reason text;

alter table public.profiles
  add column if not exists reviewed_at timestamptz;

alter table public.profiles
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

-- 2. Admin-only review function ------------------------------------
-- Uses SECURITY DEFINER so non-admin callers cannot bypass the gate.
create or replace function public.review_profile(
  target_user_id uuid,
  new_status text,
  new_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if new_status not in ('pending', 'accepted', 'rejected') then
    raise exception 'invalid review status: %', new_status;
  end if;

  update public.profiles
  set
    review_status = new_status,
    review_reason = case when new_status = 'rejected' then new_reason else null end,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where user_id = target_user_id;
end $$;

grant execute on function public.review_profile(uuid, text, text) to authenticated;
