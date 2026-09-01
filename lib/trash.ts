import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/hooks/useProfile";

// Whether this profile is allowed to trash/restore/permanently-delete an
// item created by createdBy - reps can only act on their own, admin/manager
// can act on anyone's. Matches the client-side created_by/role scoping
// already used everywhere else in this app (Jobs/Proposals/Customers lists
// all filter this way today, not via RLS).
export function canTrash(profile: Profile | null, createdBy: string | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "manager") return true;
  return !!createdBy && createdBy === profile.id;
}

// A proposal and its quote are created together as a pair (SaveQuoteModal.tsx)
// and always trashed/restored/deleted together - "delete a proposal" and
// "delete a job" are the same action on the same row (Jobs is just proposals
// filtered to won statuses), so there's one set of functions for both.

export async function trashProposal(token: string, quoteId: string): Promise<void> {
  const supabase = createClient();
  const deleted_at = new Date().toISOString();
  const { error: pErr } = await supabase.from("proposals").update({ deleted_at }).eq("token", token);
  if (pErr) throw pErr;
  const { error: qErr } = await supabase.from("quotes").update({ deleted_at }).eq("id", quoteId);
  if (qErr) throw qErr;
}

export async function restoreProposal(token: string, quoteId: string): Promise<void> {
  const supabase = createClient();
  const { error: pErr } = await supabase.from("proposals").update({ deleted_at: null }).eq("token", token);
  if (pErr) throw pErr;
  const { error: qErr } = await supabase.from("quotes").update({ deleted_at: null }).eq("id", quoteId);
  if (qErr) throw qErr;
}

export async function deleteProposalPermanently(token: string, quoteId: string): Promise<void> {
  const supabase = createClient();
  // Child first - proposal references the quote, not relying on unconfirmed
  // DB-level cascade behavior.
  const { error: pErr } = await supabase.from("proposals").delete().eq("token", token);
  if (pErr) throw pErr;
  const { error: qErr } = await supabase.from("quotes").delete().eq("id", quoteId);
  if (qErr) throw qErr;
}

// Customers have no owner column (confirmed - no created_by anywhere), so
// these are only ever called from admin/manager-gated pages. Cascades to
// every quote for this customer and each of those quotes' proposals.

async function customerQuoteIds(customerId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("quotes").select("id").eq("customer_id", customerId);
  if (error) throw error;
  return (data || []).map((q) => q.id as string);
}

export async function trashCustomer(customerId: string): Promise<void> {
  const supabase = createClient();
  const deleted_at = new Date().toISOString();
  const quoteIds = await customerQuoteIds(customerId);
  if (quoteIds.length > 0) {
    const { error: propErr } = await supabase.from("proposals").update({ deleted_at }).in("quote_id", quoteIds);
    if (propErr) throw propErr;
    const { error: qErr } = await supabase.from("quotes").update({ deleted_at }).in("id", quoteIds);
    if (qErr) throw qErr;
  }
  const { error: cErr } = await supabase.from("customers").update({ deleted_at }).eq("id", customerId);
  if (cErr) throw cErr;
}

export async function restoreCustomer(customerId: string): Promise<void> {
  const supabase = createClient();
  const quoteIds = await customerQuoteIds(customerId);
  if (quoteIds.length > 0) {
    const { error: propErr } = await supabase.from("proposals").update({ deleted_at: null }).in("quote_id", quoteIds);
    if (propErr) throw propErr;
    const { error: qErr } = await supabase.from("quotes").update({ deleted_at: null }).in("id", quoteIds);
    if (qErr) throw qErr;
  }
  const { error: cErr } = await supabase.from("customers").update({ deleted_at: null }).eq("id", customerId);
  if (cErr) throw cErr;
}

export async function deleteCustomerPermanently(customerId: string): Promise<void> {
  const supabase = createClient();
  const quoteIds = await customerQuoteIds(customerId);
  if (quoteIds.length > 0) {
    const { error: propErr } = await supabase.from("proposals").delete().in("quote_id", quoteIds);
    if (propErr) throw propErr;
    const { error: qErr } = await supabase.from("quotes").delete().in("id", quoteIds);
    if (qErr) throw qErr;
  }
  const { error: cErr } = await supabase.from("customers").delete().eq("id", customerId);
  if (cErr) throw cErr;
}
