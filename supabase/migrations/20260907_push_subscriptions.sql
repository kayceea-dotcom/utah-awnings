-- Push notification subscriptions - one row per browser/device a rep has
-- enabled notifications on (Settings > Profile). Used to alert the rep who
-- owns a job the moment a customer signs, alongside the existing email
-- (app/api/proposal/signed-notification/route.ts).
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  company_id uuid not null references public.companies(id),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Scoped to profile_id = auth.uid() - a subscription belongs to exactly the
-- rep whose device it is, not the whole company.

create policy "Authenticated can view their own push subscriptions"
on public.push_subscriptions for select
to authenticated
using (profile_id = auth.uid());

create policy "Authenticated can insert their own push subscriptions"
on public.push_subscriptions for insert
to authenticated
with check (profile_id = auth.uid());

create policy "Authenticated can delete their own push subscriptions"
on public.push_subscriptions for delete
to authenticated
using (profile_id = auth.uid());

-- RLS policies alone don't grant table access - the payments table
-- migration (20260903_payments.sql) missed this originally and needed a
-- follow-up fix (20260903b_payments_grants.sql), since a table created via
-- raw SQL (not the dashboard UI) doesn't get the base GRANT automatically.
-- Included up front here instead.
grant select, insert, delete on public.push_subscriptions to authenticated;
