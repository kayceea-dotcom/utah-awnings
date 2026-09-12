import { describe, it, expect } from "vitest";
import { calcNewport } from "./newport";
import { calcWPan } from "./wpan";
import { calcPergola } from "./pergola";
import type { NewportInputs, LineItem } from "./types";
import type { WPanInputs } from "./wpan";
import type { PergolaInputs } from "./pergola";

function findItem(items: LineItem[], name: string) {
  return items.find((i) => i.name === name);
}

function newportBase(): NewportInputs {
  return {
    jobName: "Test", salesman: "Rep", salesmanPhone: "", housePhotoUrl: "",
    projection1: 12, width1: 20, projection2: 0, width2: 0, jogType: "ground",
    panelType1: "T6_040", panelType2: "",
    beamLength1: 20, beamLength2: 0,
    beamType1: "3x8", beamType2: "",
    beamEndCut1: "beveled", beamEndCut2: "",
    beamEndCutSide1: "both_ends", beamEndCutSide2: "both_ends",
    beams: [],
    gutterType: "extruded", hangerType: "roll_form",
    posts1: 2, postHeight1: 10, posts2: 0, postHeight2: 10,
    posts1GroundMount: 0, posts2GroundMount: 0,
    colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "White",
    wrapType: "2x6", rafterTails: true, bayWindowPopout: false,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamEndCut: "beveled", rearBeamEndCutSide: "both_ends", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10, skyliftPosts: 0,
    fanBeamQty: 0, fanBeamLength: 16, shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, customTotal: null, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

function wpanBase(): WPanInputs {
  return {
    jobName: "Test", salesman: "Rep", salesmanPhone: "", housePhotoUrl: "",
    projection1: 12, width1: 20, projection2: 0, width2: 0,
    panelType: "wpan_032",
    beamLength1: 20, beamLength2: 0, beamQty1: 1, beamQty2: 1,
    beamType1: "3x8", beamType2: "",
    beamEndCut1: "beveled", beamEndCut2: "",
    beamEndCutSide1: "both_ends", beamEndCutSide2: "both_ends",
    jogType: "none", hangerType: "roll_form", gutterType: "extruded",
    posts1: 2, postHeight1: 10, posts2: 0, postHeight2: 10,
    colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "White",
    wrapType: "none", rafterTails: true,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamEndCut: "beveled", rearBeamEndCutSide: "both_ends", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10, skyliftPosts: 0,
    fanBeamQty: 0, fanBeamLength: 16, shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, customTotal: null, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

function pergolaBase(): PergolaInputs {
  return {
    jobName: "Test", salesman: "Rep", salesmanPhone: "", housePhotoUrl: "",
    projection: 12, width: 20,
    beamLength: 20, beamType: "3x8", beamEndCut: "beveled", beamQty: 1,
    rafterGauge: "032",
    latticeType: "2x2", latticeSpacing: "1x",
    headerBoard: false,
    posts: 2, postHeight: 10,
    colorPergola: "White",
    endCut: "scallop", endCutSide: "both_ends",
    sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10, skyliftPosts: 0,
    shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, customTotal: null, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

describe("3x8 beam End Cut Side (One End Cut / Both Ends Cut) - always spelled out explicitly, incl. on the order sheet", () => {
  it("Newport: defaults to 'Both Ends Cut', spelled out explicitly (not omitted)", () => {
    const out = calcNewport(newportBase());
    expect(findItem(out.lineItems, "Beam #1 (3x8, Beveled, Both Ends Cut)")).toBeTruthy();
  });

  it("Newport: One End Cut is reflected in the Beam #1 label", () => {
    const inp = newportBase();
    inp.beamEndCutSide1 = "one_end";
    const out = calcNewport(inp);
    expect(findItem(out.lineItems, "Beam #1 (3x8, Beveled, One End Cut)")).toBeTruthy();
    expect(findItem(out.lineItems, "Beam #1 (3x8, Beveled, Both Ends Cut)")).toBeUndefined();
  });

  it("Newport: Beam #2 gets its own independent End Cut Side", () => {
    const inp = newportBase();
    inp.beamType2 = "3x8"; inp.beamLength2 = 15;
    inp.beamEndCut2 = "mitered"; inp.beamEndCutSide2 = "one_end";
    const out = calcNewport(inp);
    expect(findItem(out.lineItems, "Beam #2 (3x8, Mitered, One End Cut)")).toBeTruthy();
    // Beam #1 stays on the default (Both Ends Cut)
    expect(findItem(out.lineItems, "Beam #1 (3x8, Beveled, Both Ends Cut)")).toBeTruthy();
  });

  it("Newport: Rear Beam (freestanding) gets its own independent End Cut Side", () => {
    const inp = newportBase();
    inp.mountStyle = "freestanding";
    inp.rearBeamLength = 20; inp.rearPosts = 2;
    inp.rearBeamEndCutSide = "one_end";
    const out = calcNewport(inp);
    expect(findItem(out.lineItems, "Beam Rear (3x8, Beveled, One End Cut)")).toBeTruthy();
  });

  it("Newport: End Cut Side has no effect on beam types that don't take an end cut (e.g. 3x3)", () => {
    const inp = newportBase();
    inp.beamType1 = "3x3";
    inp.beamEndCutSide1 = "one_end";
    const out = calcNewport(inp);
    expect(findItem(out.lineItems, "Beam #1 (3x3)")).toBeTruthy();
    expect(out.lineItems.some((i) => i.name.includes("End Cut"))).toBe(false);
  });

  it("W-Pan: defaults to 'Both Ends Cut', One End Cut is reflected in the label", () => {
    const base = calcWPan(wpanBase());
    expect(findItem(base.lineItems, "Beam #1 (3x8, Beveled, Both Ends Cut)")).toBeTruthy();

    const inp = wpanBase();
    inp.beamEndCutSide1 = "one_end";
    const out = calcWPan(inp);
    expect(findItem(out.lineItems, "Beam #1 (3x8, Beveled, One End Cut)")).toBeTruthy();
  });

  it("Pergola: rafters get the same End Cut Side treatment, defaulting to 'Both Ends Cut'", () => {
    const out = calcPergola(pergolaBase());
    expect(findItem(out.lineItems, "2x6 Rafters (Scallop, Both Ends Cut)")).toBeTruthy();
  });

  it("Pergola: One End Cut is reflected in the Rafters label", () => {
    const inp = pergolaBase();
    inp.endCutSide = "one_end";
    const out = calcPergola(inp);
    expect(findItem(out.lineItems, "2x6 Rafters (Scallop, One End Cut)")).toBeTruthy();
    expect(findItem(out.lineItems, "2x6 Rafters (Scallop, Both Ends Cut)")).toBeUndefined();
  });
});
