"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";
import { HardHat, MapPin, CalendarDays, CheckCircle2, ChevronRight } from "lucide-react";
import { INSTALL_CHECKLIST, checklistDoneCount, type InstallChecklistState } from "@/lib/installChecklist";

interface InstallerJob {
  id: string;
  estimated_install_date: string | null;
  install_completed_at: string | null;
  install_checklist: InstallChecklistState | null;
  inputs: Record<string, unknown> | null;
  customers: { name: string; address: string | null; city: string | null; zip: string | null } | null;
}

function JobCard({ job }: { job: InstallerJob }) {
  const done = checklistDoneCount(job.install_checklist);
  const finished = !!job.install_completed_at;
  const c = job.customers;
  const address = [c?.address, c?.city].filter(Boolean).join(", ");
  return (
    <Link href={"/installer/" + job.id} className="card p-4 flex items-center gap-3 hover:bg-gray-50 transition">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-bold text-gray-900 truncate">{(job.inputs?.jobName as string) || c?.name || "Untitled job"}</p>
        <p className="text-sm text-gray-600 truncate">{c?.name}</p>
        {address && <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><MapPin size={12} />{address}</p>}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <CalendarDays size={12} />
          {job.estimated_install_date ? new Date(job.estimated_install_date).toLocaleDateString() : "Install date TBD"}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        {finished ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
            <CheckCircle2 size={13} /> Finished
          </span>
        ) : (
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
            {done === 0 ? "Not started" : done + " of " + INSTALL_CHECKLIST.length}
          </span>
        )}
      </div>
      <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
    </Link>
  );
}

export default function InstallerJobsPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<InstallerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error: err } = await supabase
        .from("quotes")
        .select("id, estimated_install_date, install_completed_at, install_checklist, inputs, customers(name, address, city, zip)")
        .eq("installer_id", user.id)
        .is("deleted_at", null)
        .order("estimated_install_date", { ascending: true, nullsFirst: false });
      if (err) setError(err.message);
      setJobs((data as unknown as InstallerJob[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const active = jobs.filter((j) => !j.install_completed_at);
  const finished = jobs.filter((j) => j.install_completed_at);

  return (
    <>
      <TopBar title="My Jobs" subtitle="Jobs assigned to you" />
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          ) : jobs.length === 0 ? (
            <div className="card p-8 text-center text-gray-500 text-sm space-y-2">
              <HardHat size={28} className="mx-auto text-gray-300" />
              <p>No jobs assigned to you yet.</p>
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <p className="section-heading">To do ({active.length})</p>
                {active.length === 0 && <p className="text-sm text-gray-400">Nothing left - all caught up.</p>}
                {active.map((j) => <JobCard key={j.id} job={j} />)}
              </section>
              {finished.length > 0 && (
                <section className="space-y-3">
                  <p className="section-heading">Finished ({finished.length})</p>
                  {finished.map((j) => <JobCard key={j.id} job={j} />)}
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
