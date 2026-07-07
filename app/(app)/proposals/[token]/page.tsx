"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";
import { Send, ExternalLink, CheckCircle, Clock } from "lucide-react";

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
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
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
        if (s === "sent" || s === "signed" || s === "accepted") setSent(true);
      }
      setLoading(false);
    }
    load();
  }, [token]);

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
    }
    setSending(false);
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
              {q.estimated_install_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Est. Install Date</span>
                  <span className="font-semibold">{new Date(q.estimated_install_date as string).toLocaleDateString()}</span>
                </div>
              )}
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
              {proposal.signature_data && (
                <img src={proposal.signature_data as string} alt="Signature"
                  className="mt-3 border border-green-200 rounded-lg bg-white p-2 max-h-20" />
              )}
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
    </>
  );
}
