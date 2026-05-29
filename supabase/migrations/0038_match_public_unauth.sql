-- Match deck visible to unauthenticated visitors.
--
-- Previously /match required a session before the deck loaded (the
-- AuthGate modal blurred the page and the data RPCs were granted to
-- 'authenticated' only). New UX: an unauth visitor picks their role
-- on a title page, then sees the same swipe deck the signed-in
-- experience uses. Save / chat actions still gate to /signin in
-- the client.
--
-- To make that work server-side, the two read-only deck RPCs need to
-- accept the 'anon' role as well as 'authenticated'. Both are
-- security-definer with no write paths, and they already filter to
-- public fields only (is_open_to_work + review_status='accepted' for
-- profiles, is_published=true for projects). The polln8-alias
-- overlay added later sits on the same set so it carries over.
--
-- Idempotent: GRANT is idempotent against the same role on the same
-- function. Re-running is a no-op.

grant execute on function public.list_open_candidates() to anon;
grant execute on function public.list_published_projects_with_founder() to anon;

-- listPublishedProjects in the web client now queries projects +
-- profiles directly (not through the RPC). For the anon path to
-- work end-to-end, the underlying tables need a public-read RLS
-- policy for the rows we display.
--
-- projects: 'projects read published' already exists from
-- 0005_marketplace.sql and is unconditional on auth.uid() - it just
-- checks is_published = true. Anon already passes.
--
-- profiles: only 'profiles read own' exists today (user_id =
-- auth.uid()). Anon gets nothing. Add a narrow read policy that
-- only exposes accepted, open-to-work profile rows - same gate the
-- candidate RPC uses - so the founder-side deck can fetch profile
-- display fields directly for the anon case. Founders viewing their
-- own profile in MyNet are unaffected (the 'read own' policy still
-- matches them first).
drop policy if exists "profiles read public match candidates" on public.profiles;
create policy "profiles read public match candidates"
  on public.profiles for select
  using (
    is_open_to_work = true
    and review_status = 'accepted'
  );
