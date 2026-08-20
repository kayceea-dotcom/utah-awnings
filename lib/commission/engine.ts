import {
  FLOOR_SCHEDULE,
  COMMISSION_SCHEDULE,
  BREAK_EVEN_BASE,
  BREAK_EVEN_MATERIAL_MULTIPLIER,
  DISCOUNT_COMMISSION_EXEMPTION,
  type FloorBand,
  type CommissionBand,
} from "./schedule";

export interface CommissionResult {
  materialCost: number;
  price: number;
  floorPrice: number;
  /** price / materialCost (0 when materialCost is 0). */
  markup: number;
  /** price / floorPrice - the real, un-adjusted ratio. Informational; the
   *  commission rate/floor warning are driven by the discount-adjusted
   *  ratio below, not this one, once a discount is involved. */
  ratioVsFloor: number;
  /** (ratioVsFloor - 1) * 100 - e.g. 10 means 10% above floor. */
  percentVsFloor: number;
  /** Whether the DISCOUNT-ADJUSTED ratio is below floor - this drives the
   *  warning/rate, so a real discount within the exempt amount won't trip
   *  it even though `ratioVsFloor` itself may show a small negative %. */
  belowFloor: boolean;
  /** Looked up from the discount-adjusted ratio. */
  commissionRate: number;
  /** price - materialCost. Real money; can be negative, never clamped. */
  grossProfit: number;
  /** commissionRate * grossProfit, floored at 0 - a below-cost quote never
   *  produces a negative commission. Uses the real grossProfit above - the
   *  discount exemption only affects which rate tier applies, never the
   *  actual dollars the math is based on. */
  commissionDollars: number;
  /** Reference-only informational number - see schedule.ts. Not a floor. */
  breakEven: number;
  /** The discount fed in via config.discount (0 if none). */
  discount: number;
  /** Portion of `discount` exempted from counting against the commission
   *  tier (up to DISCOUNT_COMMISSION_EXEMPTION). */
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

/** Used for ratios/multiples (markup, ratioVsFloor), which are display
 *  numbers rather than currency - 3 decimals matches how they read
 *  naturally (e.g. "1.833x"). */
function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/** Treats missing/blank/negative material cost as 0 rather than throwing. */
function normalizeMaterialCost(materialCost: number | null | undefined): number {
  const n = Number(materialCost);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function computeFloorPrice(
  materialCost: number | null | undefined,
  schedule: FloorBand[] = FLOOR_SCHEDULE
): number {
  const material = normalizeMaterialCost(materialCost);
  // Bands are matched by the highest `min` the material cost meets or
  // exceeds - iterate from the top since bands are stored ascending.
  let band = schedule[0];
  for (const b of schedule) {
    if (material >= b.min) band = b;
  }
  const floor = band.type === "flat" ? band.value : material * band.value;
  return round2(floor);
}

// Absorbs floating-point noise from the UI's tax/CC-fee/markup pipeline
// (which doesn't perfectly bit-for-bit invert against markupForTargetPrice)
// so a price that's a fraction of a cent off a tier boundary - purely from
// float arithmetic, not a real pricing difference - doesn't get classified
// into the wrong band. Real prices are never this close to a boundary by
// accident; a genuinely below-floor quote is off by dollars, not by 1e-6.
const RATIO_EPS = 1e-6;

function commissionRateForRatio(
  ratio: number,
  schedule: CommissionBand[] = COMMISSION_SCHEDULE
): number {
  let band = schedule[0];
  for (const b of schedule) {
    if (ratio >= b.minRatio - RATIO_EPS) band = b;
  }
  return band.rate;
}

export function computeBreakEven(materialCost: number | null | undefined): number {
  const material = normalizeMaterialCost(materialCost);
  return round2(BREAK_EVEN_BASE + BREAK_EVEN_MATERIAL_MULTIPLIER * material);
}

export interface CommissionScheduleConfig {
  floorSchedule?: FloorBand[];
  commissionSchedule?: CommissionBand[];
  /** The discount applied to reach `price` - up to `discountExemption` of
   *  it is excluded when determining the commission tier (see
   *  DISCOUNT_COMMISSION_EXEMPTION in schedule.ts). Omit/0 for no discount. */
  discount?: number;
  discountExemption?: number;
}

export function computeCommission(
  materialCost: number | null | undefined,
  price: number | null | undefined,
  config: CommissionScheduleConfig = {}
): CommissionResult {
  const material = normalizeMaterialCost(materialCost);
  const floorSchedule = config.floorSchedule ?? FLOOR_SCHEDULE;
  const commissionSchedule = config.commissionSchedule ?? COMMISSION_SCHEDULE;

  const floorPrice = computeFloorPrice(material, floorSchedule);
  const p = Number.isFinite(Number(price)) ? Number(price) : floorPrice;

  const markup = material > 0 ? round3(p / material) : 0;
  const ratioVsFloor = floorPrice > 0 ? p / floorPrice : 0;
  const percentVsFloor = (ratioVsFloor - 1) * 100;

  const discount = Math.max(0, Number(config.discount) || 0);
  const exemption = config.discountExemption ?? DISCOUNT_COMMISSION_EXEMPTION;
  const discountForgiven = Math.min(discount, exemption);
  const discountCounted = discount - discountForgiven;
  // The rate/warning are driven by what the price would be if the exempt
  // portion of the discount hadn't been taken off - so a discount within
  // the exemption never trips the below-floor warning or a lower tier.
  const commissionBasisRatio = floorPrice > 0 ? (p + discountForgiven) / floorPrice : 0;
  const belowFloor = commissionBasisRatio < 1 - RATIO_EPS;

  // Use the unrounded ratio to pick the tier so a value like 1.0499996
  // (which should round-display as "1.05") doesn't get bumped into the
  // next commission band just because of display rounding.
  const commissionRate = commissionRateForRatio(commissionBasisRatio, commissionSchedule);
  const grossProfit = round2(p - material);
  const commissionDollars = Math.max(0, round2(commissionRate * grossProfit));

  return {
    materialCost: material,
    price: p,
    floorPrice,
    markup,
    ratioVsFloor: round3(ratioVsFloor),
    percentVsFloor,
    belowFloor,
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
 * worth vs. the current price. Returns null when already at the top tier.
 */
export function nextTierPrompt(
  materialCost: number | null | undefined,
  price: number | null | undefined,
  config: CommissionScheduleConfig = {}
): NextTierPrompt | null {
  const material = normalizeMaterialCost(materialCost);
  const commissionSchedule = config.commissionSchedule ?? COMMISSION_SCHEDULE;
  const current = computeCommission(material, price, config);

  const sorted = [...commissionSchedule].sort((a, b) => a.minRatio - b.minRatio);
  const currentIndex = sorted.findIndex((b) => b.rate === current.commissionRate);
  const nextBand = currentIndex >= 0 ? sorted[currentIndex + 1] : undefined;
  if (!nextBand || current.floorPrice <= 0) return null;

  // The real price needed only has to cover the gap after accounting for
  // whatever discount is already being forgiven - so a rep with an
  // exempted discount doesn't get told to raise price further than they
  // actually need to.
  const targetPrice = round2(nextBand.minRatio * current.floorPrice - current.discountForgiven);
  const targetCommission = computeCommission(material, targetPrice, config);

  return {
    nextRate: nextBand.rate,
    targetPrice,
    extraDollars: round2(targetCommission.commissionDollars - current.commissionDollars),
  };
}
