-- Polln8 user reports: lets any signed-in user flag another user
-- for review (spam, harassment, fake profile, etc). Admin sees the
-- queue in the Admin page. Idempotent: safe to re-run.

-- 1. Reports table ---------------------------------------------------
create table if not exists public.user_reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references auth.users(id) on delete cascade,
  reported_id     uuid not null references auth.users(id) on delete cascade,
  reason          text not null check (length(reason) between 1 and 1000),
  category        text not null check (category in (
    'spam', 'harassment', 'fake', 'inappropriate', 'other'
  )),
  resolved        boolean not null default false,
  resolved_at     timestamptz,
  resolved_by     uuid references auth.users(id),
  resolution_note text,
  created_at      timestamptz not null default now(),
  -- One report per (reporter, reported) pair so a single user can't
  -- spam the queue against the same target. New reports update the
  -- existing row instead (enforced via INSERT ... ON CONFLICT in the
  -- storage layer).
  unique (reporter_id, reported_id)
);

create index if not exists user_reports_reported_id_idx
  on public.user_reports(reported_id);
create index if not exists user_reports_unresolved_idx
  on public.user_reports(resolved, created_at desc)
  where resolved = false;

alter table public.user_reports enable row level security;

-- 2. RLS policies ----------------------------------------------------
-- Anyone signed in can insert their own reports.
drop policy if exists "user_reports insert own" on public.user_reports;
create policy "user_reports insert own" on public.user_reports for insert
  with check (auth.uid() = reporter_id);

-- Reporters can read / update their own reports (so the UI can show
-- "you've reported this user" state without exposing the full queue).
drop policy if exists "user_reports read own" on public.user_reports;
create policy "user_reports read own" on public.user_reports for select
  using (auth.uid() = reporter_id);

drop policy if exists "user_reports update own" on public.user_reports;
create policy "user_reports update own" on public.user_reports for update
  using (auth.uid() = reporter_id)
  with check (auth.uid() = reporter_id);

-- Admins read every report.
drop policy if exists "user_reports admin read all" on public.user_reports;
create policy "user_reports admin read all" on public.user_reports for select
  using (public.is_admin());

-- Admins update reports to mark resolved + add a resolution note.
drop policy if exists "user_reports admin update all" on public.user_reports;
create policy "user_reports admin update all" on public.user_reports for update
  using (public.is_admin())
  with check (public.is_admin());

-- 3. Helper RPC to upsert a report ----------------------------------
-- Idempotent: same (reporter, reported) pair updates the existing
-- row instead of erroring on unique-constraint violation. Returns
-- the resulting report id so the UI can show a confirmation.
create or replace function public.report_user(
  p_reported_id uuid,
  p_category    text,
  p_reason      text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'must be signed in';
  end if;
  if auth.uid() = p_reported_id then
    raise exception 'cannot report yourself';
  end if;
  insert into public.user_reports (reporter_id, reported_id, category, reason)
  values (auth.uid(), p_reported_id, p_category, p_reason)
  on conflict (reporter_id, reported_id) do update set
    category   = excluded.category,
    reason     = excluded.reason,
    resolved   = false,
    resolved_at = null,
    resolved_by = null,
    resolution_note = null,
    created_at = now()
  returning id into v_id;
  return v_id;
end $$;

grant execute on function public.report_user(uuid, text, text) to authenticated;
