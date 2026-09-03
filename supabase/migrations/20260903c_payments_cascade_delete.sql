-- Fixes a bug caught in live testing: permanently deleting a quote/customer
-- (lib/trash.ts's deleteProposalPermanently/deleteCustomerPermanently) fails
-- with a foreign-key conflict (409) if any payments were ever recorded
-- against that quote, since payments.quote_id had no delete behavior
-- specified. Cascading here means "permanently delete this job" really does
-- mean permanently - its payment history goes with it, matching the same
-- "this cannot be undone" permanent-delete semantics used everywhere else.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

alter table public.payments drop constraint payments_quote_id_fkey;
alter table public.payments add constraint payments_quote_id_fkey
  foreign key (quote_id) references public.quotes(id) on delete cascade;
