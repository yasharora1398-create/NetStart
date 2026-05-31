-- Match-deck boost. A row here means user_id is pinned to position
-- one of the target_role deck until expires_at. Created server-side
-- by /api/stripe/verify-session after a Stripe Checkout completes;
-- read by the deck-ranking RPCs to decide who sits at the top.
--
-- target_role is the OPPOSITE of the buyer's own role: a founder
-- buying a boost shows up at the top of the partner deck; a partner
-- buying a boost shows up at the top of the founder deck.
--
-- stripe_session_id is uniquely indexed so a page refresh on the
-- success redirect can't double-grant the boost (the verify endpoint
-- treats an existing row for the same session_id as a no-op).

create table if not exists public.boosts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  target_role        text not null check (target_role in ('founder', 'partner')),
  starts_at          timestamptz not null default now(),
  expires_at         timestamptz not null,
  stripe_session_id  text unique,
  created_at         timestamptz not null default now()
);

-- Index for the "who's currently boosted in role X" lookup the deck
-- ranking will do.
create index if not exists boosts_active_idx
  on public.boosts (target_role, expires_at);

alter table public.boosts enable row level security;

-- Public read so the deck-ranking RPC can see active boosts without
-- needing a service role. Rows only contain user_id + a timestamp;
-- no payment data, no PII.
drop policy if exists "boosts public read" on public.boosts;
create policy "boosts public read" on public.boosts
  for select using (true);

-- No user-facing insert/update/delete policies on purpose. All
-- writes go through the service-role admin client in
-- /api/stripe/verify-session, which bypasses RLS. Users must not be
-- able to grant themselves a boost without paying.
