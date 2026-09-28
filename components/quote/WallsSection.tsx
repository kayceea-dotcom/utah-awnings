"use client";

import { ChevronDown } from "lucide-react";
import Field from "./Field";
import type { WallConfig } from "@/lib/pricing/types";

const POSITIONS = [
  { value: "side", label: "Side" },
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
];

const COLORS = ["White", "Siennawood", "Slate", "Driftwood", "Beechwood", "Maplewood", "Ebony", "Sandlewood"];

interface Props {
  walls: WallConfig[];
  onChange: (walls: WallConfig[]) => void;
}

// Horizontal-2x6-board privacy wall, optional on any product - fills the gap
// between the house wall and a post, or between two posts, on the side,
// front, or back of the cover.
export default function WallsSection({ walls, onChange }: Props) {
  function addWall() {
    const newWall: WallConfig = { position: "side", length: 0, height: 0, gapIn: 1, alternating2x3: false, color: "White" };
    onChange([...(walls || []), newWall]);
  }
  function updateWall(idx: number, patch: Partial<WallConfig>) {
    const updated = [...(walls || [])];
    updated[idx] = { ...updated[idx], ...patch };
    onChange(updated);
  }
  function removeWall(idx: number) {
    const updated = [...(walls || [])];
    updated.splice(idx, 1);
    onChange(updated);
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 lg:px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-800">Walls</span>
        <button onClick={addWall} className="text-xs btn-secondary px-3 py-1.5">+ Add Wall</button>
      </div>
      {(walls || []).length > 0 && (
        <div className="px-4 lg:px-5 pb-5 space-y-4">
          {(walls || []).map((wall, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Wall {idx + 1}</span>
                <button onClick={() => removeWall(idx)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Position">
                  <div className="relative">
                    <select className="select pr-8" value={wall.position} onChange={(e) => updateWall(idx, { position: e.target.value as WallConfig["position"] })}>
                      {POSITIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </Field>
                <Field label="Color">
                  <div className="relative">
                    <select className="select pr-8" value={wall.color} onChange={(e) => updateWall(idx, { color: e.target.value })}>
                      {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </Field>
                <Field label="Length (ft)" hint="Between the post and house, or two posts">
                  <input type="number" className="input"
                    value={wall.length === 0 ? "" : wall.length} placeholder="0"
                    onChange={(e) => updateWall(idx, { length: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field label="Height (ft)">
                  <input type="number" className="input"
                    value={wall.height === 0 ? "" : wall.height} placeholder="0"
                    onChange={(e) => updateWall(idx, { height: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field label="Gap Between Boards (in)" hint="Usually 1in">
                  <input type="number" className="input"
                    value={wall.gapIn === 0 ? "" : wall.gapIn} placeholder="1"
                    onChange={(e) => updateWall(idx, { gapIn: parseFloat(e.target.value) || 0 })} />
                </Field>
                <Field label="Alternate 2x3s in the gaps">
                  <button
                    onClick={() => updateWall(idx, { alternating2x3: !wall.alternating2x3 })}
                    className={"w-full rounded-xl border px-4 py-3 text-sm font-semibold transition text-left min-h-12 " +
                      (wall.alternating2x3 ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}
                  >
                    {wall.alternating2x3 ? "Yes" : "No"}
                  </button>
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
