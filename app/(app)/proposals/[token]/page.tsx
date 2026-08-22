"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";
import { Send, ExternalLink, CheckCircle, Clock, Eye, X, FileDown, Pencil, Save } from "lucide-react";
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
  const [followUpStep, setFollowUpStep] = useState<{ key: string; label: string; actionLabel: string } | null>(null);
  const [followUpPreviewLoading, setFollowUpPreviewLoading] = useState(false);
  const [followUpPreviewHtml, setFollowUpPreviewHtml] = useState<string | null>(null);
  const [followUpPreviewSubject, setFollowUpPreviewSubject] = useState("");
  const [followUpBody, setFollowUpBody] = useState("");
  const followUpDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resendingContract, setResendingContract] = useState(false);
  const [contractResent, setContractResent] = useState(false);
  const [resendContractError, setResendContractError] = useState("");
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftZip, setDraftZip] = useState("");
  const [draftJobName, setDraftJobName] = useState("");
  const [draftInstallDate, setDraftInstallDate] = useState("");
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

  async function handleResendContract() {
    setResendingContract(true);
    setResendContractError("");
    const res = await fetch("/api/contract/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalToken: token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResendContractError(data.error || "Failed to resend contract");
    } else {
      setContractResent(true);
    }
    setResendingContract(false);
  }

  async function fetchFollowUpPreview(stepKey: string, customBody?: string) {
    const res = await fetch("/api/proposal/followup/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalToken: token, stepKey, customBody }),
    });
    return { ok: res.ok, data: await res.json() };
  }

  async function handleOpenFollowUpPreview(step: { key: string; label: string; actionLabel: string }) {
    setFollowUpStep(step);
    setFollowUpPreviewLoading(true);
    setFollowUpPreviewHtml(null);
    setFollowUpError("");
    const { ok, data } = await fetchFollowUpPreview(step.key);
    if (!ok) {
      setFollowUpError(data.error || "Failed to build preview");
    } else {
      setFollowUpPreviewHtml(data.html);
      setFollowUpPreviewSubject(data.subject);
      setFollowUpBody(data.defaultBody || "");
    }
    setFollowUpPreviewLoading(false);
  }

  function handleFollowUpBodyChange(value: string) {
    setFollowUpBody(value);
    if (followUpDebounceRef.current) clearTimeout(followUpDebounceRef.current);
    followUpDebounceRef.current = setTimeout(async () => {
      if (!followUpStep) return;
      const { ok, data } = await fetchFollowUpPreview(followUpStep.key, value);
      if (ok) setFollowUpPreviewHtml(data.html);
    }, 400);
  }

  function closeFollowUpPreview() {
    if (followUpDebounceRef.current) clearTimeout(followUpDebounceRef.current);
    setFollowUpStep(null);
    setFollowUpPreviewHtml(null);
    setFollowUpBody("");
    setFollowUpError("");
  }

  async function handleConfirmSendFollowUp() {
    if (!followUpStep) return;
    setSendingFollowUp(true);
    setFollowUpError("");
    const res = await fetch("/api/proposal/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalToken: token, stepKey: followUpStep.key, customBody: followUpBody }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFollowUpError(data.error || "Failed to send follow-up");
    } else {
      closeFollowUpPreview();
      await load();
    }
    setSendingFollowUp(false);
  }

  function toDateInputValue(d: Date): string {
    // Local-timezone date components, not UTC - matches how the read-only
    // "Est. Install Date" display elsewhere already renders this value via
    // toLocaleDateString(). Using toISOString() here would pull the UTC date
    // instead, which is a day behind local for anyone west of UTC and would
    // silently shift the install date forward a day on save.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function startEditingInfo() {
    if (!customer || !quote) return;
    setDraftName((customer.name as string) || "");
    setDraftPhone((customer.phone as string) || "");
    setDraftEmail((customer.email as string) || "");
    setDraftAddress((customer.address as string) || "");
    setDraftCity((customer.city as string) || "");
    setDraftZip((customer.zip as string) || "");
    const inputs = (quote.inputs as Record<string, unknown>) || {};
    setDraftJobName((inputs.jobName as string) || "");
    setDraftInstallDate(quote.estimated_install_date ? toDateInputValue(new Date(quote.estimated_install_date as string)) : "");
    setInfoError("");
    setEditingInfo(true);
  }

  async function handleSaveInfo() {
    if (!customer || !quote) return;
    setSavingInfo(true);
    setInfoError("");

    const { error: customerErr } = await supabase
      .from("customers")
      .update({
        name: draftName,
        phone: draftPhone,
        email: draftEmail,
        address: draftAddress,
        city: draftCity,
        zip: draftZip,
      })
      .eq("id", customer.id as string);

    const existingInputs = (quote.inputs as Record<string, unknown>) || {};
    const { error: quoteErr } = await supabase
      .from("quotes")
      .update({
        estimated_install_date: draftInstallDate || null,
        inputs: { ...existingInputs, jobName: draftJobName },
      })
      .eq("id", quote.id as string);

    if (customerErr || quoteErr) {
      setInfoError(customerErr?.message || quoteErr?.message || "Failed to save changes");
      setSavingInfo(false);
      return;
    }

    await load();
    setEditingInfo(false);
    setSavingInfo(false);
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
            <div className="flex items-center justify-between mb-1">
              <p className="section-heading mb-0">Customer &amp; Job Info</p>
              {!editingInfo && (
                <button onClick={startEditingInfo} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>
            {editingInfo ? (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Name</label>
                    <input className="input text-sm py-1.5" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Phone</label>
                    <input className="input text-sm py-1.5" value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Email</label>
                    <input type="email" className="input text-sm py-1.5" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Address</label>
                    <input className="input text-sm py-1.5" value={draftAddress} onChange={(e) => setDraftAddress(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">City</label>
                    <input className="input text-sm py-1.5" value={draftCity} onChange={(e) => setDraftCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Zip</label>
                    <input className="input text-sm py-1.5" value={draftZip} onChange={(e) => setDraftZip(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Job Name</label>
                    <input className="input text-sm py-1.5" value={draftJobName} onChange={(e) => setDraftJobName(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Est. Install Date</label>
                    <input type="date" className="input text-sm py-1.5" value={draftInstallDate} onChange={(e) => setDraftInstallDate(e.target.value)} />
                  </div>
                </div>
                {infoError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{infoError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setEditingInfo(false)} disabled={savingInfo} className="btn-secondary flex-1 justify-center text-sm disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleSaveInfo} disabled={savingInfo} className="btn-primary flex-1 justify-center text-sm disabled:opacity-50">
                    <Save size={14} /> {savingInfo ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{c.name as string}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{c.phone as string}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{c.email as string}</span></div>
                <div><span className="text-gray-500">City:</span> <span className="font-medium">{c.city as string}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="font-medium">{(c.address as string) || "-"}{c.zip ? ", " + c.zip : ""}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Job Name:</span> <span className="font-medium">{((q.inputs as Record<string, unknown>)?.jobName as string) || "-"}</span></div>
              </div>
            )}
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
              <button onClick={handleResendContract} disabled={resendingContract}
                className="btn-secondary w-full justify-center mt-3 text-sm disabled:opacity-50">
                <Send size={14} />
                {resendingContract ? "Sending..." : "Resend Signed Contract to Office"}
              </button>
              {contractResent && (
                <p className="text-xs text-green-600 text-center mt-2">Sent to utahawnings@gmail.com</p>
              )}
              {resendContractError && (
                <p className="text-xs text-red-600 text-center mt-2">{resendContractError}</p>
              )}
            </div>
          )}

          <div className="card p-5 space-y-3">
            <p className="section-heading">Actions</p>
            <a href={"/p/" + token} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full justify-center">
              <ExternalLink size={15} />
              Preview Customer View
            </a>
            <a href={"/api/contract?token=" + token} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full justify-center">
              <FileDown size={15} />
              Download Contract PDF
            </a>
            <button onClick={handleSend} disabled={sending} className={sent ? "btn-secondary w-full disabled:opacity-50" : "btn-primary w-full disabled:opacity-50"}>
              <Send size={15} />
              {sending ? "Sending..." : sent ? "Resend Email" : "Email Proposal to " + (c.name as string)}
            </button>

            {followUpStatus?.kind === "action_due" && followUpStatus.step.key !== "initial" && (
              <button onClick={() => handleOpenFollowUpPreview(followUpStatus.step)}
                className="btn-primary w-full disabled:opacity-50">
                <Eye size={15} />
                Preview {followUpStatus.step.label}
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

      {followUpStep && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-800 text-sm">Preview &amp; Edit &mdash; {followUpStep.label}</p>
                {followUpPreviewSubject && (
                  <p className="text-xs text-gray-400 mt-0.5">Subject: {followUpPreviewSubject}</p>
                )}
              </div>
              <button onClick={closeFollowUpPreview} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 border-b border-gray-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Message</label>
              <textarea
                className="input text-sm w-full"
                style={{ minHeight: "auto" }}
                rows={4}
                value={followUpBody}
                onChange={(e) => handleFollowUpBodyChange(e.target.value)}
              />
            </div>
            {followUpPreviewLoading && !followUpPreviewHtml ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400" style={{ minHeight: "40vh" }}>
                Loading preview...
              </div>
            ) : (
              <iframe srcDoc={followUpPreviewHtml || ""} sandbox="" className="flex-1 w-full" style={{ minHeight: "40vh" }} />
            )}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={closeFollowUpPreview} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleConfirmSendFollowUp} disabled={sendingFollowUp} className="btn-primary flex-1 disabled:opacity-50">
                <Send size={15} />
                {sendingFollowUp ? "Sending..." : followUpStep.actionLabel}
              </button>
            </div>
            {followUpError && (
              <div className="px-5 pb-4">
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{followUpError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
