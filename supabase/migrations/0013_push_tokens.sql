-- NetStart push notification tokens
-- Stores each user's Expo push token so the notify-push Edge Function
-- can fan a notifications insert out to the device.
-- Idempotent: safe to re-run.

alter table public.profiles
  add column if not exists expo_push_token text;

-- Helper that stores the token without touching other profile fields.
-- Called by the mobile app on sign-in (user can update their own row
-- already via existing RLS but this single-purpose RPC keeps the
-- mobile call site clean and forwards-compatible).
create or replace function public.set_expo_push_token(token text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set expo_push_token = nullif(token, '')
  where user_id = auth.uid();
$$;

grant execute on function public.set_expo_push_token(text) to authenticated;
