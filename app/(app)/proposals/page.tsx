"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import FollowUpBadge from "@/components/FollowUpBadge";
import { Search, FileText, Plus } from "lucide-react";
import { getFollowUpStatus, matchesFollowUpFilter } from "@/lib/followups/engine";
import { FOLLOWUP_STEPS } from "@/lib/followups/steps";

interface ProposalRow {
  token: string;
  status: string;
  created_at: string;
  quote_id: string;
  initial_email_sent_at: string | null;
  followup1_sent_at: string | null;
  followup2_sent_at: string | null;
  final_followup_sent_at: string | null;
  quotes: {
    total_job_sale: number;
    product_type: string;
    inputs: Record<string, unknown> | null;
    created_by: string;
    customers: { name: string } | null;
  } | null;
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const STATUS_OPTS = ["all", "draft", "sent", "signed", "ordered", "accepted", "pending_payment"];
const FOLLOWUP_FILTER_OPTS = [
  { value: "all", label: "All Follow-ups" },
  ...FOLLOWUP_STEPS.filter((s) => s.enabled).map((s) => ({ value: s.key, label: "Needs " + s.label })),
  { value: "waiting", label: "Waiting" },
  { value: "complete", label: "Complete" },
];

export default function ProposalsPage() {
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (profileLoading || !profile) return;

    async function load() {
      const { data } = await supabase
        .from("proposals")
        .select("token, status, created_at, quote_id, initial_email_sent_at, followup1_sent_at, followup2_sent_at, final_followup_sent_at, quotes!inner(total_job_sale, product_type, inputs, created_by, company_id, customers(name))")
        .eq("quotes.company_id", profile!.company_id)
        .order("created_at", { ascending: false });

      let list = (data as unknown as ProposalRow[]) || [];
      if (profile!.role === "sales_rep") {
        list = list.filter((r) => r.quotes && r.quotes.created_by === profile!.id);
      }
      setRows(list);
      setLoading(false);
    }
    load();
  }, [profile, profileLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const rowsWithFollowUp = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        followUp: getFollowUpStatus({
          initial_email_sent_at: r.initial_email_sent_at,
          followup1_sent_at: r.followup1_sent_at,
          followup2_sent_at: r.followup2_sent_at,
          final_followup_sent_at: r.final_followup_sent_at,
        }),
      })),
    [rows]
  );

  const filtered = useMemo(() => {
    let list = rowsWithFollowUp;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (followUpFilter !== "all") list = list.filter((r) => matchesFollowUpFilter(r.followUp, followUpFilter));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const jobName = (r.quotes?.inputs?.jobName as string) || "";
        const custName = r.quotes?.customers?.name || "";
        const salesman = (r.quotes?.inputs?.salesman as string) || "";
        return jobName.toLowerCase().includes(q) || custName.toLowerCase().includes(q) || salesman.toLowerCase().includes(q);
      });
    }
    return list;
  }, [rowsWithFollowUp, search, statusFilter, followUpFilter]);

  return (
    <>
      <TopBar title="Proposals" subtitle={profile?.role === "sales_rep" ? "Your proposals" : "All company proposals"}>
        <button onClick={() => router.push("/quote")} className="btn-primary text-xs px-3 py-2">
          <Plus size={13} /> New Quote
        </button>
      </TopBar>
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-5xl mx-auto space-y-4">

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search by job name or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative sm:w-52 flex-shrink-0">
              <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTS.map((s) => (
                  <option key={s} value={s}>{s === "all" ? "All Statuses" : s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div className="relative sm:w-52 flex-shrink-0">
              <select className="select" value={followUpFilter} onChange={(e) => setFollowUpFilter(e.target.value)}>
                {FOLLOWUP_FILTER_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <FileText size={16} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-800">Proposals ({filtered.length})</h2>
            </div>

            {loading ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                {search || statusFilter !== "all" || followUpFilter !== "all" ? "No proposals match your filters." : "No proposals yet."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {["Job Name","Customer","Salesman","Product","Status","Follow-up","Total","Created"].map((h) => (
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
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{(r.quotes?.inputs?.salesman as string) || "-"}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap capitalize">{(r.quotes?.product_type || "").replace("_", " ")}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3"><FollowUpBadge status={r.followUp} /></td>
                        <td className="px-4 py-3 text-gray-900 font-mono font-semibold whitespace-nowrap">{fmt(r.quotes?.total_job_sale || 0)}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
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
