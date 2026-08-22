import {
  MARKUP_COMMISSION_SCHEDULE,
  DEFAULT_MARKUP,
  BREAK_EVEN_BASE,
  BREAK_EVEN_MATERIAL_MULTIPLIER,
  type MarkupCommissionBand,
} from "./schedule";

export interface CommissionResult {
  materialCost: number;
  price: number;
  /** price / materialCost (0 when materialCost is 0). Drives the rate
   *  lookup directly - no floor, no discount exemption. */
  markup: number;
  /** Looked up from markup against MARKUP_COMMISSION_SCHEDULE. */
  commissionRate: number;
  /** price - materialCost. Real money; can be negative, never clamped. */
  grossProfit: number;
  /** commissionRate * grossProfit, floored at 0 - a below-cost quote never
   *  produces a negative commission. */
  commissionDollars: number;
  /** Reference-only informational number - see schedule.ts. Not enforced. */
  breakEven: number;
}

export interface NextTierPrompt {
  nextRate: number;
  /** Minimum price that reaches nextRate. */
  targetPrice: number;
  /** Additional commission dollars at targetPrice vs. the current price. */
  extraDollars: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Used for markup, a display number rather than currency - 3 decimals
 *  matches how it reads naturally (e.g. "1.833x"). */
function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/** Treats missing/blank/negative material cost as 0 rather than throwing. */
function normalizeMaterialCost(materialCost: number | null | undefined): number {
  const n = Number(materialCost);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Absorbs floating-point noise from the UI's tax/markup pipeline so a price
// that lands a fraction of a cent off a tier boundary - purely from float
// arithmetic, not a real pricing difference - doesn't get classified into
// the wrong band.
const MARKUP_EPS = 1e-6;

function commissionRateForMarkup(
  markup: number,
  schedule: MarkupCommissionBand[] = MARKUP_COMMISSION_SCHEDULE
): number {
  let band = schedule[0];
  for (const b of schedule) {
    if (markup >= b.min - MARKUP_EPS) band = b;
  }
  return band.rate;
}

export function computeBreakEven(materialCost: number | null | undefined): number {
  const material = normalizeMaterialCost(materialCost);
  return round2(BREAK_EVEN_BASE + BREAK_EVEN_MATERIAL_MULTIPLIER * material);
}

export interface CommissionScheduleConfig {
  commissionSchedule?: MarkupCommissionBand[];
}

export function computeCommission(
  materialCost: number | null | undefined,
  price: number | null | undefined,
  config: CommissionScheduleConfig = {}
): CommissionResult {
  const material = normalizeMaterialCost(materialCost);
  const commissionSchedule = config.commissionSchedule ?? MARKUP_COMMISSION_SCHEDULE;
  const p = Number.isFinite(Number(price)) ? Number(price) : material * DEFAULT_MARKUP;

  const markup = material > 0 ? round3(p / material) : 0;
  const commissionRate = commissionRateForMarkup(markup, commissionSchedule);

  const grossProfit = round2(p - material);
  const commissionDollars = Math.max(0, round2(commissionRate * grossProfit));

  return {
    materialCost: material,
    price: p,
    markup,
    commissionRate,
    grossProfit,
    commissionDollars,
    breakEven: computeBreakEven(material),
  };
}

/**
 * The exact price needed to reach the next commission tier, and what that's
 * worth vs. the current price. Returns null when already at the top tier
 * or there's no material cost to base a markup on.
 */
export function nextTierPrompt(
  materialCost: number | null | undefined,
  price: number | null | undefined,
  config: CommissionScheduleConfig = {}
): NextTierPrompt | null {
  const material = normalizeMaterialCost(materialCost);
  if (material <= 0) return null;
  const commissionSchedule = config.commissionSchedule ?? MARKUP_COMMISSION_SCHEDULE;
  const current = computeCommission(material, price, config);

  const sorted = [...commissionSchedule].sort((a, b) => a.min - b.min);
  const currentIndex = sorted.findIndex((b) => b.rate === current.commissionRate);
  const nextBand = currentIndex >= 0 ? sorted[currentIndex + 1] : undefined;
  if (!nextBand) return null;

  const targetPrice = round2(nextBand.min * material);
  const targetCommission = computeCommission(material, targetPrice, config);

  return {
    nextRate: nextBand.rate,
    targetPrice,
    extraDollars: round2(targetCommission.commissionDollars - current.commissionDollars),
  };
}
