import { describe, it, expect } from "vitest";
import { coverToScene, type SceneCoverInputs } from "./cover";
import { wpanToScene } from "./wpan";
import type { WPanInputs } from "@/lib/pricing/wpan";

const base: SceneCoverInputs = {
  width1: 20, projection1: 12, width2: 0, projection2: 0, jogType: "ground",
  posts1: 3, postHeight1: 10, posts2: 0, postHeight2: 10, beamLength1: 19.5, beamLength2: 0,
  beamType1: "3x8", beamType2: "", beamEndCut1: "beveled", beamEndCut2: "",
  wrapType: "2x6", rafterTails: true, beams: [], gutterType: "extruded", downspouts: 1, downspoutSide: "right",
  colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "Slate", groundAttachment: "concrete",
  fanBeamQty: 0, fanBeamLength: 16, mountStyle: "attached", rearBeamType: "3x8", rearBeamLength: 0,
  rearPosts: 0, skyliftPosts: 0, rearPostHeight: 10,
};
const opts = { productType: "newport" as const, roofType: "flat_pan" as const };

describe("coverToScene", () => {
  it("spaces posts evenly when there are no exact spots", () => {
    const s = coverToScene(base, opts);
    expect(s.runs[0].posts.map((p) => p.x)).toEqual([1.5, 10, 18.5]);
  });

  it("uses the exact post spots from the sketch", () => {
    const s = coverToScene({ ...base, postLayout: { xs1: [2, 6, 17] } }, opts);
    expect(s.runs[0].posts.map((p) => p.x)).toEqual([2, 6, 17]);
  });

  it("ignores exact spots that no longer fit the count", () => {
    const s = coverToScene({ ...base, postLayout: { xs1: [2, 6] } }, opts);
    expect(s.runs[0].posts.map((p) => p.x)).toEqual([1.5, 10, 18.5]);
  });

  it("run 2's exact spots are stored from the cover's left edge", () => {
    const s = coverToScene({ ...base, width1: 14, width2: 8, projection2: 8, posts1: 2, posts2: 2, postLayout: { xs1: [2, 12], xs2: [16, 21] } }, opts);
    expect(s.runs[1].posts.map((p) => p.x)).toEqual([2, 7]); // relative to run 2's own origin (14)
  });

  it("a house-wall jog steps the wall and keeps the front flush", () => {
    const s = coverToScene({ ...base, width1: 14, width2: 8, projection2: 8, posts1: 2, posts2: 2, jogType: "house" }, opts);
    expect(s.jog).toBe("house");
    expect(s.runs[0].zOffsetFt).toBe(0);
    expect(s.runs[1].zOffsetFt).toBe(4);
    expect(s.runs[1].zOffsetFt + s.runs[1].projectionFt).toBe(s.runs[0].zOffsetFt + s.runs[0].projectionFt);
  });

  it("a ground jog keeps the wall flush and steps the front", () => {
    const s = coverToScene({ ...base, width1: 14, width2: 8, projection2: 8, posts1: 2, posts2: 2 }, opts);
    expect(s.jog).toBe("ground");
    expect(s.runs.map((r) => r.zOffsetFt)).toEqual([0, 0]);
  });

  it("no beam puts the posts at the front edge and drops the beam", () => {
    const s = coverToScene({ ...base, beamType1: "none" }, opts);
    expect(s.runs[0].hasBeam).toBe(false);
    expect(s.runs[0].beamZFt).toBeCloseTo(12 - 0.15);
  });

  it("run 2 with no beam stays beamless, but a house jog keeps one continuous beam", () => {
    const two = { ...base, width1: 14, width2: 8, projection2: 8, posts2: 2, beamType2: "" };
    expect(coverToScene(two, opts).runs[1].hasBeam).toBe(false);
    expect(coverToScene({ ...two, jogType: "house" }, opts).runs[1].hasBeam).toBe(true);
  });

  it("additional beams carry their exact post spots", () => {
    const s = coverToScene({ ...base, beams: [{ type: "3x8", qty: 1, length: 19.5, positionFromHouse: 5, posts: 2, postHeight: 10, postXs: [3, 16] }] }, opts);
    expect(s.multiSpanBeams[0].postXs).toEqual([3, 16]);
  });

  it("freestanding and roof mount get a rear beam with its own posts", () => {
    const free = coverToScene({ ...base, mountStyle: "freestanding", rearBeamLength: 19.5, rearPosts: 2, postLayout: { rearXs: [3, 17] } }, opts);
    expect(free.rearBeam?.postXs).toEqual([3, 17]);
    expect(free.houseWall).toBe(false);
    const roof = coverToScene({ ...base, mountStyle: "roof_mount", rearBeamLength: 19.5, skyliftPosts: 3 }, opts);
    expect(roof.rearBeam?.postXs).toHaveLength(3);
    expect(coverToScene(base, opts).rearBeam).toBeNull();
    expect(coverToScene(base, opts).houseWall).toBe(true);
  });

  it("downspout side follows the quote", () => {
    expect(coverToScene({ ...base, downspoutSide: "left" }, opts).downspoutSide).toBe("left");
    expect(coverToScene(base, opts).downspoutSide).toBe("right");
  });
});

describe("wpanToScene", () => {
  const w = { ...base, panelType: "wpan_032" } as unknown as WPanInputs;
  it("V-Panel gets ribs at the panel width: 2ft for Tri-V, 1ft for DuraKing", () => {
    expect(wpanToScene(w).runs[0].ribSpacingFt).toBe(2);
    expect(wpanToScene({ ...w, panelType: "duraking_025" } as WPanInputs).runs[0].ribSpacingFt).toBe(1);
    expect(wpanToScene(w).productType).toBe("w_pan");
  });
});
