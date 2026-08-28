import { useEffect, useState } from "react";

export type MarkupTier = "r8" | "r13" | "r14" | "r16" | "r19" | "r20" | "custom";

export const MARKUP_TIER_OPTIONS: { value: MarkupTier; label: string }[] = [
  { value: "r8", label: "1.41x — 8% commission" },
  { value: "r13", label: "1.7x — 13% commission (jobs over $10,000 material)" },
  { value: "r14", label: "1.8x — 14% commission" },
  { value: "r16", label: "1.9x — 16% commission" },
  { value: "r19", label: "2.0x — 19% commission" },
  { value: "r20", label: "2.1x — 20% commission" },
  { value: "custom", label: "Custom" },
];

const TIER_MARKUPS: Record<Exclude<MarkupTier, "custom">, number> = {
  r8: 1.41,
  r13: 1.7,
  r14: 1.8,
  r16: 1.9,
  r19: 2.0,
  r20: 2.1,
};

// Keeps the quote's price pinned to a chosen commission-tier markup
// (matching the rate card in lib/commission/schedule.ts) as material cost
// changes, by setting the raw markup multiplier (the one fed into
// finalizePricing) to the tier value directly. Picking "Custom" freezes it
// so the rep can type any multiplier by hand.
//
// The raw markup applies to the full subtotal (materialsBase + footings/
// roof mounts/misc/tear down), while the commission markup itself - see
// lib/commission/engine.ts - is price / materialsBase (materialCost + tax,
// no add-ons). Setting raw markup = the tier value directly means: with no
// add-ons, the two markups come out identical, exactly hitting the tier;
// with add-ons, the real commission markup ends up a little ABOVE the
// tier, since those add-ons raise price but aren't in the denominator - a
// deliberate choice so add-on costs move the price instead of being
// silently absorbed into a lower markup to hold the target exactly.
//
// Deliberately ignores any live discount (the pre-discount sticker price)
// - if it re-targeted including the discount, applying one would just make
// this hook raise markup to cancel it back out, and the customer's price
// would never actually move.
export function useMarkupTier(opts: {
  materialsBase: number;
  markup: number;
  setMarkup: (markup: number) => void;
}) {
  const [tier, setTier] = useState<MarkupTier>("r19");
  const { materialsBase, markup, setMarkup } = opts;

  useEffect(() => {
    if (tier === "custom") return;
    if (materialsBase <= 0) return;
    // Round UP (never down) at high precision - rounding down, even by a
    // fraction of a cent, can land the price a cent under the tier's
    // markup threshold.
    const rounded = Math.ceil(TIER_MARKUPS[tier] * 1e6) / 1e6;
    if (Math.abs(rounded - markup) > 0.000001) {
      setMarkup(rounded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, materialsBase]);

  return {
    tier,
    setTier,
    reset: () => setTier("r19"),
  };
}
