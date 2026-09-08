-- Add a notification email to profiles, separate from the rep's Supabase
-- Auth login email (app/api/proposal/signed-notification/route.ts already
-- resolves and emails that one via quotes.created_by -> auth.users). This
-- one is optional and additive - a rep can point it at an inbox they
-- actually check if that's different from their login email, and it gets
-- cc'd on the same "contract signed" notification alongside the login
-- email, not used in place of it.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

alter table public.profiles
  add column if not exists email text;

comment on column public.profiles.email is
  'Optional notification email, cc''d on the contract-signed alert alongside the rep''s real login email - not their auth login credential.';
