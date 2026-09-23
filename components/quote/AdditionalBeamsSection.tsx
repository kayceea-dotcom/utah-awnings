"use client";

import { ChevronDown } from "lucide-react";
import Field from "./Field";
import type { BeamConfig } from "@/lib/pricing/types";

const POST_HEIGHTS = [8, 10, 12, 14, 16, 20];

interface Props {
  beams: BeamConfig[];
  onChange: (beams: BeamConfig[]) => void;
  beamTypeOptions: { value: string; label: string }[];
  // First extra beam's display number - continues the count from whatever
  // primary beam(s) the product already has (3 for a two-run product like
  // Flat Panel/V-Panel/IRP, 2 for Pergola's single unlabeled primary beam).
  numberOffset: number;
  // Seeds a new beam's length from the job's own width, same as the
  // primary beam(s) do.
  defaultLength: number;
}

// Extra mid-span beams for a run that's too long to clear-span on its own -
// each gets its own posts. Shared across every product (Flat Panel, V-Panel,
// IRP, Pergola) so a long enough run can always get a middle beam added.
export default function AdditionalBeamsSection({ beams, onChange, beamTypeOptions, numberOffset, defaultLength }: Props) {
  function addBeam() {
    const newBeam: BeamConfig = { type: beamTypeOptions[0]?.value || "3x8", qty: 1, length: defaultLength || 0, positionFromHouse: 0, posts: 0, postHeight: 10 };
    onChange([...(beams || []), newBeam]);
  }
  function updateBeam(idx: number, patch: Partial<BeamConfig>) {
    const updated = [...(beams || [])];
    updated[idx] = { ...updated[idx], ...patch };
    onChange(updated);
  }
  function removeBeam(idx: number) {
    const updated = [...(beams || [])];
    updated.splice(idx, 1);
    onChange(updated);
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 lg:px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">Additional / Multi-Span Beams</span>
        <button onClick={addBeam} className="text-xs btn-secondary px-3 py-1.5">+ Add Beam</button>
      </div>
      {(beams || []).length > 0 && (
        <div className="px-4 lg:px-5 pb-5 space-y-4">
          {(beams || []).map((beam, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Beam {idx + numberOffset}</span>
                <button onClick={() => removeBeam(idx)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <div className="relative">
                    <select className="select pr-8" value={beam.type} onChange={(e) => updateBeam(idx, { type: e.target.value })}>
                      {beamTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </Field>
                <Field label="Qty">
                  <input type="number" className="input"
                    value={beam.qty === 0 ? "" : beam.qty} placeholder="1"
                    onChange={(e) => updateBeam(idx, { qty: parseInt(e.target.value) || 1 })} />
                </Field>
                <Field label="Length (ft)" hint="Width minus 6in">
                  <input type="number" className="input"
                    value={beam.length === 0 ? "" : beam.length} placeholder="0"
                    onChange={(e) => updateBeam(idx, { length: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field label="Position from House (ft)" hint="0 = at the house wall">
                  <input type="number" className="input"
                    value={beam.positionFromHouse === 0 ? "" : beam.positionFromHouse} placeholder="0"
                    onChange={(e) => updateBeam(idx, { positionFromHouse: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field label="Posts (qty)">
                  <input type="number" className="input"
                    value={beam.posts === 0 ? "" : beam.posts} placeholder="0"
                    onChange={(e) => updateBeam(idx, { posts: parseInt(e.target.value) || 0 })} />
                </Field>
                <Field label="Post Height (ft)">
                  <div className="relative">
                    <select className="select pr-8" value={String(beam.postHeight)} onChange={(e) => updateBeam(idx, { postHeight: Number(e.target.value) })}>
                      {POST_HEIGHTS.map((h) => <option key={h} value={String(h)}>{h} ft</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
