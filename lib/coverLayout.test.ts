import { describe, it, expect } from "vitest";
import {
  evenXs, layoutFromInputs, beamRows, addPost, movePost, removePost, setRowType,
  addExtraBeam, removeExtraBeam, setExtraBeamPosition, respaceLayout, spansOf, setRowXs, type CoverLayout,
} from "./coverLayout";
import { computeCoverDiagramGeometry } from "./coverDiagramGeometry";
import type { SketchRuns } from "./coverSketch";
import type { MountStyle } from "./pricing/types";

const RECT: SketchRuns = { width1: 20, projection1: 12, width2: 0, projection2: 0, jog: "none" };
const GROUND: SketchRuns = { width1: 14, projection1: 12, width2: 8, projection2: 8, jog: "ground" };
const HOUSE: SketchRuns = { width1: 14, projection1: 12, width2: 8, projection2: 8, jog: "house" };

function layoutFor(runs: SketchRuns, extra: Partial<Parameters<typeof layoutFromInputs>[0]> = {}): CoverLayout {
  return layoutFromInputs({
    runs, mountStyle: "attached", beamType1: "3x8", beamType2: runs.jog === "none" ? "" : "3x8",
    rearBeamType: "3x8", posts1: 2, posts2: runs.jog === "none" ? 0 : 2, rearCount: 0, beams: [], ...extra,
  });
}

describe("evenXs matches the diagram's spacing rule", () => {
  it("1.5ft in from each end, evenly between", () => {
    expect(evenXs(2, 0, 20)).toEqual([1.5, 18.5]);
    expect(evenXs(3, 0, 20)).toEqual([1.5, 10, 18.5]);
    expect(evenXs(1, 0, 20)).toEqual([10]);
    expect(evenXs(0, 0, 20)).toEqual([]);
  });
});

describe("layoutFromInputs", () => {
  it("falls back to even spacing and keeps the counts", () => {
    const l = layoutFor(RECT, { posts1: 3 });
    expect(l.xs1).toEqual([1.5, 10, 18.5]);
    expect(l.xs2).toEqual([]);
  });

  it("uses stored spots when they still match the count", () => {
    const l = layoutFor(RECT, { posts1: 2, postLayout: { xs1: [4, 15] } });
    expect(l.xs1).toEqual([4, 15]);
  });

  it("ignores stored spots when the count was edited by hand", () => {
    const l = layoutFor(RECT, { posts1: 3, postLayout: { xs1: [4, 15] } });
    expect(l.xs1).toEqual([1.5, 10, 18.5]);
  });

  it("a house jog keeps posts1/posts2 counts when spreading across the full width", () => {
    const l = layoutFor(HOUSE, { posts1: 2, posts2: 1 });
    expect(l.xs1).toHaveLength(2);
    expect(l.xs2).toHaveLength(1);
  });
});

describe("beam rows", () => {
  it("one front beam on a rectangle, 1.5ft back from the front", () => {
    const rows = beamRows(RECT, layoutFor(RECT), "attached");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "front1", y: 10.5, x0: 0, x1: 20, hasBeam: true });
  });

  it("with no beam the posts sit on the front edge", () => {
    const l = { ...layoutFor(RECT), beamType1: "none" };
    expect(beamRows(RECT, l, "attached")[0]).toMatchObject({ y: 12, hasBeam: false });
  });

  it("a ground jog has a beam per run, the house jog one continuous beam", () => {
    expect(beamRows(GROUND, layoutFor(GROUND), "attached").map((r) => r.id)).toEqual(["front1", "front2"]);
    const house = beamRows(HOUSE, layoutFor(HOUSE), "attached");
    expect(house.map((r) => r.id)).toEqual(["front"]);
    expect(house[0]).toMatchObject({ x0: 0, x1: 22 });
  });

  it("freestanding and roof mount add the rear beam", () => {
    for (const m of ["freestanding", "roof_mount"] as MountStyle[]) {
      const rows = beamRows(RECT, layoutFor(RECT, { rearCount: 2, mountStyle: m }), m);
      expect(rows.map((r) => r.id)).toEqual(["front1", "rear"]);
      expect(rows[1].y).toBe(1.5);
    }
  });
});

describe("placing posts", () => {
  const l0 = layoutFor(RECT, { posts1: 2, postLayout: { xs1: [2, 18] } });

  it("adds a post where you tap, snapped to half feet", () => {
    const l = addPost(l0, RECT, "attached", "front1", 9.8)!;
    expect(l.xs1).toEqual([2, 10, 18]);
  });

  it("won't stack a post within a foot of another", () => {
    expect(addPost(l0, RECT, "attached", "front1", 2.5)).toBeNull();
  });

  it("keeps a post on its beam", () => {
    const l = addPost(l0, RECT, "attached", "front1", 99)!;
    expect(l.xs1).toEqual([2, 18, 20]);
  });

  it("moves a post but not past its neighbour", () => {
    expect(movePost(l0, RECT, "attached", "front1", 0, 6)!.xs1).toEqual([6, 18]);
    expect(movePost(l0, RECT, "attached", "front1", 0, 30)!.xs1).toEqual([17, 18]);
  });

  it("removes a post", () => {
    expect(removePost(l0, RECT, "attached", "front1", 0)!.xs1).toEqual([18]);
  });

  it("a post added right of the step on a house jog belongs to run 2", () => {
    const l = addPost(layoutFor(HOUSE, { posts1: 1, posts2: 0 }), HOUSE, "attached", "front", 20)!;
    expect(l.xs2).toEqual([20]);
    expect(l.xs1).toHaveLength(1);
  });

  it("rear posts land in rearXs", () => {
    const l = layoutFor(RECT, { rearCount: 0, mountStyle: "freestanding" });
    expect(addPost(l, RECT, "freestanding", "rear", 5)!.rearXs).toEqual([5]);
  });
});

describe("beam types", () => {
  it("changes the right beam", () => {
    const l = layoutFor(GROUND);
    expect(setRowType(l, "front1", "none").beamType1).toBe("none");
    expect(setRowType(l, "front2", "3x3").beamType2).toBe("3x3");
    expect(setRowType(l, "rear", "3x3").rearBeamType).toBe("3x3");
  });
});

describe("additional beams", () => {
  it("adds one across run 1 with two posts, clamped inside the cover", () => {
    const l = addExtraBeam(layoutFor(RECT), RECT, 6, { type: "3x8", postHeight: 10 });
    expect(l.extra).toHaveLength(1);
    expect(l.extra[0]).toMatchObject({ positionFromHouse: 6, posts: 2, length: 19.5, postXs: [1.5, 18.5], postHeight: 10 });
    const far = addExtraBeam(layoutFor(RECT), RECT, 99, { type: "3x8", postHeight: 10 });
    expect(far.extra[0].positionFromHouse).toBe(11);
  });

  it("shows up as Beam 3 and takes posts like any other beam", () => {
    let l = addExtraBeam(layoutFor(RECT), RECT, 6, { type: "3x8", postHeight: 10 });
    const row = beamRows(RECT, l, "attached").find((r) => r.id === "extra0")!;
    expect(row).toMatchObject({ label: "Beam 3", y: 6 });
    l = addPost(l, RECT, "attached", "extra0", 10)!;
    expect(l.extra[0].posts).toBe(3);
    expect(l.extra[0].postXs).toEqual([1.5, 10, 18.5]);
  });

  it("moves and removes", () => {
    let l = addExtraBeam(layoutFor(RECT), RECT, 6, { type: "3x8", postHeight: 10 });
    l = setExtraBeamPosition(l, RECT, "extra0", 4);
    expect(l.extra[0].positionFromHouse).toBe(4);
    expect(removeExtraBeam(l, "extra0").extra).toHaveLength(0);
  });
});

describe("respaceLayout", () => {
  it("keeps counts and re-spaces for the new shape", () => {
    const l = layoutFor(RECT, { posts1: 2, postLayout: { xs1: [2, 18] } });
    const wider: SketchRuns = { ...RECT, width1: 30 };
    expect(respaceLayout(l, wider, false).xs1).toEqual([1.5, 28.5]);
  });

  it("a newly added second run starts with 2 posts and run 1's beam type", () => {
    const l = { ...layoutFor(RECT), beamType2: "" };
    const out = respaceLayout(l, GROUND, false);
    expect(out.xs2).toHaveLength(2);
    expect(out.beamType2).toBe("3x8");
  });

  it("removing the second run drops its posts", () => {
    expect(respaceLayout(layoutFor(GROUND), RECT, true).xs2).toEqual([]);
  });

  it("an existing 'no beam 2' choice survives a re-space", () => {
    const l = { ...layoutFor(GROUND), beamType2: "" };
    expect(respaceLayout(l, GROUND, true).beamType2).toBe("");
  });
});

describe("spans", () => {
  it("between neighbouring posts", () => {
    const row = beamRows(RECT, layoutFor(RECT, { posts1: 3 }), "attached")[0];
    expect(spansOf(row)).toEqual([8.5, 8.5]);
  });
});

describe("the cover diagram draws the exact post spots", () => {
  const base = { projection1: 12, width1: 20, posts1: 2, jogType: "ground" };
  it("uses stored spots when the count matches, even spacing when it doesn't", () => {
    const custom = computeCoverDiagramGeometry({ ...base, postLayout: { xs1: [4, 15] } })!;
    const even = computeCoverDiagramGeometry(base)!;
    const x = (g: typeof custom, ft: number) => g.ox + ft * g.scale;
    expect(custom.postPositions).toEqual([x(custom, 4), x(custom, 15)]);
    expect(even.postPositions[0]).toBeCloseTo(x(even, 1.5));
    const stale = computeCoverDiagramGeometry({ ...base, posts1: 3, postLayout: { xs1: [4, 15] } })!;
    expect(stale.postPositions).toHaveLength(3);
  });

  it("rear and additional beams too", () => {
    const g = computeCoverDiagramGeometry({
      ...base, mountStyle: "freestanding", rearPosts: 2, postLayout: { rearXs: [3, 17] },
      beams: [{ type: "3x8", qty: 1, length: 19.5, positionFromHouse: 5, posts: 2, postHeight: 10, postXs: [5, 12] }],
    })!;
    expect(g.rearPostPositions).toEqual([g.ox + 3 * g.scale, g.ox + 17 * g.scale]);
    expect(g.multiSpanBeams[0].postXs).toEqual([g.ox + 5 * g.scale, g.ox + 12 * g.scale]);
  });

  it("a house jog uses the combined spots of both runs", () => {
    const g = computeCoverDiagramGeometry({
      projection1: 12, width1: 14, projection2: 8, width2: 8, posts1: 2, posts2: 1, jogType: "house",
      postLayout: { xs1: [3, 9], xs2: [20] },
    })!;
    expect(g.postPositions).toEqual([g.ox + 3 * g.scale, g.ox + 9 * g.scale, g.ox + 20 * g.scale]);
  });
});

describe("setRowXs", () => {
  it("sorts and rounds", () => {
    expect(setRowXs(layoutFor(RECT), RECT, "front1", [10.004, 2]).xs1).toEqual([2, 10]);
  });
});
