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

describe("discount commission exemption - first $600 doesn't count against the tier", () => {
  // material $10,000, sticker price at 2.0x = $20,000 (19%) throughout.

  it("a discount under $600 doesn't drop the tier", () => {
    const r = computeCommission(10000, 19600, { discount: 400 }); // $400 off $20,000
    expect(r.commissionRate).toBeCloseTo(0.19);
    expect(r.discountForgiven).toBe(400);
    expect(r.discountCounted).toBe(0);
    expect(r.grossProfit).toBe(9600);
    expect(r.commissionDollars).toBeCloseTo(1824, 2);
  });

  it("exactly $600 off is still fully exempt (not \"more than\" $600)", () => {
    const r = computeCommission(10000, 19400, { discount: 600 });
    expect(r.commissionRate).toBeCloseTo(0.19);
    expect(r.discountForgiven).toBe(600);
    expect(r.discountCounted).toBe(0);
  });

  it("only the amount over $600 counts against the tier", () => {
    // $800 off - $600 exempt, $200 counts -> effective markup (19200+600)/10000 = 1.98 -> 16% band.
    const r = computeCommission(10000, 19200, { discount: 800 });
    expect(r.commissionRate).toBeCloseTo(0.16);
    expect(r.discountForgiven).toBe(600);
    expect(r.discountCounted).toBe(200);
    expect(r.grossProfit).toBe(9200);
    expect(r.commissionDollars).toBeCloseTo(1472, 2);
  });

  it("discountFullyExempt uncaps the exemption entirely (e.g. a CC-fee waiver on a big job)", () => {
    // $1,500 off would normally leave $900 counting against the tier - but a
    // fully exempt discount should never affect the rate, any amount.
    const r = computeCommission(10000, 18500, { discount: 1500, discountFullyExempt: true });
    expect(r.commissionRate).toBeCloseTo(0.19);
    expect(r.discountForgiven).toBe(1500);
    expect(r.discountCounted).toBe(0);
    expect(r.grossProfit).toBe(8500);
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

  it("accounts for an exempted discount already in play", () => {
    // At $19,600 (2.0x sticker minus a fully-exempt $400) - reaching the
    // next tier (2.1x = $21,000) only needs to close the remaining $1,400
    // gap, not the full $1,000 above the real price.
    const prompt = nextTierPrompt(10000, 19600, { discount: 400 });
    expect(prompt).not.toBeNull();
    expect(prompt!.nextRate).toBeCloseTo(0.20);
    expect(prompt!.targetPrice).toBe(20600);
  });
});
