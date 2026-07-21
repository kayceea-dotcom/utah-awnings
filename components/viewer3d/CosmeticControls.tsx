"use client";

import type { CosmeticOverrides } from "@/lib/scene/types";

const COLORS = ["White", "Siennawood", "Slate", "Driftwood", "Beechwood", "Maplewood", "Ebony", "Sandlewood"];

interface CosmeticControlsProps {
  value: CosmeticOverrides;
  onChange: (next: CosmeticOverrides) => void;
}

// 3D-preview-only controls for options that don't exist on NewportInputs yet
// (roof pitch, accent color, trim, recessed lights, shade walls, drop-down
// shades). Purely visual — never touches pricing, the quote form, or saves.
export default function CosmeticControls({ value, onChange }: CosmeticControlsProps) {
  const shadeWallSides = value.shadeWalls?.sides ?? [];
  const dropShadeSides = value.dropDownShades?.sides ?? [];

  function toggleSide<T extends string>(sides: T[], side: T): T[] {
    return sides.includes(side) ? sides.filter((s) => s !== side) : [...sides, side];
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-xs space-y-3">
      <p className="font-medium text-slate-500">3D preview only — not priced yet</p>

      <label className="block">
        <span className="text-slate-600">Accent Color</span>
        <select
          className="select w-full"
          value={value.accentColor ?? ""}
          onChange={(e) => onChange({ ...value, accentColor: e.target.value || undefined })}
        >
          <option value="">Match Frame Color</option>
          {COLORS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.trim?.enabled ?? false}
          onChange={(e) => onChange({ ...value, trim: { enabled: e.target.checked, color: value.trim?.color ?? "White" } })}
        />
        <span className="text-slate-600">Trim</span>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.recessedLights?.enabled ?? false}
          onChange={(e) =>
            onChange({ ...value, recessedLights: { enabled: e.target.checked, qty: value.recessedLights?.qty ?? 3 } })
          }
        />
        <span className="text-slate-600">Recessed Lights</span>
        {value.recessedLights?.enabled && (
          <input
            type="number"
            min={1}
            max={12}
            value={value.recessedLights?.qty ?? 3}
            onChange={(e) => onChange({ ...value, recessedLights: { enabled: true, qty: Number(e.target.value) } })}
            className="input w-16"
          />
        )}
      </label>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.shadeWalls?.enabled ?? false}
            onChange={(e) => onChange({ ...value, shadeWalls: { enabled: e.target.checked, sides: shadeWallSides } })}
          />
          <span className="text-slate-600">Shade Walls</span>
        </label>
        {value.shadeWalls?.enabled && (
          <div className="flex gap-3 pl-6 pt-1">
            {(["left", "right", "back"] as const).map((side) => (
              <label key={side} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={shadeWallSides.includes(side)}
                  onChange={() => onChange({ ...value, shadeWalls: { enabled: true, sides: toggleSide(shadeWallSides, side) } })}
                />
                <span className="capitalize text-slate-500">{side}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.dropDownShades?.enabled ?? false}
            onChange={(e) => onChange({ ...value, dropDownShades: { enabled: e.target.checked, sides: dropShadeSides } })}
          />
          <span className="text-slate-600">Drop-Down Shades</span>
        </label>
        {value.dropDownShades?.enabled && (
          <div className="flex gap-3 pl-6 pt-1">
            {(["front", "left", "right"] as const).map((side) => (
              <label key={side} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={dropShadeSides.includes(side)}
                  onChange={() =>
                    onChange({ ...value, dropDownShades: { enabled: true, sides: toggleSide(dropShadeSides, side) } })
                  }
                />
                <span className="capitalize text-slate-500">{side}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
