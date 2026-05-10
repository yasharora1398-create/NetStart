-- Seed file (NOT a migration — name doesn't start with NNNN_).
-- Run by hand in the Supabase SQL editor when you want test data.
--
-- Creates 5 fake founder accounts (verified email + known password),
-- attaches an accepted profile to each, and gives each one a single
-- published project so the builder Match deck and the new "Projects
-- to consider" section on MyNet have real data to render.
--
-- Idempotent on profiles + projects via ON CONFLICT, but auth.users
-- will fail if the emails are already taken — clean up first if
-- re-running (see end).

do $$
declare
  uid_1 uuid := gen_random_uuid();
  uid_2 uuid := gen_random_uuid();
  uid_3 uuid := gen_random_uuid();
  uid_4 uuid := gen_random_uuid();
  uid_5 uuid := gen_random_uuid();
  pw text := crypt('TestPass123!', gen_salt('bf'));
begin
  -- 1. auth.users
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token,
    email_change, email_change_token_new
  ) values
    ('00000000-0000-0000-0000-000000000000', uid_1, 'authenticated', 'authenticated', 'jamie.ross+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Jamie Ross","role":"founder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_2, 'authenticated', 'authenticated', 'sara.le+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Sara Le","role":"founder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_3, 'authenticated', 'authenticated', 'theo.becker+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Theo Becker","role":"founder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_4, 'authenticated', 'authenticated', 'noor.hassan+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Noor Hassan","role":"founder"}'::jsonb,
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', uid_5, 'authenticated', 'authenticated', 'kai.suzuki+founder@polln8.com',
     pw, now(), now(), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"Kai Suzuki","role":"founder"}'::jsonb,
     '', '', '', '');

  -- 2. profiles
  insert into public.profiles (
    user_id, full_name, headline, bio, skills,
    candidate_location, candidate_commitment,
    linkedin_url, avatar_path, is_open_to_work,
    review_status, submitted_at, reviewed_at
  ) values
    (uid_1,
     'Jamie Ross',
     'Repeat founder, ex-product lead at Notion',
     'Building a tool that gets sales teams off spreadsheet hell. Already have three design partners paying month-to-month.',
     '["Product","Sales","B2B SaaS"]'::jsonb,
     'New York', '', 'https://linkedin.com/in/jamieross-test', null, false,
     'accepted', now(), now()),
    (uid_2,
     'Sara Le',
     'YC W24, building healthcare data infra',
     'We index every public payer rule into a queryable graph. Provider networks pay us per query. Looking for an eng lead.',
     '["Healthcare","Data infra","Python"]'::jsonb,
     'San Francisco', '', 'https://linkedin.com/in/sarale-test', null, false,
     'accepted', now(), now()),
    (uid_3,
     'Theo Becker',
     'Hardware founder, 2x exits',
     'Last company sold to Apple. This time: low-power edge inference for industrial sensors. Pre-revenue, post-prototype.',
     '["Hardware","Embedded","Rust"]'::jsonb,
     'Berlin', '', 'https://linkedin.com/in/theobecker-test', null, false,
     'accepted', now(), now()),
    (uid_4,
     'Noor Hassan',
     'Climate tech, ex-Tesla',
     'Battery diagnostics for second-life EV cells. We''ve cut return-to-field time by 70% in pilots. Need a CTO.',
     '["Climate","Energy","Diagnostics"]'::jsonb,
     'Austin', '', 'https://linkedin.com/in/noorhassan-test', null, false,
     'accepted', now(), now()),
    (uid_5,
     'Kai Suzuki',
     'Consumer app, 50k DAU pre-launch',
     'Async voice messaging for friend groups. TestFlight has been quietly viral. Ready to formalize the team.',
     '["Consumer","iOS","Audio"]'::jsonb,
     'Tokyo', '', 'https://linkedin.com/in/kaisuzuki-test', null, false,
     'accepted', now(), now())
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    headline = excluded.headline,
    bio = excluded.bio,
    skills = excluded.skills,
    candidate_location = excluded.candidate_location,
    linkedin_url = excluded.linkedin_url,
    review_status = excluded.review_status,
    submitted_at = excluded.submitted_at,
    reviewed_at = excluded.reviewed_at;

  -- 3. one published project per founder
  insert into public.projects (
    owner_id, title, description, criteria,
    business_type, lifecycle_state, is_published
  ) values
    (uid_1,
     'Sales OS for forward-deployed engineers',
     'Pulling sales reps out of CRM tabs and into a single source-of-truth view of the deal. Three design partners paying.',
     '{"skills":["TypeScript","React","Postgres"],"commitment":"Full-time","location":"New York","keywords":"sales, B2B SaaS, CRM"}'::jsonb,
     'B2B SaaS', 'active', true),
    (uid_2,
     'Healthcare payer rules graph',
     'Indexing every public payer rule into a graph. Provider networks pay per query. Built the prototype, need an eng lead.',
     '{"skills":["Python","Postgres","Graph databases"],"commitment":"Full-time","location":"San Francisco","keywords":"healthcare, data, infra"}'::jsonb,
     'B2B SaaS', 'active', true),
    (uid_3,
     'Edge inference SDK for industrial sensors',
     'Low-power, on-device inference targeting sub-mW workloads. Customers: industrial OEMs running predictive maintenance.',
     '{"skills":["Rust","Embedded","Hardware"],"commitment":"Full-time","location":"Remote","keywords":"hardware, edge, ml"}'::jsonb,
     'Hardware + Software', 'active', true),
    (uid_4,
     'Battery diagnostics for second-life EV cells',
     'We grade returned EV battery packs in minutes instead of days. Pilots with two recyclers. Need a CTO.',
     '{"skills":["Embedded","Python","Hardware"],"commitment":"Full-time","location":"Austin","keywords":"climate, energy, batteries"}'::jsonb,
     'Climate', 'active', true),
    (uid_5,
     'Async voice for friend groups',
     'TestFlight quietly hit 50k DAU. Voice-first messaging for the people you actually talk to. Building the post-WhatsApp version.',
     '{"skills":["iOS","Swift","Audio"],"commitment":"Full-time","location":"Tokyo","keywords":"consumer, social, audio"}'::jsonb,
     'Consumer App', 'active', true);
end $$;
