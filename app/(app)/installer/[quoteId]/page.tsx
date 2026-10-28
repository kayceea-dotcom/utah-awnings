"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";
import CoverDiagram from "@/components/quote/CoverDiagram";
import SideProfileDiagram from "@/components/quote/SideProfileDiagram";
import { consolidateLineItems } from "@/lib/pricing/shared";
import { resizeImage } from "@/lib/imageResize";
import { INSTALL_CHECKLIST, checklistComplete, checklistDoneCount, type InstallChecklistState } from "@/lib/installChecklist";
import type { BeamConfig, LineItem, WallConfig } from "@/lib/pricing/types";
import { ArrowLeft, Phone, MapPin, CalendarDays, Camera, X, CheckCircle2, Loader2 } from "lucide-react";

interface JobQuote {
  id: string;
  estimated_install_date: string | null;
  install_completed_at: string | null;
  install_checklist: InstallChecklistState | null;
  install_photos: string[] | null;
  inputs: Record<string, unknown> | null;
  line_items: LineItem[] | null;
  notes: string | null;
  style: string | null;
  product_type: string | null;
  customers: { name: string; phone: string | null; address: string | null; city: string | null; zip: string | null } | null;
}

export default function InstallerJobPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [job, setJob] = useState<JobQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<InstallChecklistState>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const [showMaterials, setShowMaterials] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from("quotes")
        .select("id, estimated_install_date, install_completed_at, install_checklist, install_photos, inputs, line_items, notes, style, product_type, customers(name, phone, address, city, zip)")
        .eq("id", quoteId)
        .single();
      if (err || !data) { setError(err?.message || "Job not found"); setLoading(false); return; }
      const q = data as unknown as JobQuote;
      setJob(q);
      setChecklist(q.install_checklist || {});
      setPhotos(q.install_photos || []);
      setLoading(false);
    }
    load();
  }, [quoteId]);

  const finished = !!job?.install_completed_at;

  async function saveProgress(nextChecklist: InstallChecklistState, nextPhotos: string[]) {
    const { error: err } = await supabase.rpc("installer_save_progress", {
      p_quote_id: quoteId, p_checklist: nextChecklist, p_photos: nextPhotos,
    });
    if (err) setError("Couldn't save: " + err.message);
    else setError("");
  }

  function toggle(key: string) {
    if (finished) return;
    const next = { ...checklist, [key]: !checklist[key] };
    setChecklist(next);
    saveProgress(next, photos);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || finished) return;
    const picked = Array.from(files);
    setUploading((n) => n + picked.length);
    let current = photos;
    for (const file of picked) {
      try {
        const blob = await resizeImage(file);
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^.]+$/, "") + ".jpg";
        const path = "install/" + quoteId + "/" + Date.now() + "-" + safe;
        const { error: upErr } = await supabase.storage.from("renders").upload(path, blob, { contentType: blob.type || "image/jpeg" });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("renders").getPublicUrl(path);
        current = [...current, data.publicUrl];
        setPhotos(current);
        await saveProgress(checklist, current);
      } catch (e) {
        setError("A photo didn't upload: " + (e instanceof Error ? e.message : "unknown error"));
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(url: string) {
    if (finished) return;
    const next = photos.filter((p) => p !== url);
    setPhotos(next);
    saveProgress(checklist, next);
  }

  async function handleFinish() {
    setFinishing(true);
    setError("");
    const res = await fetch("/api/installer/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId, checklist, photos }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Couldn't finish the job");
    } else {
      setJob((j) => (j ? { ...j, install_completed_at: data.completedAt || new Date().toISOString() } : j));
    }
    setFinishing(false);
  }

  if (loading) return <><TopBar title="Job" /><main className="p-6 text-center text-gray-400 text-sm">Loading...</main></>;
  if (!job) return <><TopBar title="Job" /><main className="p-6 text-center text-red-600 text-sm">{error || "Job not found"}</main></>;

  const c = job.customers;
  const inp = job.inputs;
  const productType = String(job.product_type || job.style || "");
  const showRafterTails = productType === "pergola" ? true : productType === "irp" ? false : !!inp && inp.wrapType !== "none" && !!inp.rafterTails;
  const address = [c?.address, c?.city].filter(Boolean).join(", ");
  const allChecked = checklistComplete(checklist);
  const canFinish = allChecked && photos.length > 0 && uploading === 0 && !finishing;
  const colors = inp
    ? ([["Pan", inp.colorPans], ["Gutter/Fascia", inp.colorGutterFascia], ["Posts/Beam", inp.colorPostsBeam], ["Pergola", inp.colorPergola]] as [string, unknown][])
        .filter(([, v]) => !!v)
    : [];
  const materials = consolidateLineItems(job.line_items || []);

  return (
    <>
      <TopBar title={(inp?.jobName as string) || c?.name || "Job"} subtitle={c?.name} />
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Link href="/installer" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft size={15} /> My Jobs
          </Link>

          {finished && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-800 text-sm font-semibold">
              <CheckCircle2 size={18} />
              Finished {new Date(job.install_completed_at as string).toLocaleDateString()} - the office has been notified.
            </div>
          )}

          <div className="card p-5 space-y-3">
            <p className="section-heading">Job</p>
            <p className="font-bold text-gray-900">{c?.name}</p>
            {c?.phone && (
              <a href={"tel:" + c.phone} className="flex items-center gap-2 text-sm text-blue-700 font-semibold"><Phone size={14} />{c.phone}</a>
            )}
            {address && (
              <a href={"https://maps.google.com/?q=" + encodeURIComponent(address + " " + (c?.zip || ""))} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-700 font-semibold"><MapPin size={14} />{address}</a>
            )}
            <p className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays size={14} />
              {job.estimated_install_date ? new Date(job.estimated_install_date).toLocaleDateString() : "Install date TBD"}
            </p>
            {colors.length > 0 && (
              <p className="text-sm text-gray-600">{colors.map(([k, v]) => k + ": " + String(v)).join("  |  ")}</p>
            )}
            {job.notes && <p className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{job.notes}</p>}
          </div>

          {inp && (Number(inp.projection1) || 0) > 0 && (
            <div className="space-y-3">
              <CoverDiagram
                projection1={Number(inp.projection1) || 0}
                width1={Number(inp.width1) || 0}
                projection2={Number(inp.projection2) || 0}
                width2={Number(inp.width2) || 0}
                jogType={String(inp.jogType || "ground")}
                posts1={Number(inp.posts1) || 0}
                posts2={Number(inp.posts2) || 0}
                downspouts={Number(inp.downspouts) || 1}
                downspoutSide={String(inp.downspoutSide || "right")}
                showRafterTails={showRafterTails}
                beams={(inp.beams as BeamConfig[]) || []}
                walls={(inp.walls as WallConfig[]) || []}
                beamType1={String(inp.beamType1 || "3x8")}
                beamType2={String(inp.beamType2 || "3x8")}
                mountStyle={String(inp.mountStyle || "attached")}
                rearPosts={Number(inp.rearPosts) || 0}
              />
              <SideProfileDiagram
                projection={Number(inp.projection1) || 0}
                postHeight={Number(inp.postHeight1) || 0}
                deckHeight={Number(inp.deckHeight) || 0}
                houseAttachment={String(inp.houseAttachment || "stucco")}
                groundAttachment={String(inp.groundAttachment || "concrete")}
                beamType={String(inp.beamType1 || "3x8")}
                wrapType={String(inp.wrapType || "none")}
                hasPanel={productType !== "pergola"}
                endCut={String(inp.beamEndCut1 || "beveled")}
                showRafterTail={showRafterTails}
                mountStyle={String(inp.mountStyle || "attached")}
                rearPostHeight={Number(inp.rearPostHeight) || 0}
                rearBeamType={String(inp.rearBeamType || inp.beamType1 || "3x8")}
                rearEndCut={String(inp.rearBeamEndCut || inp.beamEndCut1 || "beveled")}
                walls={(inp.walls as WallConfig[]) || []}
                beams={(inp.beams as BeamConfig[]) || []}
              />
            </div>
          )}

          <div className="card overflow-hidden">
            <button onClick={() => setShowMaterials((v) => !v)} className="w-full px-5 py-4 flex items-center justify-between text-left">
              <span className="section-heading">Materials ({materials.length} items)</span>
              <span className="text-xs text-gray-500">{showMaterials ? "Hide" : "Show"}</span>
            </button>
            {showMaterials && (
              <div className="overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {["Item", "Qty", "Len", "Color"].map((h) => (
                        <th key={h} className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {materials.map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-gray-800">{m.name}</td>
                        <td className="px-4 py-2 text-gray-600 font-mono">{m.qty}</td>
                        <td className="px-4 py-2 text-gray-600 font-mono">{(m.displayLength ?? m.length) || "-"}</td>
                        <td className="px-4 py-2 text-gray-600">{m.color}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="section-heading">Finished checklist</p>
              <span className="text-xs font-semibold text-gray-500">{checklistDoneCount(checklist)} of {INSTALL_CHECKLIST.length}</span>
            </div>
            <div className="space-y-2">
              {INSTALL_CHECKLIST.map((item) => {
                const on = checklist[item.key] === true;
                return (
                  <button key={item.key} onClick={() => toggle(item.key)} disabled={finished}
                    className={"w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition " +
                      (on ? "border-green-300 bg-green-50 text-green-800" : "border-gray-200 bg-white text-gray-700") +
                      (finished ? " opacity-80" : " active:scale-[0.99]")}>
                    <span className={"w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 " +
                      (on ? "bg-green-600 border-green-600 text-white" : "border-gray-300")}>
                      {on && <CheckCircle2 size={16} />}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <p className="section-heading">Photos of the finished job ({photos.length})</p>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url) => (
                  <div key={url} className="relative aspect-square">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="Finished job" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    </a>
                    {!finished && (
                      <button onClick={() => removePhoto(url)} className="absolute -top-1.5 -right-1.5 bg-white border border-gray-300 rounded-full p-1 shadow">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!finished && (
              <>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading > 0} className="btn-secondary w-full justify-center disabled:opacity-50">
                  {uploading > 0 ? <><Loader2 size={15} className="animate-spin" /> Uploading {uploading}...</> : <><Camera size={15} /> Add photos</>}
                </button>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

          {!finished && (
            <div className="space-y-2">
              <button onClick={handleFinish} disabled={!canFinish} className="btn-primary w-full justify-center disabled:opacity-50">
                {finishing ? "Finishing..." : "Finish job"}
              </button>
              {!canFinish && !finishing && (
                <p className="text-xs text-gray-500 text-center">
                  {!allChecked ? "Check off every item" : photos.length === 0 ? "Add at least one photo" : "Waiting for uploads"} to finish.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
