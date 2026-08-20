// Config data for the floor-price / commission engine. An admin should be
// able to tune these bands without touching lib/commission/engine.ts.

export interface FloorBand {
  /** Inclusive lower bound of material cost this band applies to. */
  min: number;
  /** "flat" bands ignore material cost and use `value` as the floor price
   *  directly; "multiplier" bands multiply material cost by `value`. */
  type: "flat" | "multiplier";
  value: number;
}

// Bands are matched by taking the highest band whose `min` the material
// cost meets or exceeds, so lower bounds are inclusive and each band
// implicitly ends where the next one's `min` begins.
export const FLOOR_SCHEDULE: FloorBand[] = [
  { min: 0, type: "flat", value: 2300 },
  { min: 1000, type: "multiplier", value: 2.30 },
  { min: 2000, type: "multiplier", value: 2.20 },
  { min: 3500, type: "multiplier", value: 2.10 },
  { min: 5000, type: "multiplier", value: 2.00 },
  { min: 8000, type: "multiplier", value: 1.90 },
  { min: 12000, type: "multiplier", value: 1.80 },
  { min: 25000, type: "multiplier", value: 1.70 },
];

export interface CommissionBand {
  /** Inclusive lower bound of price-vs-floor ratio (price / floorPrice). */
  minRatio: number;
  rate: number;
}

// Ratio bands: [minRatio, next band's minRatio) - so "at floor" covers
// 1.00 up to (but not including) 1.05, etc. The last band has no upper
// bound.
export const COMMISSION_SCHEDULE: CommissionBand[] = [
  { minRatio: -Infinity, rate: 0.04 }, // below floor
  { minRatio: 1.00, rate: 0.14 },      // at floor
  { minRatio: 1.05, rate: 0.17 },      // 5%+ above floor
  { minRatio: 1.15, rate: 0.20 },      // 15%+ above floor
];

// Reference-only break-even formula: breakEven = BASE + MATERIAL_MULTIPLIER * materialCost.
// This is NOT a quoting floor (the floor schedule above is deliberately
// below break-even on small jobs) - display only, never enforced.
export const BREAK_EVEN_BASE = 2329;
export const BREAK_EVEN_MATERIAL_MULTIPLIER = 1.40;

// The first $600 of any discount doesn't count against the rep's commission
// tier - only the amount by which a discount exceeds this counts as a real
// price concession for commission purposes. Covers small accommodations
// (e.g. waiving the credit-card fee for a check/cash payment) without
// needing to special-case discount reasons - it's purely about the dollar
// amount.
export const DISCOUNT_COMMISSION_EXEMPTION = 600;
