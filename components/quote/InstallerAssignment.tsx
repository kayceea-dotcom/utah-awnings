"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HardHat, CheckCircle2 } from "lucide-react";
import { INSTALL_CHECKLIST, checklistDoneCount, type InstallChecklistState } from "@/lib/installChecklist";

interface InstallFields {
  installer_id: string | null;
  install_checklist: InstallChecklistState | null;
  install_photos: string[] | null;
  install_completed_at: string | null;
}

// Staff-side half of installer profiles: pick which installer a job is
// assigned to, and see how far along they are - including the photos once
// they've finished. The installer's own side lives under /installer.
export default function InstallerAssignment({ quoteId, companyId, canManage }: {
  quoteId: string;
  companyId: string;
  canManage: boolean;
}) {
  const supabase = createClient();
  const [installers, setInstallers] = useState<{ id: string; full_name: string }[]>([]);
  const [fields, setFields] = useState<InstallFields | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: q, error: qErr } = await supabase
        .from("quotes")
        .select("installer_id, install_checklist, install_photos, install_completed_at")
        .eq("id", quoteId)
        .single();
      // Columns don't exist until the installer migration has been run -
      // stay out of the way rather than showing a broken card.
      if (qErr || !q) { setUnavailable(true); return; }
      setFields(q as InstallFields);
      const { data: people } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("company_id", companyId)
        .eq("role", "installer")
        .order("full_name");
      setInstallers(people || []);
    }
    load();
  }, [quoteId, companyId]);

  async function assign(installerId: string) {
    setSaving(true);
    setError("");
    const { error: err } = await supabase
      .from("quotes")
      .update({ installer_id: installerId || null })
      .eq("id", quoteId);
    if (err) setError(err.message);
    else setFields((f) => (f ? { ...f, installer_id: installerId || null } : f));
    setSaving(false);
  }

  if (unavailable || !fields) return null;
  // Nothing to show for someone who can't assign and has no installer on the job.
  if (!canManage && !fields.installer_id) return null;

  const assigned = installers.find((i) => i.id === fields.installer_id);
  const done = checklistDoneCount(fields.install_checklist);
  const photos = fields.install_photos || [];

  return (
    <div className="card p-5 space-y-3">
      <p className="section-heading flex items-center gap-2"><HardHat size={14} /> Installer</p>

      {canManage ? (
        <select className="select" value={fields.installer_id || ""} disabled={saving || !!fields.install_completed_at}
          onChange={(e) => assign(e.target.value)}>
          <option value="">{installers.length === 0 ? "No installers yet - invite one in Settings > Team" : "Unassigned"}</option>
          {installers.map((i) => <option key={i.id} value={i.id}>{i.full_name}</option>)}
        </select>
      ) : (
        <p className="text-sm font-medium text-gray-800">{assigned?.full_name || "Assigned"}</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {fields.installer_id && (
        fields.install_completed_at ? (
          <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
            <CheckCircle2 size={15} /> Finished {new Date(fields.install_completed_at).toLocaleDateString()}
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            {done === 0 && photos.length === 0
              ? "Assigned - not started yet."
              : done + " of " + INSTALL_CHECKLIST.length + " checklist items, " + photos.length + " photo" + (photos.length === 1 ? "" : "s")}
          </p>
        )
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt="Install photo" className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
