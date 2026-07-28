import { RATES } from "./rates";
import { li } from "./shared";
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
  items: IndividualLineInput[];
  priceIncrease: number;
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

  // ── PRICING SUMMARY ──
  const materialCost        = items.reduce((s, i) => s + i.amount, 0);
  const taxes               = materialCost * inp.taxRate;
  const priceIncreaseDollar = (materialCost + taxes) * inp.priceIncrease;
  const totalMaterials      = materialCost + taxes + priceIncreaseDollar;
  const subtotal            = totalMaterials + inp.footings + inp.roofMounts + inp.misc;
  const preSaleTotal        = subtotal * inp.markup;
  const ccFee               = preSaleTotal * RATES.CC_FEE_RATE / (1 - RATES.CC_FEE_RATE);
  const totalJobSale        = preSaleTotal + ccFee;
  const totalProfit         = totalJobSale - subtotal;

  return {
    lineItems: items.filter((i) => i.amount !== 0),
    materialCost, taxes,
    priceIncrease: priceIncreaseDollar,
    totalMaterials,
    footings:   inp.footings,
    roofMounts: inp.roofMounts,
    misc:       inp.misc,
    subtotal, markup: inp.markup, ccFee,
    totalJobSale, totalProfit,
    costPerSqFt: 0,
    pricePerSqFt: 0,
    totalSqFt: 0,
  };
}
