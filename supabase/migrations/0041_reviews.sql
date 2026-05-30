-- Public reviews. Founders rate the partner experience, partners rate
-- the founder experience. One global feed split by `target_role` so
-- the Reviews page can show a Partner tab and a Founder tab.
--
-- Visibility: anyone (signed in or not) can read every review.
-- Only signed-in users can post, and only their own row. Authors
-- can edit/delete their own.
--
-- Author display info is denormalised on read via the list_reviews
-- RPC so the unauth feed doesn't depend on profile RLS quirks.

create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references auth.users(id) on delete cascade,
  target_role     text not null check (target_role in ('founder', 'partner')),
  title           text not null,
  rating          int  not null check (rating between 1 and 5),
  body            text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists reviews_target_role_created_at_idx
  on public.reviews (target_role, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews
  for select using (true);

drop policy if exists "reviews insert own" on public.reviews;
create policy "reviews insert own" on public.reviews
  for insert with check (author_id = auth.uid());

drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own" on public.reviews
  for update using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "reviews delete own" on public.reviews;
create policy "reviews delete own" on public.reviews
  for delete using (author_id = auth.uid());

-- Listing RPC. Returns review rows with the author's display name +
-- avatar path denormalised so the unauth feed doesn't need to also
-- read the profiles table (which has its own RLS). security definer
-- so anon callers still get the author bits.
drop function if exists public.list_reviews(text);
create function public.list_reviews(role_filter text)
returns table (
  id                  uuid,
  author_id           uuid,
  author_full_name    text,
  author_avatar_path  text,
  target_role         text,
  title               text,
  rating              int,
  body                text,
  created_at          timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.author_id,
    coalesce(p.full_name, ''),
    p.avatar_path,
    r.target_role,
    r.title,
    r.rating,
    r.body,
    r.created_at
  from public.reviews r
  left join public.profiles p on p.user_id = r.author_id
  where r.target_role = role_filter
  order by r.created_at desc;
$$;
grant execute on function public.list_reviews(text) to authenticated;
grant execute on function public.list_reviews(text) to anon;
