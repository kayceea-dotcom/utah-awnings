-- Manual payment log - one row per payment a rep actually records against a
-- job (cash/check/card/financing/other), separate from proposals.payment_method
-- (the customer's own stated payment choice at e-sign time in the public
-- /p/[token] flow - a different concept, left untouched). "Deposit vs paid in
-- full" is deliberately not a stored flag - it's derived by summing a job's
-- payments against quotes.total_job_sale.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  quote_id uuid not null references public.quotes(id),
  amount numeric not null,
  method text not null check (method in ('cash', 'check', 'card', 'financing', 'other')),
  check_number text,
  paid_on date not null default current_date,
  notes text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- Scoped to company_id, matching every other RLS policy in this app (see
-- 20260829_trash_delete.sql). Fine-grained "own jobs only for reps" is
-- enforced client-side, same as everywhere else in this app.

create policy "Authenticated can view their company's payments"
on public.payments for select
to authenticated
using (
  company_id in (select company_id from public.profiles where id = auth.uid())
);

create policy "Authenticated can insert their company's payments"
on public.payments for insert
to authenticated
with check (
  company_id in (select company_id from public.profiles where id = auth.uid())
);

create policy "Authenticated can update their company's payments"
on public.payments for update
to authenticated
using (
  company_id in (select company_id from public.profiles where id = auth.uid())
);

create policy "Authenticated can delete their company's payments"
on public.payments for delete
to authenticated
using (
  company_id in (select company_id from public.profiles where id = auth.uid())
);
