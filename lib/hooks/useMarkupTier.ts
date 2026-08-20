import { useEffect, useState } from "react";
import { computeFloorPrice } from "@/lib/commission/engine";
import { markupForTargetPrice } from "@/lib/pricing/shared";

export type MarkupTier = "floor" | "plus5" | "plus15" | "custom";

export const MARKUP_TIER_OPTIONS: { value: MarkupTier; label: string }[] = [
  { value: "floor", label: "Floor (14% commission)" },
  { value: "plus5", label: "+5% above floor (17% commission)" },
  { value: "plus15", label: "+15% above floor (20% commission)" },
  { value: "custom", label: "Custom" },
];

const TIER_RATIOS: Record<Exclude<MarkupTier, "custom">, number> = {
  floor: 1.0,
  plus5: 1.05,
  plus15: 1.15,
};

// Keeps the quote's price pinned to a chosen commission tier (Floor/+5%/
// +15% above floor) as material cost changes, by continuously solving for
// the markup multiplier that hits that tier's ratio - the exact same
// inversion the one-time floor default used, just re-applied on every
// change instead of once. Picking "Custom" freezes it so the rep can type
// any multiplier by hand (including a below-floor one - that's still
// allowed, just flagged red elsewhere, per how this was scoped).
//
// Deliberately solves against a $0 discount (the pre-discount sticker
// price), not whatever discount is currently applied - if it re-targeted
// including the live discount, applying a discount would just make this
// hook raise markup to cancel it back out, and the customer's price would
// never actually move. A discount should genuinely reduce what they pay.
export function useMarkupTier(opts: {
  materialCost: number;
  subtotal: number;
  markup: number;
  setMarkup: (markup: number) => void;
}) {
  const [tier, setTier] = useState<MarkupTier>("floor");
  const { materialCost, subtotal, markup, setMarkup } = opts;

  useEffect(() => {
    if (tier === "custom") return;
    if (materialCost <= 0 || subtotal <= 0) return;
    const floor = computeFloorPrice(materialCost);
    const targetPrice = TIER_RATIOS[tier] * floor;
    const required = markupForTargetPrice(targetPrice, subtotal, 0);
    if (!Number.isFinite(required) || required <= 0) return;
    // Round UP (never down) at high precision - rounding down, even by a
    // fraction of a cent, can land the price a cent under the tier's
    // threshold (e.g. falsely dip back below floor).
    const rounded = Math.ceil(required * 1e6) / 1e6;
    if (Math.abs(rounded - markup) > 0.000001) {
      setMarkup(rounded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, materialCost, subtotal]);

  return {
    tier,
    setTier,
    reset: () => setTier("floor"),
  };
}
