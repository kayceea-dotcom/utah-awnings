// Config data for the commission engine. An admin should be able to tune
// these bands without touching lib/commission/engine.ts.

export interface MarkupCommissionBand {
  /** Inclusive lower bound of markup (price / materialCost) this band
   *  applies to. Bands are matched by taking the highest band whose `min`
   *  the markup meets or exceeds, so each band implicitly ends where the
   *  next one's `min` begins. */
  min: number;
  rate: number;
}

// Straight from the rate card: commission is a direct function of markup
// (price / materialCost) - no floor/ratio concept, just this lookup.
export const MARKUP_COMMISSION_SCHEDULE: MarkupCommissionBand[] = [
  { min: 0,    rate: 0.04 }, // 0 - 1.4x
  { min: 1.41, rate: 0.08 }, // 1.41 - 1.79x
  { min: 1.8,  rate: 0.14 }, // 1.8 - 1.89x
  { min: 1.9,  rate: 0.16 }, // 1.9 - 1.99x
  { min: 2.0,  rate: 0.19 }, // 2.0 - 2.09x
  { min: 2.1,  rate: 0.20 }, // 2.1x and above
];

// Default markup a quote starts at once material cost is known.
export const DEFAULT_MARKUP = 2.0;

// Reference-only break-even formula: breakEven = BASE + MATERIAL_MULTIPLIER * materialCost.
// Purely informational (e.g. shown alongside the commission panel) - never
// enforced and unrelated to the markup/commission bands above.
export const BREAK_EVEN_BASE = 2329;
export const BREAK_EVEN_MATERIAL_MULTIPLIER = 1.40;
