"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import StatusBadge, { isWonStatus } from "@/components/StatusBadge";
import { Search, Briefcase } from "lucide-react";

interface JobRow {
  token: string;
  status: string;
  created_at: string;
  quote_id: string;
  quotes: {
    total_job_sale: number;
    product_type: string;
    inputs: Record<string, unknown> | null;
    created_by: string;
    estimated_install_date: string | null;
    customers: { name: string; city: string } | null;
  } | null;
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function JobsPage() {
  const [rows, setRows] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (profileLoading || !profile) return;

    async function load() {
      const { data } = await supabase
        .from("proposals")
        .select("token, status, created_at, quote_id, quotes!inner(total_job_sale, product_type, inputs, created_by, company_id, estimated_install_date, customers(name, city))")
        .eq("quotes.company_id", profile!.company_id)
        .order("created_at", { ascending: false });

      let list = ((data as unknown as JobRow[]) || []).filter((r) => isWonStatus(r.status));
      if (profile!.role === "sales_rep") {
        list = list.filter((r) => r.quotes && r.quotes.created_by === profile!.id);
      }
      // Soonest install date first; jobs with no date set fall to the end
      list.sort((a, b) => {
        const da = a.quotes?.estimated_install_date;
        const db = b.quotes?.estimated_install_date;
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da.localeCompare(db);
      });
      setRows(list);
      setLoading(false);
    }
    load();
  }, [profile, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const jobName = (r.quotes?.inputs?.jobName as string) || "";
      const custName = r.quotes?.customers?.name || "";
      const salesman = (r.quotes?.inputs?.salesman as string) || "";
      return jobName.toLowerCase().includes(q) || custName.toLowerCase().includes(q) || salesman.toLowerCase().includes(q);
    });
  }, [rows, search]);

  return (
    <>
      <TopBar title="Jobs" subtitle={profile?.role === "sales_rep" ? "Your won jobs" : "All company jobs"} />
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-5xl mx-auto space-y-4">

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search by job name, customer, or salesman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Briefcase size={16} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-800">Jobs ({filtered.length})</h2>
            </div>

            {loading ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                {search ? "No jobs match your search." : "No won jobs yet - signed proposals will show up here."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {["Job Name","Customer","City","Salesman","Install Date","Status","Total"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((r) => (
                      <tr key={r.token} onClick={() => router.push("/proposals/" + r.token)}
                        className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                          {(r.quotes?.inputs?.jobName as string) || "Untitled"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.quotes?.customers?.name || "-"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.quotes?.customers?.city || "-"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{(r.quotes?.inputs?.salesman as string) || "-"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {r.quotes?.estimated_install_date ? new Date(r.quotes.estimated_install_date).toLocaleDateString() : "TBD"}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-gray-900 font-mono font-semibold whitespace-nowrap">{fmt(r.quotes?.total_job_sale || 0)}</td>
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
