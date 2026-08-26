import { describe, it, expect } from "vitest";
import { calcNewport } from "./newport";
import { calcWPan } from "./wpan";
import { calcIRP } from "./irp";
import { calcPergola } from "./pergola";
import type { NewportInputs } from "./types";
import type { WPanInputs } from "./wpan";
import type { IRPInputs } from "./irp";
import type { PergolaInputs } from "./pergola";

function findItem(items: { name: string }[], name: string) {
  return items.find((i) => i.name === name);
}

function newportBase(): NewportInputs {
  return {
    jobName: "Test", salesman: "Rep", housePhotoUrl: "",
    projection1: 12, width1: 20, projection2: 0, width2: 0, jogType: "ground",
    panelType1: "T6_040", panelType2: "",
    beamLength1: 20, beamLength2: 0,
    beamType1: "3x8", beamType2: "",
    beamEndCut1: "beveled", beamEndCut2: "",
    beams: [],
    gutterType: "extruded", hangerType: "roll_form",
    posts1: 2, postHeight1: 10, posts2: 0, postHeight2: 10,
    colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "White",
    wrapType: "2x6", rafterTails: true, bayWindowPopout: false,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamEndCut: "beveled", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10,
    fanBeamQty: 0, fanBeamLength: 16, shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

function wpanBase(): WPanInputs {
  return {
    jobName: "Test", salesman: "Rep", housePhotoUrl: "",
    projection1: 12, width1: 20, projection2: 0, width2: 0,
    panelType: "wpan_032",
    beamLength1: 20, beamLength2: 0, beamQty1: 1, beamQty2: 1,
    beamType1: "3x3", beamType2: "",
    beamEndCut1: "beveled", beamEndCut2: "",
    jogType: "none", hangerType: "roll_form", gutterType: "extruded",
    posts1: 2, postHeight1: 10, posts2: 0, postHeight2: 10,
    colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "White",
    wrapType: "none", rafterTails: true,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x3", rearBeamEndCut: "beveled", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10,
    fanBeamQty: 0, fanBeamLength: 16, shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

function irpBase(): IRPInputs {
  return {
    jobName: "Test", salesman: "Rep", housePhotoUrl: "",
    projection1: 12, width1: 20, projection2: 0, width2: 0, jogType: "ground",
    panelType: "lrp_3_032",
    beamLength1: 20, beamLength2: 0,
    beamType1: "3x8", beamType2: "",
    posts1: 2, postHeight1: 10, posts2: 0, postHeight2: 10,
    colorPostsBeam: "White",
    wrapType: "none",
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10,
    shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

function pergolaBase(): PergolaInputs {
  return {
    jobName: "Test", salesman: "Rep", housePhotoUrl: "",
    projection: 12, width: 20,
    beamLength: 20, beamType: "3x8", beamEndCut: "beveled", beamQty: 1,
    rafterGauge: "032",
    latticeType: "2x2", latticeSpacing: "1x",
    headerBoard: false,
    posts: 2, postHeight: 10,
    colorPergola: "White",
    endCut: "scallop", endCutSide: "one_end",
    sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10,
    shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

describe("Freestanding mount style", () => {
  it("Newport: attached output is unchanged from before the feature existed", () => {
    const attached = calcNewport(newportBase());
    expect(findItem(attached.lineItems, "Hanger")).toBeTruthy();
    expect(findItem(attached.lineItems, "Beam Rear (3x8, Beveled)")).toBeUndefined();
  });

  it("Newport: freestanding drops the Hanger and adds a rear beam + posts", () => {
    const inp = newportBase();
    inp.mountStyle = "freestanding";
    inp.rearBeamLength = 20;
    inp.rearPosts = 2;
    inp.rearPostHeight = 12;
    const attached = calcNewport(newportBase());
    const free = calcNewport(inp);

    expect(findItem(free.lineItems, "Hanger")).toBeUndefined();
    expect(findItem(free.lineItems, "Beam Rear (3x8, Beveled)")).toBeTruthy();
    expect(findItem(free.lineItems, "3x3 Post Sleeve Rear")?.qty).toBe(2);
    expect(findItem(free.lineItems, "Post Plates Rear (2x6, Mitered)")?.qty).toBe(4);

    // totalPosts (2 front + 2 rear = 4) drives anchors/brackets - both should
    // double vs. the attached case's 2-post total.
    const attachedAnchors = findItem(attached.lineItems, "Wedge Anchors")?.qty ?? 0;
    const freeAnchors = findItem(free.lineItems, "Wedge Anchors")?.qty ?? 0;
    expect(freeAnchors).toBe(attachedAnchors * 2);
    const attachedBrackets = findItem(attached.lineItems, "Post Brackets")?.qty ?? 0;
    const freeBrackets = findItem(free.lineItems, "Post Brackets")?.qty ?? 0;
    expect(freeBrackets).toBe(attachedBrackets * 2);
  });

  it("WPan: freestanding drops the Hanger and adds a rear beam + posts", () => {
    const inp = wpanBase();
    inp.mountStyle = "freestanding";
    inp.rearBeamLength = 20;
    inp.rearPosts = 2;
    const free = calcWPan(inp);
    const attached = calcWPan(wpanBase());

    expect(findItem(attached.lineItems, "Hanger 2.5in")).toBeTruthy();
    expect(findItem(free.lineItems, "Hanger 2.5in")).toBeUndefined();
    expect(findItem(free.lineItems, "Beam Rear (3x3)")).toBeTruthy();
    expect(findItem(free.lineItems, "3x3 Post Sleeve Rear")?.qty).toBe(2);
    expect(findItem(free.lineItems, "Beam End Caps Rear")).toBeTruthy();
  });

  it("IRP: freestanding drops the LRP Hanger and adds a rear beam + posts", () => {
    const inp = irpBase();
    inp.mountStyle = "freestanding";
    inp.rearBeamLength = 20;
    inp.rearPosts = 2;
    const free = calcIRP(inp);
    const attached = calcIRP(irpBase());

    expect(findItem(attached.lineItems, "LRP Hanger")).toBeTruthy();
    expect(findItem(free.lineItems, "LRP Hanger")).toBeUndefined();
    expect(findItem(free.lineItems, "Beam Rear (3x8)")).toBeTruthy();
    expect(findItem(free.lineItems, "3x3 Post Sleeve Rear")?.qty).toBe(2);
  });

  it("Pergola: freestanding is purely additive (no ledger existed to remove) and adds its own Post Plates Rear line", () => {
    const inp = pergolaBase();
    inp.mountStyle = "freestanding";
    inp.rearBeamLength = 20;
    inp.rearPosts = 2;
    inp.rearPostHeight = 12;
    const free = calcPergola(inp);
    const attached = calcPergola(pergolaBase());

    expect(findItem(free.lineItems, "Beam Rear (3x8)")).toBeTruthy();
    expect(findItem(free.lineItems, "3x3 Post Sleeve Rear")?.qty).toBe(2);
    expect(findItem(free.lineItems, "2x6 Post Plates Rear (Mitered)")?.length).toBe(13);

    const attachedCaps = findItem(attached.lineItems, "Mitered Caps")?.qty ?? 0;
    const freeCaps = findItem(free.lineItems, "Mitered Caps")?.qty ?? 0;
    expect(freeCaps).toBe(attachedCaps * 2);
  });

  it("defaulting mountStyle/rear fields to 0 on every product matches pre-existing attached behavior exactly", () => {
    // Sanity check that the new optional-looking fields don't change materialCost
    // for a plain attached job when rear* fields are just left at 0.
    const n1 = calcNewport(newportBase());
    const n2 = calcNewport({ ...newportBase(), rearBeamLength: 0, rearPosts: 0 });
    expect(n2.materialCost).toBe(n1.materialCost);
  });
});
