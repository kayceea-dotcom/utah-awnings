import { RATES } from "./rates";
import { li, finalizePricing } from "./shared";
import { CATALOG_BY_KEY } from "./catalog";
import type { LineItem, QuoteResult } from "./types";

export interface IndividualLineInput {
  id: string;
  rateKey: string;
  qty: number;
  length: number;
  color: string;
}

export interface IndividualInputs {
  jobName: string;
  salesman: string;
  housePhotoUrl: string;
  items: IndividualLineInput[];
  discount: number;
  footings: number;
  roofMounts: number;
  misc: number;
  markup: number;
  taxRate: number;
}

export function calcIndividual(inp: IndividualInputs): QuoteResult {
  const items: LineItem[] = inp.items
    .filter((it) => it.rateKey && it.qty > 0)
    .map((it) => {
      const entry = CATALOG_BY_KEY[it.rateKey];
      const rate = (RATES as Record<string, number>)[it.rateKey] ?? 0;
      return li(entry?.label ?? it.rateKey, it.qty, it.length, rate, entry?.unit ?? "", it.color);
    });

  const materialCost = items.reduce((s, i) => s + i.amount, 0);
  const pricing = finalizePricing(materialCost, {
    taxRate: inp.taxRate, discount: inp.discount,
    footings: inp.footings, roofMounts: inp.roofMounts, misc: inp.misc, markup: inp.markup,
  });

  return {
    lineItems: items.filter((i) => i.amount !== 0),
    ...pricing,
    costPerSqFt: 0,
    pricePerSqFt: 0,
    totalSqFt: 0,
  };
}
