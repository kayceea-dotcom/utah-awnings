import { describe, it, expect } from "vitest";
import { computeSideProfileGeometry } from "./sideProfileGeometry";

const base = { projection: 12, postHeight: 10 };

describe("side profile - Additional / Multi-Span Beams", () => {
  it("draws nothing extra when there are no additional beams", () => {
    expect(computeSideProfileGeometry(base)!.additionalBeams).toEqual([]);
  });

  it("places a beam at its distance from the house, level with the main beam", () => {
    const geo = computeSideProfileGeometry({ ...base, beams: [{ type: "3x8", positionFromHouse: 6, posts: 2 }] })!;
    expect(geo.additionalBeams).toHaveLength(1);
    const b = geo.additionalBeams[0];
    expect(b.x).toBeCloseTo(geo.houseX + 6 * geo.scale, 3);
    expect(b.topY).toBe(geo.beamTopY);
  });

  it("gives a beam with posts its own post running from its underside to the ground", () => {
    const geo = computeSideProfileGeometry({ ...base, beams: [{ type: "3x8", positionFromHouse: 6, posts: 2 }] })!;
    const b = geo.additionalBeams[0];
    expect(b.post).not.toBeNull();
    expect(b.post!.topY).toBeCloseTo(b.topY + b.height, 3);
    expect(b.post!.bottomY).toBe(geo.surfaceY);
  });

  it("draws just the beam, no post, when it has none of its own", () => {
    const geo = computeSideProfileGeometry({ ...base, beams: [{ type: "3x3", positionFromHouse: 6, posts: 0 }] })!;
    expect(geo.additionalBeams[0].post).toBeNull();
  });

  it("clamps a position past the cover back inside it", () => {
    const geo = computeSideProfileGeometry({ ...base, beams: [{ type: "3x8", positionFromHouse: 50, posts: 1 }] })!;
    expect(geo.additionalBeams[0].x).toBeCloseTo(geo.postX, 3);
  });

  it("sizes each beam by its own type", () => {
    const geo = computeSideProfileGeometry({ ...base, beams: [
      { type: "3x8", positionFromHouse: 4, posts: 1 },
      { type: "3x3", positionFromHouse: 8, posts: 1 },
    ] })!;
    expect(geo.additionalBeams[0].height).toBeGreaterThan(geo.additionalBeams[1].height);
  });
});
