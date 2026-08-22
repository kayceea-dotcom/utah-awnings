"use client";

import { ChevronDown } from "lucide-react";
import Field from "@/components/quote/Field";
import { MARKUP_TIER_OPTIONS, type MarkupTier } from "@/lib/hooks/useMarkupTier";

export default function MarkupTierSelect({ tier, onTierChange, markup, onMarkupChange }: {
  tier: MarkupTier;
  onTierChange: (t: MarkupTier) => void;
  markup: number;
  onMarkupChange: (m: number) => void;
}) {
  return (
    <div className="col-span-2 space-y-2">
      <Field label="Markup" hint={tier === "custom" ? "Manual multiplier - any commission rate" : "Preset markup tier"}>
        <div className="relative">
          <select
            className="select pr-8"
            value={tier}
            onChange={(e) => onTierChange(e.target.value as MarkupTier)}
          >
            {MARKUP_TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronDown size={15} className="text-gray-400" />
          </div>
        </div>
      </Field>
      {tier === "custom" && (
        <input
          type="number"
          className="input"
          value={markup === 0 ? "" : markup}
          placeholder="0"
          onChange={(e) => onMarkupChange(parseFloat(e.target.value) || 0)}
        />
      )}
    </div>
  );
}
