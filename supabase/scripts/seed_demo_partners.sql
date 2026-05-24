-- Seed 2 demo partner accounts so the founder-side Match deck has
-- candidate cards to swipe. Hand-runnable script (NOT a migration -
-- lives under scripts/ so it stays opt-in).
--
-- These accounts are clearly synthetic:
--   - Emails follow the +demopartner@polln8.com pattern so a future
--     cleanup pass can find them with one LIKE query.
--   - Names are Western per the user's "no Indian names" rule.
--   - role=partner in user_metadata; review_status=accepted so they
--     pass the gate; is_open_to_work=true so list_open_candidates()
--     returns them in the founder Match deck.
--
-- HOW TO USE
--   1. Paste this whole file into the Supabase web SQL editor.
--   2. Run. The script is idempotent - re-running on top of itself
--      no-ops via the on-conflict clauses.
--
-- HOW TO REMOVE
--   Open supabase/migrations/0031_remove_fake_accounts.sql, add
--   '%+demopartner@polln8.com' to its Pass 2 LIKE list, and re-run
--   0031 in the SQL editor. Everything cascades.

-- ────────────────────────────────────────────────────────────────
-- 1. Insert the 2 auth.users rows.
-- ────────────────────────────────────────────────────────────────
with new_partners(id, email, full_name, linkedin_url, headline, bio, skills, location, commitment) as (
  values
    (
      '00000000-0000-4000-a000-d200f0000001'::uuid,
      'nora.beck+demopartner@polln8.com',
      'Nora Beck',
      'https://www.linkedin.com/in/nora-beck-demo',
      'Product designer looking for a founding-team seat',
      'Senior product designer with 8 years across early-stage startups - shipped the first version of two consumer products that hit 100k MAU. I own UX research, IA, and high-fidelity design end-to-end, and I can write the frontend code to ship what I draw. Looking for a founder I can build with from day one.',
      '["Product Design", "Frontend Engineering", "User Research", "Brand", "Product Management"]'::jsonb,
      'United States',
      'Full-time'
    ),
    (
      '00000000-0000-4000-a000-d200f0000002'::uuid,
      'leo.vance+demopartner@polln8.com',
      'Leo Vance',
      'https://www.linkedin.com/in/leo-vance-demo',
      'Full-stack engineer ready to cofound',
      'Ex-staff engineer at two Series-B SaaS companies (fintech + dev tools). Strongest in backend - distributed systems, payments rails, infra - but I ship frontend when the team needs me to. I have shipped from zero on three side projects; ready to do it full-time as a founding engineer or cofounder.',
      '["Full-Stack Engineering", "Backend Engineering", "Distributed Systems", "DevOps / Infrastructure", "Payments"]'::jsonb,
      'Germany',
      'Full-time'
    )
)
-- 1a. auth.users row. Dummy bcrypt password = no one can sign in
--     as these accounts; they exist only for display.
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  np.id,
  'authenticated',
  'authenticated',
  np.email,
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', np.full_name, 'role', 'partner'),
  false
from new_partners np
on conflict (id) do nothing;

-- 1b. Identities row so the email looks "linked" in the dashboard.
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  np.id,
  jsonb_build_object('sub', np.id::text, 'email', np.email),
  'email',
  np.id::text,
  now(),
  now(),
  now()
from (
  values
    ('00000000-0000-4000-a000-d200f0000001'::uuid, 'nora.beck+demopartner@polln8.com'),
    ('00000000-0000-4000-a000-d200f0000002'::uuid, 'leo.vance+demopartner@polln8.com')
) as np(id, email)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────
-- 2. Fill out the profiles. handle_new_user() trigger already
--    created bare profile rows; UPDATE fleshes them out so each
--    partner reads as a real, accepted, open-to-work candidate.
-- ────────────────────────────────────────────────────────────────
with partner_data(user_id, full_name, linkedin_url, headline, bio, skills, location, commitment) as (
  values
    ('00000000-0000-4000-a000-d200f0000001'::uuid, 'Nora Beck',
      'https://www.linkedin.com/in/nora-beck-demo',
      'Product designer looking for a founding-team seat',
      'Senior product designer with 8 years across early-stage startups - shipped the first version of two consumer products that hit 100k MAU. I own UX research, IA, and high-fidelity design end-to-end, and I can write the frontend code to ship what I draw. Looking for a founder I can build with from day one.',
      '["Product Design", "Frontend Engineering", "User Research", "Brand", "Product Management"]'::jsonb,
      'United States', 'Full-time'),
    ('00000000-0000-4000-a000-d200f0000002'::uuid, 'Leo Vance',
      'https://www.linkedin.com/in/leo-vance-demo',
      'Full-stack engineer ready to cofound',
      'Ex-staff engineer at two Series-B SaaS companies (fintech + dev tools). Strongest in backend - distributed systems, payments rails, infra - but I ship frontend when the team needs me to. I have shipped from zero on three side projects; ready to do it full-time as a founding engineer or cofounder.',
      '["Full-Stack Engineering", "Backend Engineering", "Distributed Systems", "DevOps / Infrastructure", "Payments"]'::jsonb,
      'Germany', 'Full-time')
)
update public.profiles p
set
  full_name            = pd.full_name,
  linkedin_url         = pd.linkedin_url,
  headline             = pd.headline,
  bio                  = pd.bio,
  skills               = pd.skills,
  candidate_location   = pd.location,
  candidate_commitment = pd.commitment,
  review_status        = 'accepted',
  reviewed_at          = now(),
  is_open_to_work      = true,
  updated_at           = now()
from partner_data pd
where p.user_id = pd.user_id;
