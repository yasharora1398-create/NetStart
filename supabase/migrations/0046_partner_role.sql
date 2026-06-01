-- C-level role the partner wants to play in their next venture
-- (CTO/CPO/CMO/CRO/CDO/COO/CFO). Distinct from auth.user_metadata.role
-- which is the account-level founder-vs-partner switch.
--
-- Founders ignore this field; they pick skills on their projects,
-- not a role on their profile. Nullable on purpose so partners
-- who haven't picked yet aren't forced into one.

alter table public.profiles
  add column if not exists partner_role text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_partner_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_partner_role_check
      check (
        partner_role is null
        or partner_role in ('CTO','CPO','CMO','CRO','CDO','COO','CFO')
      );
  end if;
end $$;

-- Rebuild get_public_founder to include partner_role on the row.
-- Even though "founder" is in the name, this RPC is what powers
-- the /u/<id> public-profile page for both founders + partners,
-- so the badge needs to surface there too.
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
  is_verified          boolean,
  partner_role         text
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
    coalesce(p.is_verified, false),
    p.partner_role
  from public.profiles p
  where p.user_id = target_user_id;
$$;
grant execute on function public.get_public_founder(uuid) to authenticated;
grant execute on function public.get_public_founder(uuid) to anon;
