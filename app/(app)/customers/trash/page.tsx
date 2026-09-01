"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { Search, Trash2, ArrowLeft, RotateCcw } from "lucide-react";
import { restoreCustomer, deleteCustomerPermanently } from "@/lib/trash";

interface TrashedCustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  deleted_at: string;
  quoteCount: number;
}

export default function CustomersTrashPage() {
  const [rows, setRows] = useState<TrashedCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TrashedCustomerRow | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [emptyingBusy, setEmptyingBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const supabase = createClient();
  const isAdminOrManager = profile?.role === "admin" || profile?.role === "manager";

  async function load() {
    if (!profile) return;
    const { data } = await supabase
      .from("customers")
      .select("id, name, phone, email, city, deleted_at, quotes(id)")
      .eq("company_id", profile.company_id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    const list = ((data as unknown as Array<Record<string, unknown>>) || []).map((c) => ({
      id: c.id as string,
      name: (c.name as string) || "",
      phone: (c.phone as string) || "",
      email: (c.email as string) || "",
      city: (c.city as string) || "",
      deleted_at: c.deleted_at as string,
      quoteCount: ((c.quotes as unknown[]) || []).length,
    }));
    setRows(list);
    setLoading(false);
  }

  useEffect(() => {
    if (profileLoading || !profile || !isAdminOrManager) return;
    load();
  }, [profile, profileLoading, isAdminOrManager]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.city.toLowerCase().includes(q)
    );
  }, [rows, search]);

  async function handleRestore(r: TrashedCustomerRow) {
    setActionError("");
    setRestoringId(r.id);
    try {
      await restoreCustomer(r.id);
      setRows((prev) => prev.filter((x) => x.id !== r.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to restore");
    }
    setRestoringId(null);
  }

  async function handleConfirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    setActionError("");
    try {
      await deleteCustomerPermanently(deleting.id);
      setRows((prev) => prev.filter((x) => x.id !== deleting.id));
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
        await deleteCustomerPermanently(r.id);
      }
      const emptied = new Set(filtered.map((r) => r.id));
      setRows((prev) => prev.filter((x) => !emptied.has(x.id)));
      setShowEmptyConfirm(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to empty trash");
    }
    setEmptyingBusy(false);
  }

  if (!profileLoading && profile && !isAdminOrManager) {
    return (
      <>
        <TopBar title="Customers Trash" subtitle="Manage trashed customers" />
        <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
          <p className="text-gray-500 text-sm">You do not have permission to view this page.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Customers Trash" subtitle="Trashed customers and their quotes/proposals">
        <button onClick={() => router.push("/customers")} className="btn-secondary text-xs px-3 py-2">
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
              placeholder="Search by name, phone, email, or city..."
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
                {search ? "No trashed customers match your search." : "Trash is empty."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {["Name","Phone","Email","City","Quotes","Trashed",""].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.name}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.phone}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.email}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.city}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono">{r.quoteCount}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.deleted_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleRestore(r)}
                              disabled={restoringId === r.id}
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
                {deleting.name} and their {deleting.quoteCount} quote{deleting.quoteCount === 1 ? "" : "s"}/proposal{deleting.quoteCount === 1 ? "" : "s"} will be permanently deleted. This cannot be undone.
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
                All {filtered.length} customer{filtered.length === 1 ? "" : "s"} shown here, and their quotes/proposals, will be permanently deleted. This cannot be undone.
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
