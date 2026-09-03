import { createClient } from "@/lib/supabase/client";

export type PaymentMethod = "cash" | "check" | "card" | "financing" | "other";

export interface Payment {
  id: string;
  quote_id: string;
  company_id: string;
  amount: number;
  method: PaymentMethod;
  check_number: string | null;
  paid_on: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export async function listPayments(quoteId: string): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("quote_id", quoteId)
    .order("paid_on", { ascending: false });
  if (error) throw error;
  return (data as Payment[]) || [];
}

export async function addPayment(input: {
  quoteId: string;
  companyId: string;
  amount: number;
  method: PaymentMethod;
  checkNumber: string | null;
  paidOn: string;
  notes: string | null;
  recordedBy: string | null | undefined;
}): Promise<Payment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .insert({
      quote_id: input.quoteId,
      company_id: input.companyId,
      amount: input.amount,
      method: input.method,
      check_number: input.checkNumber,
      paid_on: input.paidOn,
      notes: input.notes,
      recorded_by: input.recordedBy || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function updatePayment(id: string, updates: {
  amount: number;
  method: PaymentMethod;
  checkNumber: string | null;
  paidOn: string;
  notes: string | null;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("payments")
    .update({
      amount: updates.amount,
      method: updates.method,
      check_number: updates.checkNumber,
      paid_on: updates.paidOn,
      notes: updates.notes,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePayment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
}
