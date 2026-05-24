-- Seed 5 demo founder accounts so the Match deck has something to
-- show on the partner side. Hand-runnable script (NOT a migration -
-- lives under scripts/ so it stays opt-in).
--
-- These accounts are clearly synthetic:
--   - Emails follow the +demofounder@polln8.com pattern so a future
--     cleanup pass can find them with one LIKE query.
--   - Names are Western so they read distinctly from the project's
--     prior seed wipe (per the user's "no Indian names" directive on
--     this run).
--   - role=founder in user_metadata; review_status=accepted so they
--     pass the gate; each gets one is_published=true project with
--     realistic criteria so they surface in partners' Match decks.
--
-- HOW TO USE
--   1. Paste this whole file into the Supabase web SQL editor.
--   2. Run. The script is idempotent - re-running on top of itself
--      no-ops via the on-conflict clauses + null-safe project
--      insert.
--
-- HOW TO REMOVE
--   Open supabase/migrations/0031_remove_fake_accounts.sql, add a
--   '%+demofounder@polln8.com' pattern to its Pass 2 LIKE list, and
--   re-run 0031 in the SQL editor. Everything cascades.

-- ────────────────────────────────────────────────────────────────
-- 1. Insert the 5 auth.users rows.
-- ────────────────────────────────────────────────────────────────
-- We assemble each row from a fixed UUID (so re-runs hit on-conflict
-- cleanly) + a dummy bcrypt password (no one signs in as these). The
-- email_confirmed_at + identities pair are required so the row passes
-- Supabase's confirmed-account checks; otherwise the profile trigger
-- still fires but the account looks "unverified" in the dashboard.

with new_founders(id, email, full_name, headline, bio, skills, location, business_type, project_title, project_desc, project_skills) as (
  values
    (
      '00000000-0000-4000-a000-d100f0000001'::uuid,
      'owen.carter+demofounder@polln8.com',
      'Owen Carter',
      'Founder Looking for Cofounder',
      'Building fintech infrastructure that B2B SaaS companies plug in to ship card issuing + ledger features in days, not quarters. Ex-payments lead at a Series-C SaaS, two prior shipped products under my belt.',
      '["Fintech", "B2B SaaS", "Payments", "Strategy", "Fundraising"]'::jsonb,
      'United States',
      'Fintech',
      'Ledger Rails',
      'Embedded ledger + card issuing API for B2B SaaS. Already integrated by 4 design partners, $12k MRR, hunting a technical cofounder to own the platform side while I run go-to-market.',
      '["Backend Engineering", "Payments", "Distributed Systems", "Engineering"]'::jsonb
    ),
    (
      '00000000-0000-4000-a000-d100f0000002'::uuid,
      'mila.brennan+demofounder@polln8.com',
      'Mila Brennan',
      'Founder Looking for Cofounder',
      'Solo founder on year two of a B2B ops platform for mid-market logistics teams. 11 paying customers, $34k MRR, profitable on operating costs. Looking for a product-minded engineering cofounder to own the roadmap as I shift to growth + ops.',
      '["Operations", "B2B SaaS", "Product Management", "Sales", "Customer Success"]'::jsonb,
      'Canada',
      'Vertical SaaS',
      'Carrier Ops',
      'Modern ops platform for mid-market freight brokers. Replacing the spreadsheets-and-Slack stack with one workflow. Need a cofounder who can ship the v2 platform redesign and lead the eng team as we grow past 50 customers.',
      '["Full-Stack Engineering", "Product Management", "Frontend Engineering", "Engineering"]'::jsonb
    ),
    (
      '00000000-0000-4000-a000-d100f0000003'::uuid,
      'theo.lambert+demofounder@polln8.com',
      'Theo Lambert',
      'Founder Looking for Cofounder',
      'Building developer tools for the LLM agent ecosystem. Open-source library at 4.2k stars, paid platform launching Q2. Ex-ML infra at a hyperscaler. Hunting an AI-native cofounder who has shipped real production LLM systems.',
      '["AI / Machine Learning", "Developer Tools", "Open Source", "Fundraising", "Strategy"]'::jsonb,
      'United Kingdom',
      'Dev Tools',
      'AgentForge',
      'Production-grade LLM agent orchestration platform. We handle the routing, eval, and observability so teams ship agentic features without rebuilding the harness. Pre-seed close, looking for a cofounder to lead AI engineering.',
      '["AI / Machine Learning", "Backend Engineering", "Engineering", "DevOps / Infrastructure"]'::jsonb
    ),
    (
      '00000000-0000-4000-a000-d100f0000004'::uuid,
      'sofia.romano+demofounder@polln8.com',
      'Sofia Romano',
      'Founder Looking for Cofounder',
      'Two-sided creative marketplace for independent video editors and the agencies that hire them. 1,200 vetted editors, $80k GMV last month, growing 30% month over month. Need a product + design partner to take the platform from scrappy MVP to category leader.',
      '["Marketplaces", "Growth", "Operations", "Community", "Product Management"]'::jsonb,
      'Italy',
      'Marketplace',
      'Reelhive',
      'Curated marketplace for premium video editing talent. Agencies match in 12 hours instead of two weeks. Looking for a cofounder who has scaled a marketplace before and can own product + design as we expand to motion + sound.',
      '["Product Design", "Product Management", "Growth", "Marketing"]'::jsonb
    ),
    (
      '00000000-0000-4000-a000-d100f0000005'::uuid,
      'jasper.hale+demofounder@polln8.com',
      'Jasper Hale',
      'Founder Looking for Cofounder',
      'Climate tech founder building emissions monitoring for mid-size industrial operators - the segment the enterprise vendors ignore. 6 LOIs, technical pilot live with a regional utility. Hunting a hardware + firmware cofounder.',
      '["Climate Tech", "Hardware / Robotics", "Sales", "Fundraising", "Strategy"]'::jsonb,
      'Australia',
      'Climate / Sustainability',
      'EmberWatch',
      'Continuous methane + CO2 monitoring for mid-size industrial facilities. Solar-powered sensors + an analytics layer regulators trust. Need a cofounder who has shipped hardware before and wants to own the device + firmware stack.',
      '["Hardware / Robotics", "DevOps / Infrastructure", "Engineering"]'::jsonb
    )
)
-- 1a. Insert the auth.users row. Dummy password hash means no one
--     can sign in as these accounts; they exist only for display.
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  nf.id,
  'authenticated',
  'authenticated',
  nf.email,
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', nf.full_name, 'role', 'founder'),
  false
from new_founders nf
on conflict (id) do nothing;

-- 1b. Identities row so the email looks "linked" in the dashboard.
insert into auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  nf.id,
  jsonb_build_object('sub', nf.id::text, 'email', nf.email),
  'email',
  nf.id::text,
  now(),
  now(),
  now()
from (
  values
    ('00000000-0000-4000-a000-d100f0000001'::uuid, 'owen.carter+demofounder@polln8.com'),
    ('00000000-0000-4000-a000-d100f0000002'::uuid, 'mila.brennan+demofounder@polln8.com'),
    ('00000000-0000-4000-a000-d100f0000003'::uuid, 'theo.lambert+demofounder@polln8.com'),
    ('00000000-0000-4000-a000-d100f0000004'::uuid, 'sofia.romano+demofounder@polln8.com'),
    ('00000000-0000-4000-a000-d100f0000005'::uuid, 'jasper.hale+demofounder@polln8.com')
) as nf(id, email)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────
-- 2. Fill out the profiles. handle_new_user() trigger already
--    created bare profile rows; UPDATE fleshes them out so each
--    founder reads as a real, accepted member.
-- ────────────────────────────────────────────────────────────────
with founder_data(user_id, full_name, headline, bio, skills, location, business_type) as (
  values
    ('00000000-0000-4000-a000-d100f0000001'::uuid, 'Owen Carter', 'Founder Looking for Cofounder',
      'Building fintech infrastructure that B2B SaaS companies plug in to ship card issuing + ledger features in days, not quarters. Ex-payments lead at a Series-C SaaS, two prior shipped products under my belt.',
      '["Fintech", "B2B SaaS", "Payments", "Strategy", "Fundraising"]'::jsonb,
      'United States', 'Fintech'),
    ('00000000-0000-4000-a000-d100f0000002'::uuid, 'Mila Brennan', 'Founder Looking for Cofounder',
      'Solo founder on year two of a B2B ops platform for mid-market logistics teams. 11 paying customers, $34k MRR, profitable on operating costs. Looking for a product-minded engineering cofounder to own the roadmap as I shift to growth + ops.',
      '["Operations", "B2B SaaS", "Product Management", "Sales", "Customer Success"]'::jsonb,
      'Canada', 'Vertical SaaS'),
    ('00000000-0000-4000-a000-d100f0000003'::uuid, 'Theo Lambert', 'Founder Looking for Cofounder',
      'Building developer tools for the LLM agent ecosystem. Open-source library at 4.2k stars, paid platform launching Q2. Ex-ML infra at a hyperscaler. Hunting an AI-native cofounder who has shipped real production LLM systems.',
      '["AI / Machine Learning", "Developer Tools", "Open Source", "Fundraising", "Strategy"]'::jsonb,
      'United Kingdom', 'Dev Tools'),
    ('00000000-0000-4000-a000-d100f0000004'::uuid, 'Sofia Romano', 'Founder Looking for Cofounder',
      'Two-sided creative marketplace for independent video editors and the agencies that hire them. 1,200 vetted editors, $80k GMV last month, growing 30% month over month. Need a product + design partner to take the platform from scrappy MVP to category leader.',
      '["Marketplaces", "Growth", "Operations", "Community", "Product Management"]'::jsonb,
      'Italy', 'Marketplace'),
    ('00000000-0000-4000-a000-d100f0000005'::uuid, 'Jasper Hale', 'Founder Looking for Cofounder',
      'Climate tech founder building emissions monitoring for mid-size industrial operators - the segment the enterprise vendors ignore. 6 LOIs, technical pilot live with a regional utility. Hunting a hardware + firmware cofounder.',
      '["Climate Tech", "Hardware / Robotics", "Sales", "Fundraising", "Strategy"]'::jsonb,
      'Australia', 'Climate / Sustainability')
)
update public.profiles p
set
  full_name            = fd.full_name,
  headline             = fd.headline,
  bio                  = fd.bio,
  skills               = fd.skills,
  candidate_location   = fd.location,
  candidate_commitment = 'Full-time',
  review_status        = 'accepted',
  reviewed_at          = now(),
  is_open_to_work      = false,
  updated_at           = now()
from founder_data fd
where p.user_id = fd.user_id;

-- ────────────────────────────────────────────────────────────────
-- 3. One published project per founder so partners see them in
--    the Match deck. Skipped if the founder already has a project
--    so re-running this script does not stack duplicates.
-- ────────────────────────────────────────────────────────────────
with project_data(owner_id, title, description, criteria, business_type) as (
  values
    ('00000000-0000-4000-a000-d100f0000001'::uuid, 'Ledger Rails',
      'Embedded ledger + card issuing API for B2B SaaS. Already integrated by 4 design partners, $12k MRR, hunting a technical cofounder to own the platform side while I run go-to-market.',
      jsonb_build_object(
        'skills',     '["Backend Engineering", "Payments", "Distributed Systems", "Engineering"]'::jsonb,
        'commitment', 'Full-time',
        'location',   'United States',
        'keywords',   'fintech, ledger, payments, B2B'
      ),
      'Fintech'),
    ('00000000-0000-4000-a000-d100f0000002'::uuid, 'Carrier Ops',
      'Modern ops platform for mid-market freight brokers. Replacing the spreadsheets-and-Slack stack with one workflow. Need a cofounder who can ship the v2 platform redesign and lead the eng team as we grow past 50 customers.',
      jsonb_build_object(
        'skills',     '["Full-Stack Engineering", "Product Management", "Frontend Engineering", "Engineering"]'::jsonb,
        'commitment', 'Full-time',
        'location',   'Canada',
        'keywords',   'logistics, freight, B2B SaaS, ops'
      ),
      'Vertical SaaS'),
    ('00000000-0000-4000-a000-d100f0000003'::uuid, 'AgentForge',
      'Production-grade LLM agent orchestration platform. We handle the routing, eval, and observability so teams ship agentic features without rebuilding the harness. Pre-seed close, looking for a cofounder to lead AI engineering.',
      jsonb_build_object(
        'skills',     '["AI / Machine Learning", "Backend Engineering", "Engineering", "DevOps / Infrastructure"]'::jsonb,
        'commitment', 'Full-time',
        'location',   'United Kingdom',
        'keywords',   'AI agents, LLM, dev tools, orchestration'
      ),
      'Dev Tools'),
    ('00000000-0000-4000-a000-d100f0000004'::uuid, 'Reelhive',
      'Curated marketplace for premium video editing talent. Agencies match in 12 hours instead of two weeks. Looking for a cofounder who has scaled a marketplace before and can own product + design as we expand to motion + sound.',
      jsonb_build_object(
        'skills',     '["Product Design", "Product Management", "Growth", "Marketing"]'::jsonb,
        'commitment', 'Full-time',
        'location',   'Italy',
        'keywords',   'marketplace, video, creators, agencies'
      ),
      'Marketplace'),
    ('00000000-0000-4000-a000-d100f0000005'::uuid, 'EmberWatch',
      'Continuous methane + CO2 monitoring for mid-size industrial facilities. Solar-powered sensors + an analytics layer regulators trust. Need a cofounder who has shipped hardware before and wants to own the device + firmware stack.',
      jsonb_build_object(
        'skills',     '["Hardware / Robotics", "DevOps / Infrastructure", "Engineering"]'::jsonb,
        'commitment', 'Full-time',
        'location',   'Australia',
        'keywords',   'climate, emissions, hardware, monitoring'
      ),
      'Climate / Sustainability')
)
insert into public.projects (
  id, owner_id, title, description, criteria, business_type,
  is_published, created_at, updated_at
)
select
  gen_random_uuid(),
  pd.owner_id, pd.title, pd.description, pd.criteria, pd.business_type,
  true,
  now(),
  now()
from project_data pd
where not exists (
  select 1 from public.projects existing
  where existing.owner_id = pd.owner_id
);

-- ────────────────────────────────────────────────────────────────
-- 4. Point each founder's profiles.active_project_id at their
--    newly-created project so the Match founder-side UI has a
--    selected project to rank candidates against.
-- ────────────────────────────────────────────────────────────────
update public.profiles p
set active_project_id = pr.id,
    updated_at        = now()
from public.projects pr
where p.user_id in (
  '00000000-0000-4000-a000-d100f0000001'::uuid,
  '00000000-0000-4000-a000-d100f0000002'::uuid,
  '00000000-0000-4000-a000-d100f0000003'::uuid,
  '00000000-0000-4000-a000-d100f0000004'::uuid,
  '00000000-0000-4000-a000-d100f0000005'::uuid
)
and pr.owner_id = p.user_id
and p.active_project_id is null;
