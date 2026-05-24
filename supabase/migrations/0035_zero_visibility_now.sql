-- Force every account + project off the Match deck.
--
-- Same shape as 0033 but re-asserted: 0033 ran at one point in time
-- and any account that re-enabled themselves since (toggled
-- Open-to-Work or published a project) is showing up in the deck
-- again. This migration wipes visibility again. Run it whenever the
-- Match deck needs to be empty for everyone.
--
-- Covers the Polln8-recommended posts too: those default to
-- is_published=true, so the same UPDATE statement turns them off.
-- The recommendation rows + their polln8 fields stay intact; setting
-- is_published back to true through the admin UI (or by editing the
-- row directly) brings them back without re-running the seed.
--
-- Idempotent: re-running matches zero rows once everything is
-- already false.

update public.profiles
set is_open_to_work = false
where is_open_to_work = true;

update public.projects
set is_published = false
where is_published = true;
