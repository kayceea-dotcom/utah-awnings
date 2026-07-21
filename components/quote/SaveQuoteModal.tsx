"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import { X, User, Send } from "lucide-react";

interface Props {
  productType: string;
  inputs: Record<string, unknown>;
  lineItems: unknown[];
  materialCost: number;
  totalJobSale: number;
  totalProfit: number;
  markup: number;
  renderUrl?: string;
  onClose: () => void;
  onSuccess: (proposalToken: string) => void;
}

export default function SaveQuoteModal({
  productType, inputs, lineItems, materialCost,
  totalJobSale, totalProfit, markup, renderUrl, onClose, onSuccess
}: Props) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [canReference, setCanReference] = useState(false);
  const [installDate, setInstallDate] = useState("");
  const [depositPct, setDepositPct] = useState(50);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { profile } = useProfile();
  const supabase = createClient();

  const depositAmount = (totalJobSale * depositPct / 100);
  const balanceDue = totalJobSale - depositAmount;

  async function handleSave() {
    if (!name || !email) {
      setError("Customer name and email are required");
      return;
    }
    setSaving(true);
    setError("");

    try {
      // Get company id
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("slug", "utah-awnings")
        .single();

      if (!company) throw new Error("Company not found");

      // Create or find customer
      const { data: customer, error: custError } = await supabase
        .from("customers")
        .insert({
          company_id: company.id,
          name, address, city, state: "UT", zip,
          phone, email, referred_by: referredBy,
          can_reference: canReference,
        })
        .select()
        .single();

      if (custError) throw custError;

      // Create quote
      const inp = inputs as Record<string, unknown>;
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          company_id: company.id,
          customer_id: customer.id,
          created_by: profile?.id,
          product_type: productType,
          inputs,
          line_items: lineItems,
          material_cost: materialCost,
          total_job_sale: totalJobSale,
          total_profit: totalProfit,
          markup,
          status: "draft",
          style: productType,
          panel_type: (inp.panelType1 || inp.panelType || "") as string,
          color: (inp.colorPans || inp.colorPergola || "") as string,
          wrap: (inp.wrapType || "none") as string,
          end_cut: (inp.beamEndCut1 || "") as string,
          beam_type: (inp.beamType1 || "") as string,
          fan_beam: inp.fanBeamQty ? String(inp.fanBeamQty) + "x " + String(inp.fanBeamLength) + "ft" : "",
          deposit_pct: depositPct,
          deposit_amount: depositAmount,
          balance_due: balanceDue,
          estimated_install_date: installDate || null,
          notes,
          render_url: renderUrl || null,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create proposal with unique token
      const { data: proposal, error: propError } = await supabase
        .from("proposals")
        .insert({
          quote_id: quote.id,
          company_id: company.id,
          status: "draft",
        })
        .select()
        .single();

      if (propError) throw propError;

      onSuccess(proposal.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save quote");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <User size={18} style={{ color: "#CC2229" }} />
            <h2 className="text-base font-bold text-gray-900">Customer Info & Proposal</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Customer Info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Customer Information</p>
            <div className="space-y-3">
              <div>
                <label className="label">Full Name *</label>
                <input type="text" className="input" placeholder="John Smith"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input type="tel" className="input" placeholder="801-555-0000"
                    value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" placeholder="john@email.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <input type="text" className="input" placeholder="123 Main St"
                  value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input type="text" className="input" placeholder="Salt Lake City"
                    value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="label">Zip</label>
                  <input type="text" className="input" placeholder="84119"
                    value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Referred By</label>
                <input type="text" className="input" placeholder="Google, friend, etc."
                  value={referredBy} onChange={(e) => setReferredBy(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCanReference(!canReference)}
                  className={"w-5 h-5 rounded border-2 flex items-center justify-center transition " +
                    (canReference ? "border-red-500 bg-red-500" : "border-gray-300")}
                >
                  {canReference && <span className="text-white text-xs font-bold">✓</span>}
                </button>
                <label className="text-sm text-gray-700">Can we use you as a reference?</label>
              </div>
            </div>
          </div>

          {/* Proposal Details */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Proposal Details</p>
            <div className="space-y-3">
              <div>
                <label className="label">Estimated Install Date</label>
                <input type="date" className="input"
                  value={installDate} onChange={(e) => setInstallDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Deposit %</label>
                  <input type="number" className="input" value={depositPct}
                    onChange={(e) => setDepositPct(parseFloat(e.target.value) || 50)} />
                </div>
                <div>
                  <label className="label">Deposit Amount</label>
                  <div className="input bg-gray-50 text-gray-700 font-semibold">
                    {depositAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Contract Total</span>
                  <span className="font-semibold">{totalJobSale.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                </div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Deposit ({depositPct}%)</span>
                  <span className="font-semibold">{depositAmount.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 mt-1">
                  <span>Due on Completion</span>
                  <span>{balanceDue.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input min-h-20 resize-none" placeholder="Additional notes for the customer..."
                  value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !name || !email}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {saving ? "Saving..." : "Save & Generate Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}
