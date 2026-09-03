-- Fixes "permission denied for table payments" (42501) after the previous
-- migration. RLS policies only filter rows a role can already see - they
-- don't grant table access on their own. Every other table in this app
-- (customers/quotes/proposals) got its base GRANT automatically when it was
-- created through the Supabase dashboard UI; payments was the first table
-- created via a raw SQL script instead, which skips that step.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

grant select, insert, update, delete on public.payments to authenticated;
