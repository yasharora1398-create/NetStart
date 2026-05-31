-- One-shot patch: set the universal demo password on the two
-- partner demo accounts that were seeded with random throwaway
-- bcrypt hashes (seed_demo_partners.sql committed before this
-- script was patched to use a known password).
--
-- After running this, you can sign in as either account at
-- /signin with the password below.
--
-- Universal password: Polln8Demo!
--
-- Idempotent: safe to re-run; just re-hashes the same password.

update auth.users
set
  encrypted_password = crypt('Polln8Demo!', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email in (
  'nora.beck+demopartner@polln8.com',
  'leo.vance+demopartner@polln8.com'
);
