-- Verified profile flag. Permanent (one-time 50c via Stripe) cosmetic
-- upgrade. When true, the user's card in Match gets the same green
-- outline + "Recommended by Polln8" header strip as a Polln8-curated
-- card, AND a small blue verified checkmark renders next to their
-- name everywhere their name appears (public profile, chat header,
-- thread list, MyNet dashboard).
--
-- Flipped server-side by /api/stripe/verify-session when the
-- session metadata says purpose='verified' and payment is paid.
-- No user-facing write policy: profiles RLS update-own would let
-- users grant themselves the flag without paying.

alter table public.profiles
  add column if not exists is_verified boolean not null default false;

-- Rebuild get_public_founder to include the new column. Keeps the
-- existing field order; is_verified is appended at the end so any
-- callers reading by column name keep working.
drop function if exists public.get_public_founder(uuid);
create function public.get_public_founder(target_user_id uuid)
returns table (
  user_id              uuid,
  full_name            text,
  headline             text,
  bio                  text,
  skills               jsonb,
  candidate_location   text,
  candidate_commitment text,
  linkedin_url         text,
  avatar_path          text,
  is_open_to_work      boolean,
  website_url          text,
  banner_image_path    text,
  is_verified          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.user_id,
    coalesce(p.full_name, ''),
    coalesce(p.headline, ''),
    coalesce(p.bio, ''),
    p.skills,
    coalesce(p.candidate_location, ''),
    coalesce(p.candidate_commitment, ''),
    coalesce(p.linkedin_url, ''),
    p.avatar_path,
    coalesce(p.is_open_to_work, false),
    coalesce(p.website_url, ''),
    coalesce(p.banner_image_path, ''),
    coalesce(p.is_verified, false)
  from public.profiles p
  where p.user_id = target_user_id;
$$;
grant execute on function public.get_public_founder(uuid) to authenticated;
grant execute on function public.get_public_founder(uuid) to anon;
