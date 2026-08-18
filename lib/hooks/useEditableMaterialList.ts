"use client";

import { useState } from "react";
import type { LineItem, QuoteResult } from "@/lib/pricing/types";
import { finalizePricing } from "@/lib/pricing/shared";

// Lets a rep manually add/edit/remove line items for a custom job. Once
// edit mode starts, the edited list becomes authoritative (no longer
// overwritten by recalculation as other inputs change) until reset - editing
// mid-build would otherwise just get silently wiped by the next recalc.
// The rest of the pricing breakdown (taxes/markup/etc) is re-derived from the
// edited material cost via finalizePricing, using the same misc/footings/
// roofMounts/markup the auto-calculation already produced, so the total the
// customer sees always matches what's actually in the material list.
export function useEditableMaterialList(result: QuoteResult, inp: { taxRate: number; discount: number; footings: number; roofMounts: number; markup: number }) {
  const [editing, setEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<LineItem[]>([]);

  function startEditing() {
    setEditedItems(result.lineItems);
    setEditing(true);
  }

  function resetToCalculated() {
    setEditing(false);
    setEditedItems([]);
  }

  if (!editing) {
    return { editing, displayResult: result, startEditing, resetToCalculated, setEditedItems };
  }

  const materialCost = editedItems.reduce((s, i) => s + i.amount, 0);
  const pricing = finalizePricing(materialCost, {
    taxRate: inp.taxRate, discount: inp.discount,
    footings: inp.footings, roofMounts: inp.roofMounts,
    misc: result.misc, markup: inp.markup,
  });
  const displayResult: QuoteResult = {
    ...result,
    ...pricing,
    lineItems: editedItems,
    costPerSqFt:  result.totalSqFt > 0 ? pricing.subtotal     / result.totalSqFt : 0,
    pricePerSqFt: result.totalSqFt > 0 ? pricing.totalJobSale / result.totalSqFt : 0,
  };

  return { editing, displayResult, startEditing, resetToCalculated, setEditedItems };
}
