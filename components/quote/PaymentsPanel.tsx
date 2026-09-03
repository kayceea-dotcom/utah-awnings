"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";
import { listPayments, addPayment, updatePayment, deletePayment, type Payment, type PaymentMethod } from "@/lib/payments";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const METHOD_OPTS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "card", label: "Card" },
  { value: "financing", label: "Financing" },
  { value: "other", label: "Other" },
];
const METHOD_LABEL: Record<PaymentMethod, string> = Object.fromEntries(METHOD_OPTS.map((o) => [o.value, o.label])) as Record<PaymentMethod, string>;

function todayInputValue(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

interface FormState {
  amount: string;
  method: PaymentMethod;
  checkNumber: string;
  paidOn: string;
  notes: string;
}

const EMPTY_FORM: FormState = { amount: "", method: "cash", checkNumber: "", paidOn: todayInputValue(), notes: "" };

export default function PaymentsPanel({ quoteId, companyId, totalJobSale, canManage, recordedBy }: {
  quoteId: string;
  companyId: string;
  totalJobSale: number;
  canManage: boolean;
  recordedBy: string | null | undefined;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPayments(quoteId).then((data) => {
      if (!cancelled) {
        setPayments(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [quoteId]);

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = totalJobSale - totalCollected;

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(p: Payment) {
    setEditingId(p.id);
    setForm({
      amount: String(p.amount),
      method: p.method,
      checkNumber: p.check_number || "",
      paidOn: p.paid_on,
      notes: p.notes || "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleSaveForm() {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) {
      setFormError("Enter a valid amount");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await updatePayment(editingId, {
          amount,
          method: form.method,
          checkNumber: form.method === "check" ? (form.checkNumber || null) : null,
          paidOn: form.paidOn,
          notes: form.notes || null,
        });
      } else {
        await addPayment({
          quoteId, companyId, amount,
          method: form.method,
          checkNumber: form.method === "check" ? (form.checkNumber || null) : null,
          paidOn: form.paidOn,
          notes: form.notes || null,
          recordedBy,
        });
      }
      setPayments(await listPayments(quoteId));
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save payment");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deletePayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // leave the row in place - the user can retry the delete
    }
    setDeletingId(null);
  }

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="section-heading mb-0">Payments</p>
        {canManage && !showForm && (
          <button onClick={openAddForm} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <Plus size={12} /> Add Payment
          </button>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-3 text-sm">
        <div className="flex justify-between text-gray-600 mb-1">
          <span>Total Collected</span>
          <span className="font-semibold">{fmt(totalCollected)} of {fmt(totalJobSale)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900">
          <span>Remaining Balance</span>
          <span className={remaining > 0 ? "" : "text-green-600"}>{fmt(Math.max(remaining, 0))}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : payments.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400">No payments recorded yet.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {payments.map((p) => (
            <div key={p.id} className="py-2 flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {fmt(p.amount)} <span className="font-normal text-gray-500">- {METHOD_LABEL[p.method]}{p.method === "check" && p.check_number ? " #" + p.check_number : ""}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(p.paid_on + "T00:00:00").toLocaleDateString()}{p.notes ? " - " + p.notes : ""}
                </p>
              </div>
              {canManage && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEditForm(p)} className="text-gray-400 hover:text-gray-600 transition">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                    className="text-gray-400 hover:text-red-600 transition disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Amount</label>
              <input type="number" className="input text-sm py-1.5" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Method</label>
              <select className="select text-sm py-1.5" value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))}>
                {METHOD_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {form.method === "check" && (
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Check Number</label>
                <input className="input text-sm py-1.5" value={form.checkNumber}
                  onChange={(e) => setForm((f) => ({ ...f, checkNumber: e.target.value }))} />
              </div>
            )}
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Date</label>
              <input type="date" className="input text-sm py-1.5" value={form.paidOn}
                onChange={(e) => setForm((f) => ({ ...f, paidOn: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Notes</label>
              <input className="input text-sm py-1.5" value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>
          </div>
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} disabled={saving} className="btn-secondary flex-1 justify-center text-sm disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSaveForm} disabled={saving} className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
              <DollarSign size={14} /> {saving ? "Saving..." : editingId ? "Save Changes" : "Add Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
