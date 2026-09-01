"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { Search, Users, Trash2 } from "lucide-react";
import { trashCustomer } from "@/lib/trash";
import Link from "next/link";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  referred_by: string;
  quoteCount: number;
  totalValue: number;
  lastActivity: string;
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function CustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [trashing, setTrashing] = useState<CustomerRow | null>(null);
  const [trashError, setTrashError] = useState("");
  const [trashingBusy, setTrashingBusy] = useState(false);
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const supabase = createClient();
  const isAdminOrManager = profile?.role === "admin" || profile?.role === "manager";

  useEffect(() => {
    if (profileLoading || !profile) return;

    async function load() {
      let query = supabase
        .from("quotes")
        .select("customer_id, created_by, total_job_sale, created_at, customers(*)")
        .eq("company_id", profile!.company_id)
        .is("deleted_at", null)
        .is("customers.deleted_at", null);

      if (profile!.role === "sales_rep") {
        query = query.eq("created_by", profile!.id);
      }

      const { data } = await query;

      const byCustomer = new Map<string, CustomerRow>();
      for (const row of data || []) {
        const c = row.customers as unknown as Record<string, unknown> | null;
        if (!c) continue;
        const id = c.id as string;
        const existing = byCustomer.get(id);
        const createdAt = row.created_at as string;
        if (existing) {
          existing.quoteCount += 1;
          existing.totalValue += (row.total_job_sale as number) || 0;
          if (createdAt > existing.lastActivity) existing.lastActivity = createdAt;
        } else {
          byCustomer.set(id, {
            id,
            name: (c.name as string) || "",
            phone: (c.phone as string) || "",
            email: (c.email as string) || "",
            city: (c.city as string) || "",
            referred_by: (c.referred_by as string) || "",
            quoteCount: 1,
            totalValue: (row.total_job_sale as number) || 0,
            lastActivity: createdAt,
          });
        }
      }

      const list = Array.from(byCustomer.values()).sort((a, b) =>
        (b.lastActivity || "").localeCompare(a.lastActivity || "")
      );
      setRows(list);
      setLoading(false);
    }
    load();
  }, [profile, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q)
    );
  }, [rows, search]);

  async function handleConfirmTrash() {
    if (!trashing) return;
    setTrashingBusy(true);
    setTrashError("");
    try {
      await trashCustomer(trashing.id);
      setRows((prev) => prev.filter((r) => r.id !== trashing.id));
      setTrashing(null);
    } catch (err) {
      setTrashError(err instanceof Error ? err.message : "Failed to move to trash");
    }
    setTrashingBusy(false);
  }

  return (
    <>
      <TopBar title="Customers" subtitle={profile?.role === "sales_rep" ? "Your customers" : "All company customers"}>
        {isAdminOrManager && (
          <Link href="/customers/trash" className="btn-secondary text-xs px-3 py-2">
            <Trash2 size={13} /> Trash
          </Link>
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

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={16} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-800">
                Customers ({filtered.length})
              </h2>
            </div>

            {loading ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                {search ? "No customers match your search." : "No customers yet."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {["Name","Phone","Email","City","Quotes","Total Value","Last Activity",""].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((r) => (
                      <tr key={r.id} onClick={() => router.push("/customers/" + r.id)}
                        className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{r.name}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.phone}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.email}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.city}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono">{r.quoteCount}</td>
                        <td className="px-4 py-3 text-gray-900 font-mono font-semibold whitespace-nowrap">{fmt(r.totalValue)}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {r.lastActivity ? new Date(r.lastActivity).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {isAdminOrManager && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setTrashError(""); setTrashing(r); }}
                              className="text-gray-400 hover:text-red-600 transition"
                              title="Move to trash"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
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

      {trashing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <p className="font-bold text-gray-800 text-sm mb-1">Move to Trash?</p>
              <p className="text-sm text-gray-600">
                {trashing.name} will be moved to trash, along with {trashing.quoteCount} quote{trashing.quoteCount === 1 ? "" : "s"}/proposal{trashing.quoteCount === 1 ? "" : "s"} for them. You can restore all of it later from Trash.
              </p>
              {trashError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
                  <p className="text-red-600 text-sm">{trashError}</p>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setTrashing(null)} disabled={trashingBusy} className="btn-secondary flex-1 justify-center disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleConfirmTrash} disabled={trashingBusy} className="btn-primary flex-1 justify-center disabled:opacity-50">
                <Trash2 size={15} />
                {trashingBusy ? "Moving..." : "Move to Trash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
