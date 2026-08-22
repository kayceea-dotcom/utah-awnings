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
