-- Fixes "permission denied for table push_subscriptions" (42501) caught in
-- live testing: the subscribe route upserts (insert ... on conflict do
-- update) so re-subscribing the same browser updates its row instead of
-- erroring on the unique endpoint constraint - that ON CONFLICT DO UPDATE
-- path needs UPDATE privilege AND an UPDATE RLS policy, and the original
-- migration only added select/insert/delete of each.
--
-- No Supabase CLI/migrations runner is wired up in this repo -- paste this
-- directly into the Supabase SQL editor to apply it.

grant update on public.push_subscriptions to authenticated;

create policy "Authenticated can update their own push subscriptions"
on public.push_subscriptions for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());
