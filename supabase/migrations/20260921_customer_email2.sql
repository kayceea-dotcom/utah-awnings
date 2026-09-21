-- Add an optional second email to customers - e.g. spouse/co-owner - so
-- proposal and follow-up emails can go to both people on the job, not just
-- whoever's email the rep put in first.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

alter table public.customers
  add column if not exists email2 text;

comment on column public.customers.email2 is
  'Optional second recipient (e.g. spouse) for proposal/follow-up emails - always sent alongside email, never in place of it.';
