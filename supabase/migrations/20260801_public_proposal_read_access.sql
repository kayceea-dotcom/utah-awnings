-- The customer-facing proposal page (app/(proposal)/p/[token]/page.tsx) is
-- viewed by an unauthenticated customer clicking their emailed link - it
-- queries proposals joined to quotes/customers/companies using the anon key,
-- with no session. Testing confirmed proposals is anon-readable, but
-- quotes/customers/companies currently return zero rows for anon, which
-- means the page's "!quote || !customer" guard renders "Proposal not found"
-- for every real customer.
--
-- These policies grant anon SELECT scoped strictly to rows that are actually
-- referenced by an existing proposal - i.e. a quote a rep has deliberately
-- turned into a customer-facing proposal - not blanket access to every quote/
-- customer/company in the system. They're additive: any existing policy for
-- other roles (e.g. authenticated reps scoped by company_id) is untouched.

create policy "Public can view quotes linked to a proposal"
on public.quotes for select
to anon
using (
  exists (
    select 1 from public.proposals
    where proposals.quote_id = quotes.id
  )
);

create policy "Public can view customers linked to a proposal"
on public.customers for select
to anon
using (
  exists (
    select 1 from public.quotes
    join public.proposals on proposals.quote_id = quotes.id
    where quotes.customer_id = customers.id
  )
);

create policy "Public can view companies linked to a proposal"
on public.companies for select
to anon
using (
  exists (
    select 1 from public.quotes
    join public.proposals on proposals.quote_id = quotes.id
    where quotes.company_id = companies.id
  )
);
