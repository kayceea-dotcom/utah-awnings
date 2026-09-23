import { describe, it, expect } from "vitest";
import { calcNewport } from "./newport";
import { calcWPan } from "./wpan";
import { calcIRP } from "./irp";
import { calcPergola } from "./pergola";
import { RATES } from "./rates";
import type { NewportInputs, LineItem } from "./types";
import type { WPanInputs } from "./wpan";
import type { IRPInputs } from "./irp";
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
    wrapType: "none", rafterTails: true, bayWindowPopout: false,
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
    beamType1: "3x3", beamType2: "",
    beamEndCut1: "beveled", beamEndCut2: "",
    beamEndCutSide1: "both_ends", beamEndCutSide2: "both_ends",
    beams: [],
    jogType: "none", hangerType: "roll_form", gutterType: "extruded",
    posts1: 2, postHeight1: 10, posts2: 0, postHeight2: 10,
    colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "White",
    wrapType: "none", rafterTails: true,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x3", rearBeamEndCut: "beveled", rearBeamEndCutSide: "both_ends", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10, skyliftPosts: 0,
    fanBeamQty: 0, fanBeamLength: 16, shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, customTotal: null, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

function irpBase(): IRPInputs {
  return {
    jobName: "Test", salesman: "Rep", salesmanPhone: "", housePhotoUrl: "",
    projection1: 12, width1: 20, projection2: 0, width2: 0, jogType: "ground",
    panelType: "lrp_3_032",
    beamLength1: 20, beamLength2: 0,
    beamType1: "3x8", beamType2: "",
    posts1: 2, postHeight1: 10, posts2: 0, postHeight2: 10,
    colorPostsBeam: "White",
    beams: [],
    wrapType: "none",
    rafterTails: true,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10, skyliftPosts: 0,
    fanBeamQty: 0, fanBeamLength: 16,
    shadeBeamQty: 0, shadeBeamLength: 16,
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
    beams: [],
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

describe("Additional / Multi-Span Beams - each product's own #3+ (or #2+ for Pergola) beam", () => {
  it("Newport: an added beam prices as Beam #3, with its own posts", () => {
    const inp = newportBase();
    inp.beams = [{ type: "3x8", qty: 1, length: 19.5, positionFromHouse: 10, posts: 2, postHeight: 10 }];
    const out = calcNewport(inp);
    const beam = findItem(out.lineItems, "Beam #3 (3x8)");
    expect(beam).toBeTruthy();
    expect(beam!.amount).toBeCloseTo(RATES.beam_3x8 * 19.5, 2);
    expect(findItem(out.lineItems, "3x3 Post Sleeve #3")).toBeTruthy();
  });

  it("W-Pan: an added beam prices as Beam #3, with its own posts", () => {
    const inp = wpanBase();
    inp.beams = [{ type: "3x3", qty: 1, length: 19.5, positionFromHouse: 10, posts: 2, postHeight: 10 }];
    const out = calcWPan(inp);
    const beam = findItem(out.lineItems, "Beam #3 (3x3)");
    expect(beam).toBeTruthy();
    expect(beam!.amount).toBeCloseTo(RATES.beam_3x3 * 19.5, 2);
    expect(findItem(out.lineItems, "3x3 Post Sleeve #3")).toBeTruthy();
  });

  it("IRP: an added beam prices as Beam #3, with its own posts", () => {
    const inp = irpBase();
    inp.beams = [{ type: "3x8", qty: 1, length: 19.5, positionFromHouse: 10, posts: 2, postHeight: 10 }];
    const out = calcIRP(inp);
    const beam = findItem(out.lineItems, "Beam #3 (3x8)");
    expect(beam).toBeTruthy();
    expect(beam!.amount).toBeCloseTo(RATES.beam_3x8 * 19.5, 2);
    expect(findItem(out.lineItems, "3x3 Post Sleeve #3")).toBeTruthy();
  });

  it("Pergola: an added beam prices as Beam #2 (the primary beam is unlabeled), with its own posts", () => {
    const inp = pergolaBase();
    inp.beams = [{ type: "3x8", qty: 1, length: 19.5, positionFromHouse: 10, posts: 2, postHeight: 10 }];
    const out = calcPergola(inp);
    const beam = findItem(out.lineItems, "Beam #2 (3x8)");
    expect(beam).toBeTruthy();
    expect(beam!.amount).toBeCloseTo(RATES.beam_3x8 * 19.5, 2);
    expect(findItem(out.lineItems, "3x3 Post Sleeve #2")).toBeTruthy();
  });

  it("Newport: a beam with 0 length/qty contributes no beam line, but its posts still count", () => {
    const inp = newportBase();
    inp.beams = [{ type: "3x8", qty: 0, length: 0, positionFromHouse: 0, posts: 2, postHeight: 10 }];
    const out = calcNewport(inp);
    expect(out.lineItems.some((i) => i.name.startsWith("Beam #3"))).toBe(false);
    expect(findItem(out.lineItems, "3x3 Post Sleeve #3")).toBeTruthy();
  });
});
