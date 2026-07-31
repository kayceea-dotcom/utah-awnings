"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";
import { Send, ExternalLink, CheckCircle, Clock, Eye, X } from "lucide-react";
import { getFollowUpStatus } from "@/lib/followups/engine";
import type { ProposalFollowUpTimestamps } from "@/lib/followups/types";
import FollowUpBadge from "@/components/FollowUpBadge";

const fmt = (n: number) => n?.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ProposalPreviewPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const [proposal, setProposal] = useState<Record<string, unknown> | null>(null);
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [error, setError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState("");
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("proposals")
      .select("*, quotes(*, customers(*))")
      .eq("token", token)
      .single();
    if (data) {
      setProposal(data);
      const q = data.quotes as Record<string, unknown>;
      setQuote(q);
      setCustomer(q.customers as Record<string, unknown>);
      const s = data.status as string;
      if (s === "sent" || s === "signed" || s === "accepted" || s === "ordered" || s === "pending_payment") setSent(true);
      if (s === "ordered") setOrdered(true);
    }
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const followUpStatus = useMemo(() => {
    if (!proposal) return null;
    const timestamps: ProposalFollowUpTimestamps = {
      initial_email_sent_at: proposal.initial_email_sent_at as string | null,
      followup1_sent_at: proposal.followup1_sent_at as string | null,
      followup2_sent_at: proposal.followup2_sent_at as string | null,
      final_followup_sent_at: proposal.final_followup_sent_at as string | null,
    };
    return getFollowUpStatus(timestamps);
  }, [proposal]);

  async function handlePreviewOrder() {
    setPreviewing(true);
    setPreviewError("");
    const res = await fetch("/api/order-sheet/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalToken: token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPreviewError(data.error || "Failed to build order preview");
    } else {
      setPreviewHtml(data.html);
    }
    setPreviewing(false);
  }

  async function handleConfirmSendOrder() {
    setOrdering(true);
    setError("");
    const res = await fetch("/api/order-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalToken: token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to send order");
    } else {
      setOrdered(true);
      setPreviewHtml(null);
    }
    setOrdering(false);
  }

  async function handleSend() {
    setSending(true);
    setError("");
    const res = await fetch("/api/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalToken: token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to send");
    } else {
      setSent(true);
      await load();
    }
    setSending(false);
  }

  async function handleSendFollowUp(stepKey: string) {
    setSendingFollowUp(true);
    setFollowUpError("");
    const res = await fetch("/api/proposal/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalToken: token, stepKey }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFollowUpError(data.error || "Failed to send follow-up");
    } else {
      await load();
    }
    setSendingFollowUp(false);
  }

  if (loading) {
    return (
      <>
        <TopBar title="Proposal" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading...</p>
        </main>
      </>
    );
  }

  if (!proposal || !quote || !customer) {
    return (
      <>
        <TopBar title="Proposal Not Found" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Proposal not found.</p>
        </main>
      </>
    );
  }

  const status = proposal.status as string;
  const c = customer;
  const q = quote;

  const statusBadge = () => {
    if (status === "ordered") {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700"><Send size={12} /> ORDERED</span>;
    }
    if (status === "signed" || status === "accepted") {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle size={12} /> SIGNED</span>;
    }
    if (status === "sent") {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><Send size={12} /> SENT</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600"><Clock size={12} /> DRAFT</span>;
  };

  return (
    <>
      <TopBar title="Proposal" subtitle={(c.name as string) + " - " + fmt(q.total_job_sale as number)}>
        {statusBadge()}
      </TopBar>

      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-xl mx-auto space-y-4">

          <div className="card p-5">
            <p className="section-heading">Customer</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{c.name as string}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{c.phone as string}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{c.email as string}</span></div>
              <div><span className="text-gray-500">City:</span> <span className="font-medium">{c.city as string}</span></div>
            </div>
          </div>

          <div className="card p-5">
            <p className="section-heading">Contract Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Contract Total</span>
                <span className="font-bold text-lg" style={{ color: "#CC2229" }}>{fmt(q.total_job_sale as number)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deposit ({q.deposit_pct as number}%)</span>
                <span className="font-semibold">{fmt(q.deposit_amount as number)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due on Completion</span>
                <span className="font-semibold">{fmt(q.balance_due as number)}</span>
              </div>
              {q.estimated_install_date ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Est. Install Date</span>
                  <span className="font-semibold">{new Date(String(q.estimated_install_date)).toLocaleDateString()}</span>
                </div>
              ) : null}
            </div>
          </div>

          {(status === "signed" || status === "accepted") && (
            <div className="card p-5 border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-green-600" />
                <p className="text-sm font-bold text-green-700">Customer Signed</p>
              </div>
              <p className="text-xs text-green-600">
                Signed on {new Date(proposal.signed_at as string).toLocaleDateString()} - Payment: {(proposal.payment_method as string || "").replace("_", " ")}
              </p>
              {proposal.signature_data ? (
                <img src={String(proposal.signature_data)} alt="Signature"
                  className="mt-3 border border-green-200 rounded-lg bg-white p-2 max-h-20" />
              ) : null}
            </div>
          )}

          <div className="card p-5 space-y-3">
            <p className="section-heading">Actions</p>
            <a href={"/p/" + token} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full justify-center">
              <ExternalLink size={15} />
              Preview Customer View
            </a>
            <button onClick={handleSend} disabled={sending} className={sent ? "btn-secondary w-full disabled:opacity-50" : "btn-primary w-full disabled:opacity-50"}>
              <Send size={15} />
              {sending ? "Sending..." : sent ? "Resend Email" : "Email Proposal to " + (c.name as string)}
            </button>

            {followUpStatus?.kind === "action_due" && followUpStatus.step.key !== "initial" && (
              <button onClick={() => handleSendFollowUp(followUpStatus.step.key)} disabled={sendingFollowUp}
                className="btn-primary w-full disabled:opacity-50">
                <Send size={15} />
                {sendingFollowUp ? "Sending..." : followUpStatus.step.actionLabel}
              </button>
            )}
            {followUpStatus?.kind === "waiting" && (
              <div className="text-xs text-gray-500 flex items-center gap-1.5 justify-center py-2">
                <Clock size={13} /> Waiting for next follow-up
              </div>
            )}
            {followUpStatus?.kind === "complete" && (
              <div className="flex justify-center py-1">
                <FollowUpBadge status={followUpStatus} />
              </div>
            )}
            {followUpError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{followUpError}</p>
              </div>
            )}

            <button onClick={handlePreviewOrder} disabled={previewing}
              className="btn-secondary w-full disabled:opacity-50">
              <Eye size={15} className="text-orange-500" />
              {previewing ? "Building Preview..." : ordered ? "Order Sent - Preview Again" : "Preview Order for Wholesale Patio"}
            </button>
            {previewError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{previewError}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          <button onClick={() => router.push("/proposals")} className="btn-secondary w-full justify-center">
            Back to All Proposals
          </button>
        </div>
      </main>

      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-gray-800 text-sm">Order Preview - Wholesale Patio</p>
              <button onClick={() => setPreviewHtml(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <iframe srcDoc={previewHtml} sandbox="" className="flex-1 w-full" style={{ minHeight: "60vh" }} />
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setPreviewHtml(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleConfirmSendOrder} disabled={ordering} className="btn-primary flex-1 disabled:opacity-50">
                <Send size={15} />
                {ordering ? "Sending..." : "Send to Supplier"}
              </button>
            </div>
            {error && (
              <div className="px-5 pb-4">
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
