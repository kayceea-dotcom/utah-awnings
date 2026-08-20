import {
  FLOOR_SCHEDULE,
  COMMISSION_SCHEDULE,
  BREAK_EVEN_BASE,
  BREAK_EVEN_MATERIAL_MULTIPLIER,
  type FloorBand,
  type CommissionBand,
} from "./schedule";

export interface CommissionResult {
  materialCost: number;
  price: number;
  floorPrice: number;
  /** price / materialCost (0 when materialCost is 0). */
  markup: number;
  /** price / floorPrice. */
  ratioVsFloor: number;
  /** (ratioVsFloor - 1) * 100 - e.g. 10 means 10% above floor. */
  percentVsFloor: number;
  belowFloor: boolean;
  commissionRate: number;
  /** price - materialCost. Can be negative; never clamped, so a rep sees
   *  the real number if they've quoted under cost. */
  grossProfit: number;
  /** commissionRate * grossProfit, floored at 0 - a below-cost quote never
   *  produces a negative commission. */
  commissionDollars: number;
  /** Reference-only informational number - see schedule.ts. Not a floor. */
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

function commissionRateForRatio(
  ratio: number,
  schedule: CommissionBand[] = COMMISSION_SCHEDULE
): number {
  let band = schedule[0];
  for (const b of schedule) {
    if (ratio >= b.minRatio) band = b;
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
  const belowFloor = ratioVsFloor < 1;

  // Use the unrounded ratio to pick the tier so a value like 1.0499996
  // (which should round-display as "1.05") doesn't get bumped into the
  // next commission band just because of display rounding.
  const commissionRate = commissionRateForRatio(ratioVsFloor, commissionSchedule);
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

  const targetPrice = round2(nextBand.minRatio * current.floorPrice);
  const targetCommission = computeCommission(material, targetPrice, config);

  return {
    nextRate: nextBand.rate,
    targetPrice,
    extraDollars: round2(targetCommission.commissionDollars - current.commissionDollars),
  };
}
