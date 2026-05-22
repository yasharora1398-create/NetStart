-- List every account in the DB so you can pick out the fakes
-- without nuking real users.
--
-- HOW TO USE in the Supabase web SQL editor
--   1. Paste this whole file.
--   2. Run.
--   3. The result table shows: email | full_name | created_at |
--      has_avatar | has_resume.
--      Real accounts you've personally seen sign up will have a
--      real-looking email (gmail, outlook, etc.) and an
--      `has_avatar = true` if they uploaded a photo. Fake/test
--      accounts usually have synthetic names + no avatar.
--   4. Send the list of fake names back and I'll add them to
--      migration 0031_remove_fake_accounts.sql so the next run
--      deletes ONLY those rows, leaving real users alone.

select
  u.email,
  p.full_name,
  u.created_at,
  (p.avatar_path is not null) as has_avatar,
  (p.resume_path is not null) as has_resume
from auth.users u
left join public.profiles p on p.user_id = u.id
order by u.created_at desc;
