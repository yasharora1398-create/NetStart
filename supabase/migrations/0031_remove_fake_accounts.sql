-- Wipe the 10 seed/test accounts created by seed_fake_users.sql.
--
-- Idempotent and harmless on environments where the seed was never
-- run: the WHERE clause just matches zero rows. Everything that
-- references these auth.users rows (profiles, projects, applications,
-- saved_people, saved_projects, chat_contacts, chat_messages,
-- notifications, push_tokens, user_reports) is FK'd ON DELETE
-- CASCADE, so wiping the auth.users row also wipes all attached
-- data. No orphans left behind.
--
-- After this migration runs, the seed file itself (seed_fake_users.sql)
-- has been deleted from the repo so nobody re-seeds by accident.

-- Pass 1: nuke by the original seed emails (covers the case where
-- the seed file was run verbatim).
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

-- Pass 2: catch any variant where the seed was tweaked. Anything
-- with a polln8.com plus-tag (+founder / +builder / +test) is by
-- definition seed/synthetic data - real users sign up with their
-- own email domain (gmail, outlook, work, etc.), never with
-- @polln8.com plus-tags. This pass catches the synthetic accounts
-- (Alex Chen, Diego Ramirez, Marcus Okonkwo, Priya Singh, Aisha
-- Williams) sitting at *+test@polln8.com.
delete from auth.users
where email like '%+founder@polln8.com'
   or email like '%+builder@polln8.com'
   or email like '%+test@polln8.com';

-- Pass 3: nuke by full name. The original seed (seed_fake_users.sql)
-- shipped with 10 names, but more synthetic accounts have appeared
-- in the DB - either from re-seeds under different emails or from
-- manual sign-ups during testing. Add any new fake name to this
-- list and re-run this whole migration; the operation is idempotent
-- so it can be run repeatedly without harming real accounts.
--
-- Profiles is FK'd to auth.users so this cascade-wipes the auth row
-- + every dependent table (projects, saved_*, chat_*, notifications,
-- push_tokens, user_reports).
delete from auth.users
where id in (
  select user_id from public.profiles
  where full_name in (
    -- Original seed
    'Jamie Ross',
    'Sara Le',
    'Theo Becker',
    'Noor Hassan',
    'Kai Suzuki',
    'Maya Chen',
    'Devon Park',
    'Aria Patel',
    'Marcus Vey',
    'Ravi Sharma',
    -- Additional synthetic accounts discovered in Match
    'Alex Chen',
    'Marcus Okonkwo',
    'Priya Singh',
    'Diego Ramirez',
    'Aisha Williams'
  )
);
