-- Lets a rep attach a scanned/photographed paper contract as the record of
-- a deal instead of going through the online email-and-e-sign flow.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

alter table public.proposals
  add column if not exists signed_contract_url text;

comment on column public.proposals.signed_contract_url is
  'Public URL of a rep-uploaded signed paper contract (PDF or photo), set by
   the "Upload Signed Contract" action on the internal proposal page. When
   set, the proposal is marked signed the same way an online e-signature
   would - this file is the record of that instead of signature_data.';
