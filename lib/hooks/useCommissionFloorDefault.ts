import { useEffect, useRef } from "react";
import { computeFloorPrice } from "@/lib/commission/engine";
import { markupForTargetPrice } from "@/lib/pricing/shared";

// Defaults a quote's price to the commission floor whenever material cost
// changes, by solving for the markup multiplier that produces it - until
// the rep manually edits Markup, at which point it stops overriding them
// (call markMarkupTouched from that field's onChange). Reset (e.g. the
// page's own "Reset" button) should call resetTouched so a fresh quote
// goes back to auto-defaulting.
export function useCommissionFloorDefault(opts: {
  materialCost: number;
  subtotal: number;
  discount: number;
  markup: number;
  setMarkup: (markup: number) => void;
}) {
  const touchedRef = useRef(false);
  const { materialCost, subtotal, discount, markup, setMarkup } = opts;

  useEffect(() => {
    if (touchedRef.current) return;
    if (materialCost <= 0 || subtotal <= 0) return;
    const floor = computeFloorPrice(materialCost);
    const required = markupForTargetPrice(floor, subtotal, discount);
    if (!Number.isFinite(required) || required <= 0) return;
    // Round UP (never down) at high precision - rounding the stored markup
    // down, even by a fraction of a cent, can push the resulting price a
    // cent under the floor and falsely trip the below-floor warning. Ceil
    // guarantees the resulting price lands at or a hair above the floor.
    const rounded = Math.ceil(required * 1e6) / 1e6;
    if (Math.abs(rounded - markup) > 0.000001) {
      setMarkup(rounded);
    }
    // Only re-default when the inputs driving the floor/subtotal change -
    // deliberately excludes `markup`/`setMarkup` so setting it here doesn't
    // retrigger itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialCost, subtotal, discount]);

  return {
    markMarkupTouched: () => { touchedRef.current = true; },
    resetTouched: () => { touchedRef.current = false; },
  };
}
