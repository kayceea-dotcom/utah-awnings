import {
  MARKUP_COMMISSION_SCHEDULE,
  DEFAULT_MARKUP,
  BREAK_EVEN_BASE,
  BREAK_EVEN_MATERIAL_MULTIPLIER,
  DISCOUNT_COMMISSION_EXEMPTION,
  type MarkupCommissionBand,
} from "./schedule";

export interface CommissionResult {
  materialCost: number;
  price: number;
  /** price / materialCost (0 when materialCost is 0). The real, un-adjusted
   *  markup - informational; the commission rate is driven by the
   *  discount-adjusted markup, not necessarily this exact number, once a
   *  discount is involved. */
  markup: number;
  /** Looked up from the discount-adjusted markup against
   *  MARKUP_COMMISSION_SCHEDULE - a direct function of markup, no floor
   *  or ratio concept involved. */
  commissionRate: number;
  /** price - materialCost. Real money; can be negative, never clamped. */
  grossProfit: number;
  /** commissionRate * grossProfit, floored at 0 - a below-cost quote never
   *  produces a negative commission. Uses the real grossProfit above - the
   *  discount exemption only affects which rate tier applies, never the
   *  actual dollars the math is based on. */
  commissionDollars: number;
  /** Reference-only informational number - see schedule.ts. Not enforced. */
  breakEven: number;
  /** The discount fed in via config.discount (0 if none). */
  discount: number;
  /** Portion of `discount` exempted from counting against the commission
   *  tier (up to DISCOUNT_COMMISSION_EXEMPTION, or all of it when
   *  config.discountFullyExempt is set). */
  discountForgiven: number;
  /** Portion of `discount` beyond the exemption - this part DOES count
   *  against the commission tier, same as any other price cut. */
  discountCounted: number;
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

// Absorbs floating-point noise from the UI's tax/CC-fee/markup pipeline
// (which doesn't perfectly bit-for-bit invert against markupForTargetPrice)
// so a markup that's a fraction of a cent off a tier boundary - purely from
// float arithmetic, not a real pricing difference - doesn't get classified
// into the wrong band.
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
  /** The discount applied to reach `price` - up to `discountExemption` of
   *  it is excluded when determining the commission tier (see
   *  DISCOUNT_COMMISSION_EXEMPTION in schedule.ts). Omit/0 for no discount. */
  discount?: number;
  discountExemption?: number;
  /** When true, ALL of `discount` is excluded from the commission tier -
   *  no $600 cap. For a discount that isn't a real price concession (e.g.
   *  waiving the credit-card fee for a check/cash payment) - the rep
   *  shouldn't be penalized just because the customer didn't pay by card,
   *  no matter how large that fee is on a bigger job. */
  discountFullyExempt?: boolean;
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

  const discount = Math.max(0, Number(config.discount) || 0);
  const exemption = config.discountExemption ?? DISCOUNT_COMMISSION_EXEMPTION;
  const discountForgiven = config.discountFullyExempt ? discount : Math.min(discount, exemption);
  const discountCounted = discount - discountForgiven;

  // The rate is driven by what the markup would be if the exempt portion of
  // the discount hadn't been taken off - so a discount within the exemption
  // never drops the rep into a lower tier.
  const commissionBasisMarkup = material > 0 ? (p + discountForgiven) / material : 0;
  const commissionRate = commissionRateForMarkup(commissionBasisMarkup, commissionSchedule);

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
    discount,
    discountForgiven,
    discountCounted,
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

  // The real price needed only has to cover the gap after accounting for
  // whatever discount is already being forgiven - so a rep with an
  // exempted discount doesn't get told to raise price further than they
  // actually need to.
  const targetPrice = round2(nextBand.min * material - current.discountForgiven);
  const targetCommission = computeCommission(material, targetPrice, config);

  return {
    nextRate: nextBand.rate,
    targetPrice,
    extraDollars: round2(targetCommission.commissionDollars - current.commissionDollars),
  };
}
