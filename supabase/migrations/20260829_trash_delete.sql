-- Trash/delete for customers, quotes, and proposals. A dedicated timestamp
-- column (not a status value) so trashing never collides with the real
-- proposals.status state machine (draft/sent/signed/ordered/accepted/
-- pending_payment) that StatusBadge.tsx/isWonStatus already understand.
-- null = active, non-null = trashed (and records when).
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

alter table public.customers add column if not exists deleted_at timestamptz;
alter table public.quotes    add column if not exists deleted_at timestamptz;
alter table public.proposals add column if not exists deleted_at timestamptz;

-- No code path in this app has ever issued a DELETE before now, so there's
-- no confirmed existing delete policy for authenticated users to rely on.
-- Scoped to company_id, matching the company-scoping convention referenced
-- in 20260801_public_proposal_read_access.sql's comment. Fine-grained
-- "own items only for reps" is enforced client-side, same as every other
-- created_by/role check already in this app.

create policy "Authenticated can delete their company's customers"
on public.customers for delete
to authenticated
using (
  company_id in (select company_id from public.profiles where id = auth.uid())
);

create policy "Authenticated can delete their company's quotes"
on public.quotes for delete
to authenticated
using (
  company_id in (select company_id from public.profiles where id = auth.uid())
);

create policy "Authenticated can delete their company's proposals"
on public.proposals for delete
to authenticated
using (
  company_id in (select company_id from public.profiles where id = auth.uid())
);
