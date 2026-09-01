"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import { Search, Trash2, ArrowLeft, RotateCcw } from "lucide-react";
import { canTrash, restoreProposal, deleteProposalPermanently } from "@/lib/trash";

interface TrashedRow {
  token: string;
  status: string;
  created_at: string;
  quote_id: string;
  deleted_at: string;
  quotes: {
    total_job_sale: number;
    product_type: string;
    inputs: Record<string, unknown> | null;
    created_by: string;
    customers: { name: string } | null;
  } | null;
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ProposalsTrashPage() {
  const [rows, setRows] = useState<TrashedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [restoringToken, setRestoringToken] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TrashedRow | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [emptyingBusy, setEmptyingBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  async function load() {
    if (!profile) return;
    const { data } = await supabase
      .from("proposals")
      .select("token, status, created_at, quote_id, deleted_at, quotes!inner(total_job_sale, product_type, inputs, created_by, company_id, customers(name))")
      .eq("quotes.company_id", profile.company_id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    let list = (data as unknown as TrashedRow[]) || [];
    if (profile.role === "sales_rep") {
      list = list.filter((r) => r.quotes && r.quotes.created_by === profile.id);
    }
    setRows(list);
    setLoading(false);
  }

  useEffect(() => {
    if (profileLoading || !profile) return;
    load();
  }, [profile, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const jobName = (r.quotes?.inputs?.jobName as string) || "";
      const custName = r.quotes?.customers?.name || "";
      return jobName.toLowerCase().includes(q) || custName.toLowerCase().includes(q);
    });
  }, [rows, search]);

  async function handleRestore(r: TrashedRow) {
    setActionError("");
    setRestoringToken(r.token);
    try {
      await restoreProposal(r.token, r.quote_id);
      setRows((prev) => prev.filter((x) => x.token !== r.token));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to restore");
    }
    setRestoringToken(null);
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    setActionError("");
    try {
      await deleteProposalPermanently(deleting.token, deleting.quote_id);
      setRows((prev) => prev.filter((x) => x.token !== deleting.token));
      setDeleting(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete");
    }
    setDeletingBusy(false);
  }

  async function handleEmptyTrash() {
    setEmptyingBusy(true);
    setActionError("");
    try {
      for (const r of filtered) {
        await deleteProposalPermanently(r.token, r.quote_id);
      }
      const emptied = new Set(filtered.map((r) => r.token));
      setRows((prev) => prev.filter((x) => !emptied.has(x.token)));
      setShowEmptyConfirm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to empty trash");
    }
    setEmptyingBusy(false);
  }

  return (
    <>
      <TopBar title="Proposals & Jobs Trash" subtitle={profile?.role === "sales_rep" ? "Your trashed items" : "All trashed items"}>
        <button onClick={() => router.push("/proposals")} className="btn-secondary text-xs px-3 py-2">
          <ArrowLeft size={13} /> Back
        </button>
        {filtered.length > 0 && (
          <button onClick={() => setShowEmptyConfirm(true)} className="btn-secondary text-xs px-3 py-2 text-red-600 hover:text-red-700">
            <Trash2 size={13} /> Empty Trash
          </button>
        )}
      </TopBar>
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-5xl mx-auto space-y-4">

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search by job name or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{actionError}</p>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Trash2 size={16} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-800">Trash ({filtered.length})</h2>
            </div>

            {loading || profileLoading ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                {search ? "No trashed items match your search." : "Trash is empty."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {["Job Name","Customer","Status","Total","Trashed",""].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((r) => (
                      <tr key={r.token} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                          {(r.quotes?.inputs?.jobName as string) || "Untitled"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.quotes?.customers?.name || "-"}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-gray-900 font-mono font-semibold whitespace-nowrap">{fmt(r.quotes?.total_job_sale || 0)}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.deleted_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {canTrash(profile, r.quotes?.created_by) && (
                              <>
                                <button
                                  onClick={() => handleRestore(r)}
                                  disabled={restoringToken === r.token}
                                  className="text-gray-400 hover:text-green-600 transition disabled:opacity-50"
                                  title="Restore"
                                >
                                  <RotateCcw size={15} />
                                </button>
                                <button
                                  onClick={() => { setActionError(""); setDeleting(r); }}
                                  className="text-gray-400 hover:text-red-600 transition"
                                  title="Delete permanently"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {deleting && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <p className="font-bold text-red-600 text-sm mb-1">Delete Permanently?</p>
              <p className="text-sm text-gray-600">
                {(deleting.quotes?.inputs?.jobName as string) || "Untitled"} will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setDeleting(null)} disabled={deletingBusy} className="btn-secondary flex-1 justify-center disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} disabled={deletingBusy} className="btn-primary flex-1 justify-center bg-red-600 hover:bg-red-700 disabled:opacity-50">
                <Trash2 size={15} />
                {deletingBusy ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <p className="font-bold text-red-600 text-sm mb-1">Empty Trash?</p>
              <p className="text-sm text-gray-600">
                All {filtered.length} item{filtered.length === 1 ? "" : "s"} shown here will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowEmptyConfirm(false)} disabled={emptyingBusy} className="btn-secondary flex-1 justify-center disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleEmptyTrash} disabled={emptyingBusy} className="btn-primary flex-1 justify-center bg-red-600 hover:bg-red-700 disabled:opacity-50">
                <Trash2 size={15} />
                {emptyingBusy ? "Emptying..." : "Empty Trash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
