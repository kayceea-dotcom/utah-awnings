-- Add follow-up sequence timestamp columns to proposals.
-- These are TIMESTAMPS, not booleans: each step's delay is computed from
-- when the PREVIOUS step was actually sent, so a step can never fire early
-- or be skipped just because a flag was flipped some other way.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

alter table public.proposals
  add column if not exists initial_email_sent_at timestamptz,
  add column if not exists followup1_sent_at timestamptz,
  add column if not exists followup2_sent_at timestamptz,
  add column if not exists final_followup_sent_at timestamptz;

comment on column public.proposals.initial_email_sent_at is
  'Stamped by app/api/proposal/route.ts the first time the proposal email is sent (not reset on resend).';
comment on column public.proposals.followup1_sent_at is
  '1st follow-up sent timestamp; becomes due 7 days after initial_email_sent_at.';
comment on column public.proposals.followup2_sent_at is
  '2nd follow-up sent timestamp; becomes due 30 days after followup1_sent_at.';
comment on column public.proposals.final_followup_sent_at is
  'Final follow-up sent timestamp; becomes due 90 days after followup2_sent_at.';
