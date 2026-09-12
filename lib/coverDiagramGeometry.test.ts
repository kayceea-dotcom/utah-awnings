import { describe, it, expect } from "vitest";
import { computeCoverDiagramGeometry } from "./coverDiagramGeometry";

describe("House wall jog: one continuous beam across the full width", () => {
  it("spreads all posts (posts1 + posts2) evenly across the full combined width, not per-run", () => {
    const geo = computeCoverDiagramGeometry({
      projection1: 12, width1: 20, projection2: 10, width2: 15,
      posts1: 2, posts2: 2, jogType: "house",
    })!;
    expect(geo.isHouseJog).toBe(true);
    expect(geo.postPositions).toHaveLength(4);
    expect(geo.postPositions2).toHaveLength(0);
    // Spread across the full width means the last post sits near the far
    // (run 2) edge, not clustered within run 1's own portion.
    expect(Math.max(...geo.postPositions)).toBeGreaterThan(geo.ox + geo.coverW1);
  });

  it("keeps each run's posts fully separate on a ground/deck jog (unchanged behavior)", () => {
    const geo = computeCoverDiagramGeometry({
      projection1: 12, width1: 20, projection2: 10, width2: 15,
      posts1: 2, posts2: 2, jogType: "ground",
    })!;
    expect(geo.isHouseJog).toBe(false);
    expect(geo.postPositions).toHaveLength(2);
    expect(geo.postPositions2).toHaveLength(2);
    // Run 1's posts stay within run 1's own width - none spill into run 2.
    expect(Math.max(...geo.postPositions)).toBeLessThanOrEqual(geo.ox + geo.coverW1);
  });

  it("keeps each run's posts separate on a single run (no 2nd width) regardless of jogType", () => {
    const geo = computeCoverDiagramGeometry({
      projection1: 12, width1: 20, posts1: 3, jogType: "house",
    })!;
    expect(geo.isHouseJog).toBe(false);
    expect(geo.postPositions).toHaveLength(3);
    expect(geo.postPositions2).toHaveLength(0);
  });
});
