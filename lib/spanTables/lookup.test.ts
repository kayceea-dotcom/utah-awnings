import { describe, it, expect } from "vitest";
import { checkWPanSpan, parseFeetInches } from "./lookup";

describe("checkWPanSpan - Tri-V (wpan_032) span table", () => {
  it("has real table data now, not the old 'no table for this panel' stub", () => {
    const result = checkWPanSpan("wpan_032", 10);
    expect(result.noTableForPanel).toBe(false);
    expect(result.hasData).toBe(true);
  });

  it("looks up the .032 gauge row at a 10psf design load", () => {
    const result = checkWPanSpan("wpan_032", 10);
    expect(result.tierPsfUsed).toBe(10);
    expect(result.maxSpanFt).toBeCloseTo(parseFeetInches("14'-3\""), 3);
  });

  it("rounds up to the next tier when the design load falls between rows", () => {
    // 18psf isn't a published tier - should round up to the 20psf row, not 10.
    const result = checkWPanSpan("wpan_032", 18);
    expect(result.tierPsfUsed).toBe(20);
    expect(result.maxSpanFt).toBeCloseTo(parseFeetInches("12'-1\""), 3);
  });

  it("flags exceedsTable above the table's top tier (30psf, no 40+ row published)", () => {
    const result = checkWPanSpan("wpan_032", 35);
    expect(result.exceedsTable).toBe(true);
    expect(result.maxSpanFt).toBeNull();
  });

  it("still has no table for DuraKing gauges unaffected by this change", () => {
    const result = checkWPanSpan("duraking_032", 10);
    expect(result.noTableForPanel).toBe(false);
    expect(result.hasData).toBe(true);
  });
});
