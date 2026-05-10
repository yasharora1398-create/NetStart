-- NetStart founder proof-of-work fields
-- Founders no longer upload a resume. Instead they fill in:
--   * website_url   - optional text URL of what they're building
--   * proof_*       - mandatory file (deck, screenshots, mock-ups,
--                     anything that demonstrates progress)
-- Builders keep using resume_*. Both column families coexist so a
-- single profile row supports both roles without branching the schema.
-- Idempotent: safe to re-run.

-- 1. Columns -------------------------------------------------------
alter table public.profiles
  add column if not exists website_url text not null default '';

alter table public.profiles
  add column if not exists proof_path text;

alter table public.profiles
  add column if not exists proof_name text;

alter table public.profiles
  add column if not exists proof_size integer;

alter table public.profiles
  add column if not exists proof_mime_type text;

alter table public.profiles
  add column if not exists proof_uploaded_at timestamptz;

-- Tracks the most recent submission for review. Filled by
-- submit_profile() below when the user transitions draft/rejected ->
-- pending. The mobile app reads this to render the "Submitted DATE"
-- step on the review timeline overlay.
alter table public.profiles
  add column if not exists submitted_at timestamptz;

-- Recreate submit_profile() so the RPC stamps submitted_at on every
-- new submission. Idempotent: replaces the prior definition shipped
-- in migration 0004.
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
    end,
    submitted_at = case
      when review_status in ('draft', 'rejected') then now()
      else submitted_at
    end
  where user_id = auth.uid();
end $$;

grant execute on function public.submit_profile() to authenticated;

-- 2. Storage bucket -----------------------------------------------
-- Private bucket; access governed by the policies below.
insert into storage.buckets (id, name, public)
  values ('proofs', 'proofs', false)
  on conflict (id) do nothing;

-- 3. Storage RLS for the proofs bucket -----------------------------
-- Founders upload / replace / delete their own files. The bucket is
-- structured `<user_id>/<filename>` so the owner check is the prefix.
drop policy if exists "proofs owner read own" on storage.objects;
create policy "proofs owner read own" on storage.objects for select
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "proofs owner insert own" on storage.objects;
create policy "proofs owner insert own" on storage.objects for insert
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "proofs owner update own" on storage.objects;
create policy "proofs owner update own" on storage.objects for update
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "proofs owner delete own" on storage.objects;
create policy "proofs owner delete own" on storage.objects for delete
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins read every proof so they can review it before approving.
drop policy if exists "proofs admin read all" on storage.objects;
create policy "proofs admin read all" on storage.objects for select
  using (bucket_id = 'proofs' and public.is_admin());
