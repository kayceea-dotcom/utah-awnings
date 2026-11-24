import { describe, it, expect } from "vitest";
import {
  shapeFromRuns, analyzeShape, moveVertex, setEdgeLength, addStep, removeStep,
  normalizeShape, toggleJog, swapRuns, areaSqFt, runRects, type SketchRuns, type Pt,
} from "./coverSketch";

const RECT: SketchRuns = { width1: 20, projection1: 12, width2: 0, projection2: 0, jog: "none" };
const GROUND: SketchRuns = { width1: 14, projection1: 12, width2: 8, projection2: 8, jog: "ground" };
const HOUSE: SketchRuns = { width1: 14, projection1: 12, width2: 8, projection2: 8, jog: "house" };

function okRuns(pts: Pt[]) {
  const a = analyzeShape(pts);
  if (!a.ok) throw new Error(a.reason);
  return a.runs;
}

describe("shapeFromRuns / analyzeShape round trip", () => {
  it("a rectangle", () => {
    const pts = shapeFromRuns(RECT);
    expect(pts).toHaveLength(4);
    expect(okRuns(pts)).toEqual(RECT);
  });

  it("a ground/deck jog with the short run on the right", () => {
    const pts = shapeFromRuns(GROUND);
    expect(pts).toHaveLength(6);
    expect(okRuns(pts)).toEqual(GROUND);
  });

  it("a ground/deck jog with the short run on the left", () => {
    const r: SketchRuns = { width1: 8, projection1: 8, width2: 14, projection2: 12, jog: "ground" };
    expect(okRuns(shapeFromRuns(r))).toEqual(r);
  });

  it("a house jog with the long run on the left", () => {
    expect(okRuns(shapeFromRuns(HOUSE))).toEqual(HOUSE);
  });

  it("a house jog with the long run on the right", () => {
    const r: SketchRuns = { width1: 8, projection1: 8, width2: 14, projection2: 12, jog: "house" };
    expect(okRuns(shapeFromRuns(r))).toEqual(r);
  });

  it("two runs of equal depth collapse into one wide rectangle", () => {
    const r: SketchRuns = { width1: 10, projection1: 12, width2: 10, projection2: 12, jog: "ground" };
    expect(okRuns(shapeFromRuns(r))).toEqual({ width1: 20, projection1: 12, width2: 0, projection2: 0, jog: "none" });
  });
});

describe("unsupported shapes say why instead of guessing", () => {
  it("a U shape (8 corners)", () => {
    const u: Pt[] = [
      { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 12 }, { x: 14, y: 12 },
      { x: 14, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 12 }, { x: 0, y: 12 },
    ];
    const a = analyzeShape(u);
    expect(a.ok).toBe(false);
    if (!a.ok) expect(a.reason).toMatch(/8 corners/);
  });

  it("an angled edge", () => {
    const a = analyzeShape([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 24, y: 12 }, { x: 0, y: 12 }]);
    expect(a.ok).toBe(false);
    if (!a.ok) expect(a.reason).toMatch(/Angled/);
  });
});

describe("editing", () => {
  it("dragging a rectangle's front corner resizes width and depth together", () => {
    const next = moveVertex(shapeFromRuns(RECT), 2, 24, 14)!;
    expect(okRuns(next)).toEqual({ ...RECT, width1: 24, projection1: 14 });
  });

  it("snaps to half feet", () => {
    const next = moveVertex(shapeFromRuns(RECT), 2, 23.8, 13.1)!;
    expect(okRuns(next)).toEqual({ ...RECT, width1: 24, projection1: 13 });
  });

  it("refuses a drag that makes an edge shorter than a foot", () => {
    expect(moveVertex(shapeFromRuns(RECT), 2, 0.5, 12)).toBeNull();
  });

  it("refuses a drag that collapses the step into the side edge", () => {
    // Pull the step's inner corner all the way over to the right edge.
    const pts = shapeFromRuns(GROUND);
    expect(moveVertex(pts, 3, 22, 8)).toBeNull();
  });

  it("deepening one run by dragging the step's inner corner is allowed", () => {
    const pts = shapeFromRuns(GROUND);
    expect(okRuns(moveVertex(pts, 3, 14, 10)!).projection2).toBe(10);
  });

  it("typing an exact edge length", () => {
    const pts = shapeFromRuns(RECT);
    expect(okRuns(setEdgeLength(pts, 0, 30)!)).toEqual({ ...RECT, width1: 30 });
    expect(okRuns(setEdgeLength(pts, 1, 16)!)).toEqual({ ...RECT, projection1: 16 });
  });

  it("typing a length on an edge that runs left or up grows past the origin", () => {
    const pts = shapeFromRuns(RECT);
    // edge 2 is the front (runs right to left), edge 3 the left side (runs bottom to top)
    expect(okRuns(setEdgeLength(pts, 2, 26)!)).toEqual({ ...RECT, width1: 26 });
    expect(okRuns(setEdgeLength(pts, 3, 15)!)).toEqual({ ...RECT, projection1: 15 });
  });

  it("typing a length that is too short or too long is ignored", () => {
    const pts = shapeFromRuns(RECT);
    expect(setEdgeLength(pts, 0, 0.5)).toBeNull();
    expect(setEdgeLength(pts, 0, 500)).toBeNull();
  });

  it("adding a step makes a two-run ground jog and removing it goes back", () => {
    const stepped = addStep(shapeFromRuns(RECT));
    const runs = okRuns(stepped);
    expect(runs.jog).toBe("ground");
    expect(runs.width1 + runs.width2).toBe(20);
    expect(runs.projection1).toBe(12);
    expect(okRuns(removeStep(stepped))).toEqual(RECT);
  });

  it("flipping the jog and swapping sides keep the same run sizes", () => {
    expect(toggleJog(GROUND).jog).toBe("house");
    expect(toggleJog(RECT)).toEqual(RECT);
    const swapped = swapRuns(GROUND);
    expect(swapped.width1).toBe(8);
    expect(swapped.projection2).toBe(12);
    expect(okRuns(shapeFromRuns(swapped))).toEqual(swapped);
  });
});

describe("helpers", () => {
  it("normalizeShape drops collinear points and slides to the origin", () => {
    const pts = normalizeShape([{ x: 5, y: 5 }, { x: 10, y: 5 }, { x: 15, y: 5 }, { x: 15, y: 11 }, { x: 5, y: 11 }]);
    expect(pts).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 6 }, { x: 0, y: 6 }]);
  });

  it("area and run rectangles", () => {
    expect(areaSqFt(GROUND)).toBe(14 * 12 + 8 * 8);
    expect(areaSqFt(RECT)).toBe(240);
    expect(runRects(HOUSE)).toEqual([
      { x: 0, y: 0, w: 14, h: 12 },
      { x: 14, y: 4, w: 8, h: 8 },
    ]);
  });
});
