import { describe, it, expect } from "vitest";
import { computeFloorPrice, computeCommission, computeBreakEven, nextTierPrompt } from "./engine";

describe("computeCommission - spec test cases", () => {
  it("$500 material, default price", () => {
    const floor = computeFloorPrice(500);
    const r = computeCommission(500, floor);
    expect(floor).toBe(2300);
    expect(r.markup).toBeCloseTo(4.6, 3);
    expect(r.ratioVsFloor).toBeCloseTo(1.0, 3);
    expect(r.commissionRate).toBeCloseTo(0.14);
    expect(r.grossProfit).toBe(1800);
    expect(r.commissionDollars).toBe(252.0);
  });

  it("$1,500 material, default price", () => {
    const floor = computeFloorPrice(1500);
    const r = computeCommission(1500, floor);
    expect(floor).toBe(3450);
    expect(r.markup).toBeCloseTo(2.3, 3);
    expect(r.ratioVsFloor).toBeCloseTo(1.0, 3);
    expect(r.commissionRate).toBeCloseTo(0.14);
    expect(r.grossProfit).toBe(1950);
    expect(r.commissionDollars).toBe(273.0);
  });

  it("$2,750 material, default price", () => {
    const floor = computeFloorPrice(2750);
    const r = computeCommission(2750, floor);
    expect(floor).toBe(6050);
    expect(r.markup).toBeCloseTo(2.2, 3);
    expect(r.ratioVsFloor).toBeCloseTo(1.0, 3);
    expect(r.commissionRate).toBeCloseTo(0.14);
    expect(r.grossProfit).toBe(3300);
    expect(r.commissionDollars).toBe(462.0);
  });

  it("$6,000 material, default price", () => {
    const floor = computeFloorPrice(6000);
    const r = computeCommission(6000, floor);
    expect(floor).toBe(12000);
    expect(r.markup).toBeCloseTo(2.0, 3);
    expect(r.ratioVsFloor).toBeCloseTo(1.0, 3);
    expect(r.commissionRate).toBeCloseTo(0.14);
    expect(r.grossProfit).toBe(6000);
    expect(r.commissionDollars).toBe(840.0);
  });

  it("$10,000 material, default price", () => {
    const floor = computeFloorPrice(10000);
    const r = computeCommission(10000, floor);
    expect(floor).toBe(19000);
    expect(r.markup).toBeCloseTo(1.9, 3);
    expect(r.ratioVsFloor).toBeCloseTo(1.0, 3);
    expect(r.commissionRate).toBeCloseTo(0.14);
    expect(r.grossProfit).toBe(9000);
    expect(r.commissionDollars).toBe(1260.0);
  });

  it("$33,183 material, default price", () => {
    const floor = computeFloorPrice(33183);
    const r = computeCommission(33183, floor);
    expect(floor).toBeCloseTo(56411.1, 2);
    expect(r.markup).toBeCloseTo(1.7, 3);
    expect(r.ratioVsFloor).toBeCloseTo(1.0, 3);
    expect(r.commissionRate).toBeCloseTo(0.14);
    expect(r.grossProfit).toBeCloseTo(23228.1, 2);
    expect(r.commissionDollars).toBe(3251.93);
  });

  it("$6,000 material, $13,200 price (5%+ above floor tier)", () => {
    const r = computeCommission(6000, 13200);
    expect(r.floorPrice).toBe(12000);
    expect(r.markup).toBeCloseTo(2.2, 3);
    expect(r.ratioVsFloor).toBeCloseTo(1.1, 3);
    expect(r.commissionRate).toBeCloseTo(0.17);
    expect(r.grossProfit).toBe(7200);
    expect(r.commissionDollars).toBe(1224.0);
  });

  it("$6,000 material, $11,000 price (below floor)", () => {
    const r = computeCommission(6000, 11000);
    expect(r.floorPrice).toBe(12000);
    expect(r.markup).toBeCloseTo(1.833, 3);
    expect(r.ratioVsFloor).toBeCloseTo(0.917, 3);
    expect(r.belowFloor).toBe(true);
    expect(r.commissionRate).toBeCloseTo(0.04);
    expect(r.grossProfit).toBe(5000);
    expect(r.commissionDollars).toBe(200.0);
  });

  it("$33,183 material, $49,739 price - the real job this was built for", () => {
    const r = computeCommission(33183, 49739);
    expect(r.floorPrice).toBeCloseTo(56411.1, 2);
    expect(r.markup).toBeCloseTo(1.499, 3);
    expect(r.ratioVsFloor).toBeCloseTo(0.882, 3);
    expect(r.belowFloor).toBe(true);
    expect(r.commissionRate).toBeCloseTo(0.04);
    expect(r.grossProfit).toBe(16556);
    expect(r.commissionDollars).toBe(662.24);
    // Old scheme paid $1,647 on this job - this is the incentive redesign
    // working as intended, not a bug.
    expect(r.commissionDollars).toBeLessThan(1647);
  });
});

describe("floor band edges - lower bounds are inclusive", () => {
  it.each([
    [1000, 2300],
    [2000, 4400],
    [3500, 7350],
    [5000, 10000],
    [8000, 15200],
    [12000, 21600],
    [25000, 42500],
  ])("material %d -> floor %d", (material, expectedFloor) => {
    expect(computeFloorPrice(material)).toBeCloseTo(expectedFloor, 2);
  });

  it("is continuous across the flat/multiplier boundary at $1,000", () => {
    // Just under $1,000 uses the flat $2,300 floor; at exactly $1,000 the
    // 2.30x multiplier band kicks in - they should agree at the boundary.
    expect(computeFloorPrice(999.99)).toBeCloseTo(2300, 0);
    expect(computeFloorPrice(1000)).toBe(2300);
  });
});

describe("edge cases", () => {
  it("treats $0 material cost as $0, not a crash", () => {
    const r = computeCommission(0, undefined);
    expect(r.floorPrice).toBe(2300);
    expect(Number.isFinite(r.commissionDollars)).toBe(true);
  });

  it("treats blank/null/undefined material cost as $0", () => {
    for (const bad of [null, undefined, NaN, "" as unknown as number]) {
      const r = computeCommission(bad, undefined);
      expect(r.materialCost).toBe(0);
      expect(r.floorPrice).toBe(2300);
    }
  });

  it("never produces a negative commission when price is below material cost", () => {
    const r = computeCommission(6000, 3000);
    expect(r.grossProfit).toBeLessThan(0);
    expect(r.commissionDollars).toBe(0);
  });

  it("a sub-$1,000 material job quoted above $2,300 still ratios off the $2,300 floor", () => {
    const r = computeCommission(700, 3000);
    expect(r.floorPrice).toBe(2300);
    expect(r.ratioVsFloor).toBeCloseTo(3000 / 2300, 3);
    expect(r.commissionRate).toBeCloseTo(0.2); // 3000/2300 = 1.304, well past the 1.15 top tier
  });

  it("treats a price a hair under floor from float noise as AT floor, not below it", () => {
    // The quote-builder UI derives price from a markup multiplier via a
    // separate tax/CC-fee/discount pipeline (lib/pricing/shared.ts) that
    // doesn't invert bit-for-bit against the floor math here - a price
    // meant to land exactly on the floor can come out a fraction of a
    // cent under it. That's float noise, not a real below-floor quote.
    const floor = computeFloorPrice(9372.38);
    const r = computeCommission(9372.38, floor - 0.0000001);
    expect(r.belowFloor).toBe(false);
    expect(r.commissionRate).toBeCloseTo(0.14);
  });

  it("negative material cost is treated as $0", () => {
    const r = computeCommission(-500, undefined);
    expect(r.materialCost).toBe(0);
    expect(r.floorPrice).toBe(2300);
  });
});

describe("computeBreakEven", () => {
  it("is reference-only and independent of the floor schedule", () => {
    // breakEven = 2329 + 1.40 * materialCost
    expect(computeBreakEven(6000)).toBeCloseTo(2329 + 1.4 * 6000, 2);
  });

  it("sits above the floor on small jobs (the floor is deliberately below break-even there)", () => {
    const material = 500;
    expect(computeFloorPrice(material)).toBeLessThan(computeBreakEven(material));
  });
});

describe("nextTierPrompt", () => {
  it("gives the minimum price to enter the next tier and the commission delta at that exact price", () => {
    // $6,000 material, quoted at floor ($12,000, 14%) - next tier (17%)
    // starts at ratio 1.05, i.e. $12,600.
    const prompt = nextTierPrompt(6000, 12000);
    expect(prompt).not.toBeNull();
    expect(prompt!.nextRate).toBeCloseTo(0.17);
    expect(prompt!.targetPrice).toBe(12600);
    // Commission at $12,600 (17% of $6,600 profit) minus commission at
    // $12,000 (14% of $6,000 profit): 1122 - 840 = 282.
    expect(prompt!.extraDollars).toBe(282);
  });

  it("returns null once already at the top tier", () => {
    const prompt = nextTierPrompt(6000, 14000); // ratio ~1.167, already 20%
    expect(prompt).toBeNull();
  });

  it("offers a path back up from below floor", () => {
    const prompt = nextTierPrompt(6000, 11000);
    expect(prompt).not.toBeNull();
    expect(prompt!.nextRate).toBeCloseTo(0.14);
    expect(prompt!.targetPrice).toBe(12000); // the floor itself
    expect(prompt!.extraDollars).toBeGreaterThan(0);
  });
});
