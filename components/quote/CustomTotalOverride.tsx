"use client";

import Field from "@/components/quote/Field";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// A simple on/off override for the final Total Job Sale - unlike Discount
// (which tracks multiple live-updating modes via useDiscountOption), this is
// just "auto-calculated" vs "rep typed an exact number", so it needs no hook
// of its own. autoTotal is always the un-overridden number (pricing.ts backs
// this out of totalJobSale via customTotalAdjustment), shown as a reference
// once the override is on and as the live total before it.
export default function CustomTotalOverride({ value, onChange, autoTotal }: {
  value: number | null;
  onChange: (v: number | null) => void;
  autoTotal: number;
}) {
  const enabled = value !== null;
  return (
    <div className="col-span-2 space-y-2">
      <Field label="Custom Total" hint={enabled
        ? "Overrides the calculated total (" + fmt(autoTotal) + ") - deposit, balance, and commission all follow this number"
        : "Auto-calculated: " + fmt(autoTotal)}>
        <button
          type="button"
          onClick={() => onChange(enabled ? null : Math.round(autoTotal))}
          className={"w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition " +
            (enabled ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-500")}
        >
          {enabled ? "Custom" : "Auto"}
        </button>
      </Field>
      {enabled && (
        <input
          type="number"
          className="input"
          value={value === 0 ? "" : (value ?? "")}
          placeholder="0"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
      )}
    </div>
  );
}
