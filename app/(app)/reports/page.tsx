"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import TopBar from "@/components/TopBar";
import StatusBadge, { isWonStatus } from "@/components/StatusBadge";
import { DollarSign, TrendingUp, Percent, FileText } from "lucide-react";

interface ReportRow {
  status: string;
  created_at: string;
  quotes: {
    total_job_sale: number;
    total_profit: number;
    product_type: string;
    inputs: Record<string, unknown> | null;
    created_by: string;
  } | null;
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const RANGES = [
  { value: "month",   label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year",    label: "This Year" },
  { value: "all",     label: "All Time" },
];

function rangeStart(range: string): Date | null {
  const now = new Date();
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "quarter") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (range === "year") return new Date(now.getFullYear(), 0, 1);
  return null;
}

export default function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const { profile, loading: profileLoading } = useProfile();
  const supabase = createClient();

  useEffect(() => {
    if (profileLoading || !profile) return;

    async function load() {
      const { data } = await supabase
        .from("proposals")
        .select("status, created_at, quotes!inner(total_job_sale, total_profit, product_type, inputs, created_by, company_id)")
        .eq("quotes.company_id", profile!.company_id);

      let list = (data as unknown as ReportRow[]) || [];
      if (profile!.role === "sales_rep") {
        list = list.filter((r) => r.quotes && r.quotes.created_by === profile!.id);
      }
      setRows(list);
      setLoading(false);
    }
    load();
  }, [profile, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const start = rangeStart(range);
    if (!start) return rows;
    return rows.filter((r) => new Date(r.created_at) >= start);
  }, [rows, range]);

  const stats = useMemo(() => {
    const totalCount = filtered.length;
    const won = filtered.filter((r) => isWonStatus(r.status));
    const totalWonValue = won.reduce((s, r) => s + (r.quotes?.total_job_sale || 0), 0);
    const totalWonProfit = won.reduce((s, r) => s + (r.quotes?.total_profit || 0), 0);
    const conversionRate = totalCount > 0 ? won.length / totalCount : 0;

    const byStatus = new Map<string, { count: number; value: number }>();
    for (const r of filtered) {
      const cur = byStatus.get(r.status) || { count: 0, value: 0 };
      cur.count += 1;
      cur.value += r.quotes?.total_job_sale || 0;
      byStatus.set(r.status, cur);
    }

    const bySalesman = new Map<string, { count: number; value: number }>();
    for (const r of won) {
      const name = (r.quotes?.inputs?.salesman as string) || "Unknown";
      const cur = bySalesman.get(name) || { count: 0, value: 0 };
      cur.count += 1;
      cur.value += r.quotes?.total_job_sale || 0;
      bySalesman.set(name, cur);
    }

    const byProduct = new Map<string, { count: number; value: number }>();
    for (const r of won) {
      const type = (r.quotes?.product_type || "unknown").replace("_", " ");
      const cur = byProduct.get(type) || { count: 0, value: 0 };
      cur.count += 1;
      cur.value += r.quotes?.total_job_sale || 0;
      byProduct.set(type, cur);
    }

    return {
      totalCount, wonCount: won.length, totalWonValue, totalWonProfit, conversionRate,
      byStatus: Array.from(byStatus.entries()).sort((a, b) => b[1].value - a[1].value),
      bySalesman: Array.from(bySalesman.entries()).sort((a, b) => b[1].value - a[1].value),
      byProduct: Array.from(byProduct.entries()).sort((a, b) => b[1].value - a[1].value),
    };
  }, [filtered]);

  const isRepView = profile?.role === "sales_rep";

  return (
    <>
      <TopBar title="Reports" subtitle={isRepView ? "Your sales overview" : "Company sales overview"} />
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-5xl mx-auto space-y-4">

          <div className="flex gap-2">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={"px-4 py-2 rounded-xl text-sm font-semibold transition " +
                  (range === r.value ? "text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
                style={range === r.value ? { backgroundColor: "#CC2229" } : {}}
              >
                {r.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="card px-5 py-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <>
              {/* Top-line stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="card p-4">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">
                    <FileText size={13} /> Proposals
                  </div>
                  <p className="text-2xl font-black text-gray-900">{stats.totalCount}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">
                    <DollarSign size={13} /> Won Sales
                  </div>
                  <p className="text-2xl font-black" style={{ color: "#CC2229" }}>{fmt(stats.totalWonValue)}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">
                    <TrendingUp size={13} /> Won Profit
                  </div>
                  <p className="text-2xl font-black text-green-600">{fmt(stats.totalWonProfit)}</p>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">
                    <Percent size={13} /> Conversion
                  </div>
                  <p className="text-2xl font-black text-gray-900">{(stats.conversionRate * 100).toFixed(0)}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stats.wonCount} of {stats.totalCount} won</p>
                </div>
              </div>

              {/* By status */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-bold text-gray-800">By Status</h2>
                </div>
                {stats.byStatus.length === 0 ? (
                  <div className="px-5 py-6 text-center text-gray-400 text-sm">No data for this range.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {stats.byStatus.map(([status, s]) => (
                      <div key={status} className="px-5 py-3 flex items-center justify-between">
                        <StatusBadge status={status} />
                        <div className="text-right">
                          <span className="text-gray-500 text-xs mr-3">{s.count} quote{s.count === 1 ? "" : "s"}</span>
                          <span className="font-mono font-semibold text-gray-900 text-sm">{fmt(s.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* By salesman - hidden for reps, since it'd just be their own single row */}
                {!isRepView && (
                  <div className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h2 className="text-sm font-bold text-gray-800">Won Sales by Salesman</h2>
                    </div>
                    {stats.bySalesman.length === 0 ? (
                      <div className="px-5 py-6 text-center text-gray-400 text-sm">No won sales for this range.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {stats.bySalesman.map(([name, s]) => (
                          <div key={name} className="px-5 py-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">{name}</span>
                            <div className="text-right">
                              <span className="text-gray-500 text-xs mr-3">{s.count} job{s.count === 1 ? "" : "s"}</span>
                              <span className="font-mono font-semibold text-gray-900 text-sm">{fmt(s.value)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* By product type */}
                <div className="card overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-800">Won Sales by Product</h2>
                  </div>
                  {stats.byProduct.length === 0 ? (
                    <div className="px-5 py-6 text-center text-gray-400 text-sm">No won sales for this range.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {stats.byProduct.map(([type, s]) => (
                        <div key={type} className="px-5 py-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800 capitalize">{type}</span>
                          <div className="text-right">
                            <span className="text-gray-500 text-xs mr-3">{s.count} job{s.count === 1 ? "" : "s"}</span>
                            <span className="font-mono font-semibold text-gray-900 text-sm">{fmt(s.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
