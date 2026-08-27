-- Add a phone number to profiles so reps can be reached from the proposal
-- and contract documents customers see. Nullable - existing profiles have
-- no value until their owner sets one via Settings > My Profile; "required"
-- is enforced at the app layer (invite form + self-edit form), not here.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is
  'Rep''s direct contact number - shown to customers on proposals/contracts. Set via Settings > My Profile or captured at invite time.';
