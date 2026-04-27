-- Let accepted members read each other's resumes
-- Match and Find People surface operator resumes so the recipient of a
-- check-mark can review them. The default storage policies only let an
-- owner or an admin read; this adds a permissive read for any user
-- whose own profile has been accepted, scoped to the resumes bucket.
-- Idempotent: safe to re-run.

drop policy if exists "resumes accepted read" on storage.objects;
create policy "resumes accepted read"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and exists (
      select 1
      from public.profiles
      where user_id = auth.uid()
        and review_status = 'accepted'
    )
  );
