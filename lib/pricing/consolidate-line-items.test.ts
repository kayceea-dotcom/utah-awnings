import { describe, it, expect } from "vitest";
import { consolidateLineItems, li } from "./shared";

describe("consolidateLineItems - combines rows for the same physical material", () => {
  it("merges a front + rear beam of the same spec/length/color into one qty-2 row", () => {
    const items = [
      li("Beam #1 (3x8, Beveled, Both Ends Cut)", 1, 20, 8.47, "", "White"),
      li("Beam Rear (3x8, Beveled, Both Ends Cut)", 1, 20, 8.47, "", "White"),
    ];
    const out = consolidateLineItems(items);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Beam (3x8, Beveled, Both Ends Cut)");
    expect(out[0].qty).toBe(2);
    expect(out[0].amount).toBeCloseTo(2 * 20 * 8.47, 2);
  });

  it("merges Steel Insert #1 / Steel Insert Rear (no parenthesized spec at all)", () => {
    const items = [
      li("Steel Insert #1", 1, 20, 15.26),
      li("Steel Insert Rear", 1, 20, 15.26),
    ];
    const out = consolidateLineItems(items);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Steel Insert");
    expect(out[0].qty).toBe(2);
  });

  it("does not merge items whose length differs (different real-world cut)", () => {
    const items = [
      li("Beam #1 (3x8)", 1, 19.5, 8.47),
      li("Beam Rear (3x8)", 1, 20, 8.47),
    ];
    const out = consolidateLineItems(items);
    expect(out).toHaveLength(2);
  });

  it("does not merge items whose rate differs (different real-world product)", () => {
    const items = [
      li("Steel Insert #1", 1, 20, 15.26),
      li("Steel Insert Rear", 1, 20, 16.10),
    ];
    const out = consolidateLineItems(items);
    expect(out).toHaveLength(2);
  });

  it("does not merge items whose color differs", () => {
    const items = [
      li("Outside Brackets (2x6)", 12, 0, 2.36, "", "White"),
      li("Outside Brackets Rear (2x6)", 12, 0, 2.36, "", "Siennawood"),
    ];
    const out = consolidateLineItems(items);
    expect(out).toHaveLength(2);
  });

  it("leaves an unmatched row's name untouched (no merge happened)", () => {
    const items = [li("Beam #3 (3x8)", 1, 19.5, 8.47)];
    const out = consolidateLineItems(items);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("Beam #3 (3x8)");
  });

  it("does not touch fastener names that happen to start with '#' (e.g. screw gauges)", () => {
    const items = [
      li("#8x1/2 Pan Color", 200, 0, 0.18, "", "White"),
      li("#14x1 Colored Screws", 40, 0, 0.28, "", "White"),
    ];
    const out = consolidateLineItems(items);
    expect(out.map((i) => i.name)).toEqual(["#8x1/2 Pan Color", "#14x1 Colored Screws"]);
  });

  it("merges 3+ identical rows (e.g. two additional beams matching the primary beam's spec)", () => {
    const items = [
      li("Beam #1 (3x8)", 1, 20, 8.47),
      li("Beam #2 (3x8)", 1, 20, 8.47),
      li("Beam #3 (3x8)", 1, 20, 8.47),
    ];
    const out = consolidateLineItems(items);
    expect(out).toHaveLength(1);
    expect(out[0].qty).toBe(3);
  });

  it("respects displayLength over length when grouping (area-priced items)", () => {
    const items = [
      li("Panel A", 1, 48, 2.5, "", "White", 12),
      li("Panel A", 1, 48, 2.5, "", "White", 16),
    ];
    const out = consolidateLineItems(items);
    expect(out).toHaveLength(2);
  });
});
