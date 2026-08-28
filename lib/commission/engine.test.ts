import { describe, it, expect } from "vitest";
import { computeCommission, computeBreakEven, nextTierPrompt } from "./engine";

// Rate card: markup -> commission rate.
//   0 - 1.4x    -> 4%
//   1.41 - 1.79x -> 8%
//   1.8 - 1.89x  -> 14%
//   1.9 - 1.99x  -> 16%
//   2.0 - 2.09x  -> 19%
//   2.1x+        -> 20%
// material = $10,000 throughout unless noted, for clean round prices.

describe("computeCommission - markup rate card", () => {
  it.each([
    [1.4,  4],
    [1.41, 8],
    [1.79, 8],
    [1.8,  14],
    [1.89, 14],
    [1.9,  16],
    [1.99, 16],
    [2.0,  19],
    [2.09, 19],
    [2.1,  20],
    [3.0,  20], // well past the top tier - stays at 20%, no band beyond it
  ])("markup %sx -> %s%% commission rate", (markup, expectedPct) => {
    const price = 10000 * markup;
    const r = computeCommission(10000, price);
    expect(r.markup).toBeCloseTo(markup, 3);
    expect(r.commissionRate).toBeCloseTo(expectedPct / 100);
  });

  it("computes real gross profit and commission dollars at the default 2.0x markup", () => {
    const r = computeCommission(10000, 20000);
    expect(r.grossProfit).toBe(10000);
    expect(r.commissionRate).toBeCloseTo(0.19);
    expect(r.commissionDollars).toBe(1900);
  });

  it("computes correctly at 2.1x (top tier)", () => {
    const r = computeCommission(10000, 21000);
    expect(r.grossProfit).toBe(11000);
    expect(r.commissionRate).toBeCloseTo(0.20);
    expect(r.commissionDollars).toBe(2200);
  });

  it("a real job: material $33,183, price $49,739", () => {
    const r = computeCommission(33183, 49739);
    expect(r.markup).toBeCloseTo(1.499, 3);
    expect(r.commissionRate).toBeCloseTo(0.08); // 1.41-1.79x band
    expect(r.grossProfit).toBe(16556);
    expect(r.commissionDollars).toBeCloseTo(1324.48, 2);
  });
});

describe("edge cases", () => {
  it("defaults price to the 2.0x default markup when omitted", () => {
    const r = computeCommission(10000, undefined);
    expect(r.price).toBe(20000);
    expect(r.commissionRate).toBeCloseTo(0.19);
  });

  it("treats $0/blank/negative material cost as $0, not a crash", () => {
    for (const bad of [0, null, undefined, NaN, -500]) {
      const r = computeCommission(bad, 5000);
      expect(r.materialCost).toBe(0);
      expect(Number.isFinite(r.commissionDollars)).toBe(true);
    }
  });

  it("never produces a negative commission when price is below material cost", () => {
    const r = computeCommission(10000, 6000);
    expect(r.grossProfit).toBeLessThan(0);
    expect(r.commissionRate).toBeCloseTo(0.04); // markup 0.6x - the 0-1.4x band
    expect(r.commissionDollars).toBe(0);
  });

  it("a markup of exactly 0 (price == material cost) is the bottom 4% band, not a crash", () => {
    const r = computeCommission(10000, 10000);
    expect(r.markup).toBe(1);
    expect(r.commissionRate).toBeCloseTo(0.04);
    expect(r.grossProfit).toBe(0);
    expect(r.commissionDollars).toBe(0);
  });
});

describe("computeBreakEven", () => {
  it("is reference-only and independent of the markup schedule", () => {
    expect(computeBreakEven(6000)).toBeCloseTo(2329 + 1.4 * 6000, 2);
  });
});

describe("discounts count fully against commission", () => {
  // material $10,000, sticker price at 2.0x = $20,000 (19%).
  // The CC fee (and waiving it for Check/Cash) never reaches this engine at
  // all - callers pass a price that already excludes it (see
  // lib/pricing/shared.ts commissionBasisPrice) - so there's nothing to
  // exempt here. Any discount reflected in `price` counts for real.

  it("a $400 discount can drop the rate tier - no forgiveness cushion", () => {
    const r = computeCommission(10000, 19600); // $400 off $20,000 -> 1.96x, drops from 19% to 16%
    expect(r.commissionRate).toBeCloseTo(0.16);
    expect(r.grossProfit).toBe(9600);
    expect(r.commissionDollars).toBeCloseTo(1536, 2);
  });

  it("a $600 discount drops the rate tier further", () => {
    const r = computeCommission(10000, 19400); // 1.94x - still in the 16% band
    expect(r.commissionRate).toBeCloseTo(0.16);
    expect(r.grossProfit).toBe(9400);
  });

  it("a large discount drops the rate tier and the dollar amount together", () => {
    // $600 off a $10,000-material, 4000-total example (2.0x, 19% -> 1.7x, 8%).
    const r = computeCommission(2000, 3400);
    expect(r.commissionRate).toBeCloseTo(0.08);
    expect(r.grossProfit).toBe(1400);
    expect(r.commissionDollars).toBeCloseTo(112, 2);
  });
});

describe("big job unlock - material over $10,000 opens a 1.7x/13% band", () => {
  const BIG_MATERIAL = 12000; // > $10,000 threshold
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  it("at or below the $10,000 threshold, 1.7x markup still only pays 8%", () => {
    const atThreshold = computeCommission(10000, 10000 * 1.7);
    expect(atThreshold.commissionRate).toBeCloseTo(0.08);
    const belowThreshold = computeCommission(9000, 9000 * 1.7);
    expect(belowThreshold.commissionRate).toBeCloseTo(0.08);
  });

  it("above the threshold, 1.7x markup unlocks 13%", () => {
    const r = computeCommission(BIG_MATERIAL, BIG_MATERIAL * 1.7);
    expect(r.commissionRate).toBeCloseTo(0.13);
  });

  it("above the threshold, 1.79x still pays 13% (doesn't reach the 1.8x/14% band)", () => {
    const r = computeCommission(BIG_MATERIAL, BIG_MATERIAL * 1.79);
    expect(r.commissionRate).toBeCloseTo(0.13);
  });

  it("above the threshold, below 1.7x still only pays 8% - the unlock doesn't lower the floor", () => {
    const r = computeCommission(BIG_MATERIAL, BIG_MATERIAL * 1.69);
    expect(r.commissionRate).toBeCloseTo(0.08);
  });

  it("above the threshold, 1.8x+ is unaffected by the unlock", () => {
    const r = computeCommission(BIG_MATERIAL, BIG_MATERIAL * 1.8);
    expect(r.commissionRate).toBeCloseTo(0.14);
  });

  it("nextTierPrompt on a big job at 1.5x points to 1.7x/13%, not straight to 1.8x/14%", () => {
    const prompt = nextTierPrompt(BIG_MATERIAL, BIG_MATERIAL * 1.5);
    expect(prompt).not.toBeNull();
    expect(prompt!.nextRate).toBeCloseTo(0.13);
    expect(prompt!.targetPrice).toBe(round2(BIG_MATERIAL * 1.7));
  });
});

describe("markup includes material + tax when config.tax is given", () => {
  // material $10,000, tax $745 (7.45%) -> materialsBase $10,745.

  it("markup divides by material + tax, not material alone", () => {
    const r = computeCommission(10000, 21490, { tax: 745 }); // 21490 / 10745 = 2.0x
    expect(r.markup).toBeCloseTo(2.0, 3);
    expect(r.commissionRate).toBeCloseTo(0.19);
  });

  it("omitting tax (or defaulting to 0) matches the pre-existing material-only behavior", () => {
    const withZeroTax = computeCommission(10000, 20000, { tax: 0 });
    const withoutTaxAtAll = computeCommission(10000, 20000);
    expect(withZeroTax.markup).toBe(withoutTaxAtAll.markup);
    expect(withZeroTax.commissionRate).toBe(withoutTaxAtAll.commissionRate);
  });

  it("gross profit and commission dollars stay based on the real material cost, not material + tax", () => {
    const r = computeCommission(10000, 21490, { tax: 745 });
    expect(r.grossProfit).toBe(11490); // 21490 - 10000 (real material cost), not minus 10745
    expect(r.commissionDollars).toBeCloseTo(0.19 * 11490, 2);
  });

  it("the $10,000 big-job threshold is checked against material + tax too", () => {
    // $9,500 material + $600 tax = $10,100 materialsBase - over the threshold
    // even though material cost alone is under it.
    const r = computeCommission(9500, 9500 * 1.7 + 600 * 1.7, { tax: 600 });
    expect(r.commissionRate).toBeCloseTo(0.13);
  });
});

describe("nextTierPrompt", () => {
  it("gives the minimum price to enter the next tier and the commission delta at that exact price", () => {
    // At 2.0x (19%), the next tier (20%) starts at 2.1x = $21,000.
    const prompt = nextTierPrompt(10000, 20000);
    expect(prompt).not.toBeNull();
    expect(prompt!.nextRate).toBeCloseTo(0.20);
    expect(prompt!.targetPrice).toBe(21000);
    // Commission at $21,000 (20% of $11,000) minus at $20,000 (19% of $10,000): 2200 - 1900 = 300.
    expect(prompt!.extraDollars).toBe(300);
  });

  it("returns null once already at the top tier", () => {
    const prompt = nextTierPrompt(10000, 25000); // 2.5x, already 20%
    expect(prompt).toBeNull();
  });

  it("returns null when there's no material cost to base a markup on", () => {
    expect(nextTierPrompt(0, 1000)).toBeNull();
  });

  it("offers a path up from the bottom tier", () => {
    const prompt = nextTierPrompt(10000, 12000); // 1.2x, 4%
    expect(prompt).not.toBeNull();
    expect(prompt!.nextRate).toBeCloseTo(0.08);
    expect(prompt!.targetPrice).toBe(14100); // 1.41x
  });
});
