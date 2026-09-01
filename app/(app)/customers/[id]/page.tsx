"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { ArrowLeft, Phone, Mail, MapPin, Trash2 } from "lucide-react";
import { trashCustomer } from "@/lib/trash";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

interface QuoteRow {
  id: string;
  created_at: string;
  total_job_sale: number;
  product_type: string;
  inputs: Record<string, unknown> | null;
  proposals: { token: string; status: string }[] | { token: string; status: string } | null;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [trashing, setTrashing] = useState(false);
  const [trashError, setTrashError] = useState("");
  const supabase = createClient();
  const isAdminOrManager = profile?.role === "admin" || profile?.role === "manager";

  useEffect(() => {
    if (profileLoading || !profile) return;

    async function load() {
      const { data: cust } = await supabase.from("customers").select("*").eq("id", id).is("deleted_at", null).single();
      setCustomer(cust);

      let query = supabase
        .from("quotes")
        .select("id, created_at, total_job_sale, product_type, inputs, proposals(token, status)")
        .eq("customer_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (profile!.role === "sales_rep") {
        query = query.eq("created_by", profile!.id);
      }

      const { data: q } = await query;
      setQuotes((q as unknown as QuoteRow[]) || []);
      setLoading(false);
    }
    load();
  }, [id, profile, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConfirmTrash() {
    setTrashing(true);
    setTrashError("");
    try {
      await trashCustomer(id);
      router.push("/customers");
    } catch (err) {
      setTrashError(err instanceof Error ? err.message : "Failed to move to trash");
      setTrashing(false);
    }
  }

  function proposalToken(q: QuoteRow): string | null {
    const p = q.proposals;
    if (!p) return null;
    return Array.isArray(p) ? (p[0]?.token ?? null) : p.token;
  }
  function proposalStatus(q: QuoteRow): string {
    const p = q.proposals;
    if (!p) return "draft";
    return Array.isArray(p) ? (p[0]?.status ?? "draft") : p.status;
  }

  if (loading || profileLoading) {
    return (
      <>
        <TopBar title="Customer" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading...</p>
        </main>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <TopBar title="Customer Not Found" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <p className="text-gray-400 text-sm">This customer could not be found.</p>
        </main>
      </>
    );
  }

  const c = customer;
  const totalValue = quotes.reduce((s, q) => s + (q.total_job_sale || 0), 0);

  return (
    <>
      <TopBar title={c.name as string} subtitle={quotes.length + " quote" + (quotes.length === 1 ? "" : "s") + " - " + fmt(totalValue) + " total"}>
        {isAdminOrManager && (
          <button onClick={() => setShowTrashConfirm(true)} className="btn-secondary text-xs px-3 py-2 text-red-600 hover:text-red-700">
            <Trash2 size={13} /> Trash Customer
          </button>
        )}
        <button onClick={() => router.push("/customers")} className="btn-secondary text-xs px-3 py-2">
          <ArrowLeft size={13} /> Back
        </button>
      </TopBar>

      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-3xl mx-auto space-y-4">

          <div className="card p-5">
            <p className="section-heading">Contact Info</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700"><Phone size={14} className="text-gray-400" /> {(c.phone as string) || "-"}</div>
              <div className="flex items-center gap-2 text-gray-700"><Mail size={14} className="text-gray-400" /> {(c.email as string) || "-"}</div>
              <div className="flex items-center gap-2 text-gray-700 col-span-2">
                <MapPin size={14} className="text-gray-400" />
                {(c.address as string) || ""} {(c.city as string) || ""}{(c.city as string) ? "," : ""} {(c.state as string) || ""} {(c.zip as string) || ""}
              </div>
              {c.referred_by ? (
                <div className="text-gray-500 col-span-2">Referred by: <span className="text-gray-700 font-medium">{c.referred_by as string}</span></div>
              ) : null}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-800">Quote History</h2>
            </div>
            {quotes.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No quotes for this customer yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {quotes.map((q) => {
                  const token = proposalToken(q);
                  return (
                    <div key={q.id}
                      onClick={() => token && router.push("/proposals/" + token)}
                      className={"px-5 py-4 flex items-center justify-between gap-3 " + (token ? "hover:bg-gray-50 cursor-pointer transition" : "")}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {(q.inputs?.jobName as string) || (q.product_type || "Quote")}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(q.created_at).toLocaleDateString()} · {q.product_type}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-mono font-semibold text-gray-900 text-sm">{fmt(q.total_job_sale || 0)}</span>
                        <StatusBadge status={proposalStatus(q)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {showTrashConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <p className="font-bold text-gray-800 text-sm mb-1">Move to Trash?</p>
              <p className="text-sm text-gray-600">
                {c.name as string} will be moved to trash, along with {quotes.length} quote{quotes.length === 1 ? "" : "s"}/proposal{quotes.length === 1 ? "" : "s"} for them. You can restore all of it later from Trash.
              </p>
              {trashError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
                  <p className="text-red-600 text-sm">{trashError}</p>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowTrashConfirm(false)} disabled={trashing} className="btn-secondary flex-1 justify-center disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleConfirmTrash} disabled={trashing} className="btn-primary flex-1 justify-center disabled:opacity-50">
                <Trash2 size={15} />
                {trashing ? "Moving..." : "Move to Trash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
