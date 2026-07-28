"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { Search, Users } from "lucide-react";

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
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (profileLoading || !profile) return;

    async function load() {
      let query = supabase
        .from("quotes")
        .select("customer_id, created_by, total_job_sale, created_at, customers(*)")
        .eq("company_id", profile!.company_id);

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

  return (
    <>
      <TopBar title="Customers" subtitle={profile?.role === "sales_rep" ? "Your customers" : "All company customers"} />
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
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {["Name","Phone","Email","City","Quotes","Total Value","Last Activity"].map((h) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
