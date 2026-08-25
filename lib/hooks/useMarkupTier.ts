import { useEffect, useState } from "react";

export type MarkupTier = "r8" | "r14" | "r16" | "r19" | "r20" | "custom";

export const MARKUP_TIER_OPTIONS: { value: MarkupTier; label: string }[] = [
  { value: "r8", label: "1.41x — 8% commission" },
  { value: "r14", label: "1.8x — 14% commission" },
  { value: "r16", label: "1.9x — 16% commission" },
  { value: "r19", label: "2.0x — 19% commission" },
  { value: "r20", label: "2.1x — 20% commission" },
  { value: "custom", label: "Custom" },
];

const TIER_MARKUPS: Record<Exclude<MarkupTier, "custom">, number> = {
  r8: 1.41,
  r14: 1.8,
  r16: 1.9,
  r19: 2.0,
  r20: 2.1,
};

// Keeps the quote's price pinned to a chosen commission-tier markup
// (matching the rate card in lib/commission/schedule.ts) as material cost
// changes, by continuously solving for the raw markup multiplier (the one
// fed into finalizePricing) that produces that exact commission-basis
// markup (price / materialCost). Picking "Custom" freezes it so the rep can
// type any multiplier by hand.
//
// Deliberately solves against a $0 discount (the pre-discount sticker
// price) - if it re-targeted including the live discount, applying a
// discount would just make this hook raise markup to cancel it back out,
// and the customer's price would never actually move.
//
// Solves against materialsBase (materialCost + tax) rather than the full
// subtotal - the full subtotal also includes footings/roof mounts/misc,
// and solving against that would do the exact same silent cancel-out for
// THOSE: adding $500 of footings would just make this hook lower markup by
// enough to hold the same target price, quietly eating the $500 out of
// margin instead of passing it through to the customer. Add-on costs need
// to move the price; only the true materials markup should stay pinned.
export function useMarkupTier(opts: {
  materialCost: number;
  materialsBase: number;
  markup: number;
  setMarkup: (markup: number) => void;
}) {
  const [tier, setTier] = useState<MarkupTier>("r19");
  const { materialCost, materialsBase, markup, setMarkup } = opts;

  useEffect(() => {
    if (tier === "custom") return;
    if (materialCost <= 0 || materialsBase <= 0) return;
    const targetPrice = TIER_MARKUPS[tier] * materialCost;
    const required = targetPrice / materialsBase;
    if (!Number.isFinite(required) || required <= 0) return;
    // Round UP (never down) at high precision - rounding down, even by a
    // fraction of a cent, can land the price a cent under the tier's
    // markup threshold.
    const rounded = Math.ceil(required * 1e6) / 1e6;
    if (Math.abs(rounded - markup) > 0.000001) {
      setMarkup(rounded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, materialCost, materialsBase]);

  return {
    tier,
    setTier,
    reset: () => setTier("r19"),
  };
}
