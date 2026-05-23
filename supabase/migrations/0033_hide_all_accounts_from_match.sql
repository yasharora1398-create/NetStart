-- Hide every existing account from the Match deck.
--
-- Two flags control whether a row appears in another user's deck:
--   profiles.is_open_to_work  -> shows the partner as a candidate
--                                in the founder-side deck
--   projects.is_published     -> shows the project in the partner-side
--                                deck
--
-- Flipping both to false makes every existing account invisible to
-- other users while leaving the account fully intact: the owner can
-- still load /match, still browse what's left (currently nothing,
-- since everyone is hidden), still edit their MyNet profile and
-- projects, still send / receive chats. They just don't appear in
-- anyone else's deck until they personally re-enable themselves
-- ("Open to work" toggle on the partner side, Publish on each
-- project on the founder side).
--
-- New accounts created after this migration default to false on both
-- flags (per the column definitions in 0005_marketplace.sql), so the
-- "hidden by default" stance is automatic going forward.
--
-- Idempotent: re-running is a no-op (every row already at false).

update public.profiles
set is_open_to_work = false
where is_open_to_work = true;

update public.projects
set is_published = false
where is_published = true;
