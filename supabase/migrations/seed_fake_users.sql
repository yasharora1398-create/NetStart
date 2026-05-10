-- Seed file (NOT a migration — name doesn't start with NNNN_).
-- Run by hand in the Supabase SQL editor when you want test data.
--
-- Creates 10 fake accounts: 5 founders + 5 builders, all approved,
-- with realistic-looking metadata so the Match deck, the talent
-- browse view, and the public /u/<id> page have something to render.
--
--   Founders: profile + 1 published, active project + LinkedIn URL
--             + website + proof-of-work placeholder. Visible on
--             /talent and the FounderProfile page.
--   Builders: profile (is_open_to_work=true) + LinkedIn URL + resume
--             placeholder. Visible to founders via Find People and
--             match_candidates_for_project.
--
-- Idempotent: re-running drops the test users by email first, then
-- re-inserts. All FK references to auth.users are ON DELETE CASCADE,
-- so chats, applications, notifications, projects, and profiles all
-- get cleaned up automatically.
--
-- The proof and resume "files" only have row metadata — no actual
-- bytes are uploaded to storage. Clicking the file in the UI will
-- 404 the signed-URL fetch; the row simply renders as if a file
-- exists. Fine for visual demos; replace with real uploads later.
--
-- Shared password for every fake account:
--     TestPass123!

-- 1. Drop any existing test rows ------------------------------------
delete from auth.users
where email in (
  'jamie.ross+founder@polln8.com',
  'sara.le+founder@polln8.com',
  'theo.becker+founder@polln8.com',
  'noor.hassan+founder@polln8.com',
  'kai.suzuki+founder@polln8.com',
  'maya.chen+builder@polln8.com',
  'devon.park+builder@polln8.com',
  'aria.patel+builder@polln8.com',
  'marcus.vey+builder@polln8.com',
  'ravi.sharma+builder@polln8.com'
);

-- 2. Create users + profiles + projects -----------------------------
do $$
declare
  -- Founders
  uid_f1 uuid := gen_random_uuid();
  uid_f2 uuid := gen_random_uuid();
  uid_f3 uuid := gen_random_uuid();
  uid_f4 uuid := gen_random_uuid();
  uid_f5 uuid := gen_random_uuid();
  -- Builders
  uid_b1 uuid := gen_random_uuid();
  uid_b2 uuid := gen_random_uuid();
  uid_b3 uuid := gen_random_uuid();
  uid_b4 uuid := gen_random_uuid();
  uid_b5 uuid := gen_random_uuid();
  pw text := crypt('TestPass123!', gen_salt('bf'));
begin

  -- 2a. auth.users (founders + builders)
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token,
    email_change, email_change_token_new
  ) values
    -- Founders
    ('00000000-0000-0000-0000-000000000000', uid_f1, 'authenticated', 'authenticated', 'jamie.ross+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Jamie Ross","role":"founder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_f2, 'authenticated', 'authenticated', 'sara.le+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Sara Le","role":"founder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_f3, 'authenticated', 'authenticated', 'theo.becker+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Theo Becker","role":"founder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_f4, 'authenticated', 'authenticated', 'noor.hassan+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Noor Hassan","role":"founder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_f5, 'authenticated', 'authenticated', 'kai.suzuki+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Kai Suzuki","role":"founder"}'::jsonb,
     '', '', '', ''),
    -- Builders
    ('00000000-0000-0000-0000-000000000000', uid_b1, 'authenticated', 'authenticated', 'maya.chen+builder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Maya Chen","role":"builder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_b2, 'authenticated', 'authenticated', 'devon.park+builder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Devon Park","role":"builder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_b3, 'authenticated', 'authenticated', 'aria.patel+builder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Aria Patel","role":"builder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_b4, 'authenticated', 'authenticated', 'marcus.vey+builder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Marcus Vey","role":"builder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_b5, 'authenticated', 'authenticated', 'ravi.sharma+builder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Ravi Sharma","role":"builder"}'::jsonb,
     '', '', '', '');

  -- 2b. profiles --------------------------------------------------
  -- Founders: bio is the project pitch, website + proof set, no
  -- candidate-side resume. is_open_to_work=false.
  -- Builders: bio is the operator pitch, candidate skills/location/
  -- commitment populated, resume placeholder set. is_open_to_work=true.
  insert into public.profiles (
    user_id, full_name, headline, bio, skills,
    candidate_location, candidate_commitment,
    linkedin_url, avatar_path, is_open_to_work,
    review_status, submitted_at, reviewed_at,
    website_url, proof_path, proof_name, proof_size, proof_uploaded_at,
    resume_path, resume_name, resume_size, resume_uploaded_at
  ) values
    -- Founders
    (uid_f1,
     'Jamie Ross',
     'Repeat founder, ex-product lead at Notion',
     'Building a tool that gets sales teams off spreadsheet hell. Already have three design partners paying month-to-month.',
     '["Product","Sales","B2B SaaS"]'::jsonb,
     'New York', '', 'https://linkedin.com/in/jamieross-test', null, false,
     'accepted', now(), now(),
     'https://salesos.test',
     uid_f1::text || '/proof.pdf', 'pitch-deck.pdf', 2_400_000, now(),
     null, null, null, null),
    (uid_f2,
     'Sara Le',
     'YC W24, building healthcare data infra',
     'We index every public payer rule into a queryable graph. Provider networks pay us per query. Looking for an eng lead.',
     '["Healthcare","Data infra","Python"]'::jsonb,
     'San Francisco', '', 'https://linkedin.com/in/sarale-test', null, false,
     'accepted', now(), now(),
     'https://payerrules.dev',
     uid_f2::text || '/proof.pdf', 'pitch-deck.pdf', 3_100_000, now(),
     null, null, null, null),
    (uid_f3,
     'Theo Becker',
     'Hardware founder, 2x exits',
     'Last company sold to Apple. This time: low-power edge inference for industrial sensors. Pre-revenue, post-prototype.',
     '["Hardware","Embedded","Rust"]'::jsonb,
     'Berlin', '', 'https://linkedin.com/in/theobecker-test', null, false,
     'accepted', now(), now(),
     'https://edgeinference.io',
     uid_f3::text || '/proof.pdf', 'demo-video.mp4', 18_500_000, now(),
     null, null, null, null),
    (uid_f4,
     'Noor Hassan',
     'Climate tech, ex-Tesla',
     'Battery diagnostics for second-life EV cells. We''ve cut return-to-field time by 70% in pilots. Need a CTO.',
     '["Climate","Energy","Diagnostics"]'::jsonb,
     'Austin', '', 'https://linkedin.com/in/noorhassan-test', null, false,
     'accepted', now(), now(),
     'https://secondlife.energy',
     uid_f4::text || '/proof.pdf', 'pilot-report.pdf', 4_700_000, now(),
     null, null, null, null),
    (uid_f5,
     'Kai Suzuki',
     'Consumer app, 50k DAU pre-launch',
     'Async voice messaging for friend groups. TestFlight has been quietly viral. Ready to formalize the team.',
     '["Consumer","iOS","Audio"]'::jsonb,
     'Tokyo', '', 'https://linkedin.com/in/kaisuzuki-test', null, false,
     'accepted', now(), now(),
     'https://voicering.app',
     uid_f5::text || '/proof.pdf', 'screens.pdf', 5_200_000, now(),
     null, null, null, null),
    -- Builders
    (uid_b1,
     'Maya Chen',
     'Senior full-stack engineer',
     'Shipped marketplaces at Etsy and Faire. I want to be employee #2 at a B2B SaaS that already has paying customers — pre-seed to seed range.',
     '["TypeScript","React","Postgres","Marketplaces"]'::jsonb,
     'New York', 'Full-time', 'https://linkedin.com/in/mayachen-test', null, true,
     'accepted', now(), now(),
     '', null, null, null, null,
     uid_b1::text || '/resume.pdf', 'maya-chen-resume.pdf', 142_000, now()),
    (uid_b2,
     'Devon Park',
     'ML engineer, ex-Anthropic infra',
     'Built distillation pipelines and eval harnesses. Looking for a small team applying ML to a hard non-chat problem — bio, climate, robotics, etc.',
     '["Python","PyTorch","Distributed systems","Evals"]'::jsonb,
     'San Francisco', 'Full-time', 'https://linkedin.com/in/devonpark-test', null, true,
     'accepted', now(), now(),
     '', null, null, null, null,
     uid_b2::text || '/resume.pdf', 'devon-park-resume.pdf', 168_000, now()),
    (uid_b3,
     'Aria Patel',
     'Product designer, B2B SaaS',
     'Founding designer at two fintech startups. I do everything from research to interaction to brand. Want a founder I can argue with.',
     '["Figma","Prototyping","Brand","User research"]'::jsonb,
     'Remote', 'Full-time', 'https://linkedin.com/in/ariapatel-test', null, true,
     'accepted', now(), now(),
     '', null, null, null, null,
     uid_b3::text || '/resume.pdf', 'aria-patel-portfolio.pdf', 4_300_000, now()),
    (uid_b4,
     'Marcus Vey',
     'Backend / infra engineer',
     'Ten years on payments rails. Built ledger systems at Stripe and Wise. Want to be on the engineering side of a hard backend problem.',
     '["Go","Postgres","Kubernetes","Distributed systems"]'::jsonb,
     'London', 'Full-time', 'https://linkedin.com/in/marcusvey-test', null, true,
     'accepted', now(), now(),
     '', null, null, null, null,
     uid_b4::text || '/resume.pdf', 'marcus-vey-cv.pdf', 156_000, now()),
    (uid_b5,
     'Ravi Sharma',
     'iOS engineer, consumer apps',
     'Shipped apps with millions of installs at Tinder and Robinhood. Looking for a small consumer team where I own the iOS side end-to-end.',
     '["Swift","SwiftUI","iOS","Performance"]'::jsonb,
     'Toronto', 'Full-time', 'https://linkedin.com/in/ravisharma-test', null, true,
     'accepted', now(), now(),
     '', null, null, null, null,
     uid_b5::text || '/resume.pdf', 'ravi-sharma-resume.pdf', 184_000, now())
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    headline = excluded.headline,
    bio = excluded.bio,
    skills = excluded.skills,
    candidate_location = excluded.candidate_location,
    candidate_commitment = excluded.candidate_commitment,
    linkedin_url = excluded.linkedin_url,
    is_open_to_work = excluded.is_open_to_work,
    review_status = excluded.review_status,
    submitted_at = excluded.submitted_at,
    reviewed_at = excluded.reviewed_at,
    website_url = excluded.website_url,
    proof_path = excluded.proof_path,
    proof_name = excluded.proof_name,
    proof_size = excluded.proof_size,
    proof_uploaded_at = excluded.proof_uploaded_at,
    resume_path = excluded.resume_path,
    resume_name = excluded.resume_name,
    resume_size = excluded.resume_size,
    resume_uploaded_at = excluded.resume_uploaded_at;

  -- 2c. one published, active project per founder ----------------
  insert into public.projects (
    owner_id, title, description, criteria,
    business_type, lifecycle_state, is_published
  ) values
    (uid_f1,
     'Sales OS for forward-deployed engineers',
     'Pulling sales reps out of CRM tabs and into a single source-of-truth view of the deal. Three design partners paying.',
     '{"skills":["TypeScript","React","Postgres"],"commitment":"Full-time","location":"New York","keywords":"sales, B2B SaaS, CRM"}'::jsonb,
     'B2B SaaS', 'active', true),
    (uid_f2,
     'Healthcare payer rules graph',
     'Indexing every public payer rule into a graph. Provider networks pay per query. Built the prototype, need an eng lead.',
     '{"skills":["Python","Postgres","Graph databases"],"commitment":"Full-time","location":"San Francisco","keywords":"healthcare, data, infra"}'::jsonb,
     'B2B SaaS', 'active', true),
    (uid_f3,
     'Edge inference SDK for industrial sensors',
     'Low-power, on-device inference targeting sub-mW workloads. Customers: industrial OEMs running predictive maintenance.',
     '{"skills":["Rust","Embedded","Hardware"],"commitment":"Full-time","location":"Remote","keywords":"hardware, edge, ml"}'::jsonb,
     'Hardware + Software', 'active', true),
    (uid_f4,
     'Battery diagnostics for second-life EV cells',
     'We grade returned EV battery packs in minutes instead of days. Pilots with two recyclers. Need a CTO.',
     '{"skills":["Embedded","Python","Hardware"],"commitment":"Full-time","location":"Austin","keywords":"climate, energy, batteries"}'::jsonb,
     'Climate', 'active', true),
    (uid_f5,
     'Async voice for friend groups',
     'TestFlight quietly hit 50k DAU. Voice-first messaging for the people you actually talk to. Building the post-WhatsApp version.',
     '{"skills":["iOS","Swift","Audio"],"commitment":"Full-time","location":"Tokyo","keywords":"consumer, social, audio"}'::jsonb,
     'Consumer App', 'active', true);
end $$;
