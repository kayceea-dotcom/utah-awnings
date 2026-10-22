import { describe, it, expect } from "vitest";
import { beamMaterialRate, steelInsertRate, beamEndcapRate, beamPieces } from "./shared";
import { RATES } from "./rates";
import { calcNewport } from "./newport";
import { calcWPan } from "./wpan";
import { calcIRP } from "./irp";
import { calcPergola } from "./pergola";
import { buildOrderSheetData } from "../orderSheet";
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
    beams: [], walls: [],
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
    beamType1: "3x3", beamType2: "",
    beamEndCut1: "beveled", beamEndCut2: "",
    beamEndCutSide1: "both_ends", beamEndCutSide2: "both_ends",
    beams: [], walls: [],
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
    beams: [], walls: [],
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
    beams: [], walls: [],
    endCut: "scallop", endCutSide: "one_end",
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

describe("Double 3x8 beam - ordered as two pieces, not one at a doubled price", () => {
  it("counts as 2 pieces; every other beam type is 1", () => {
    expect(beamPieces("double_3x8")).toBe(2);
    expect(beamPieces("3x8")).toBe(1);
    expect(beamPieces("3x3")).toBe(1);
  });

  it("uses the plain 3x8 rates for the beam, insert and end cap", () => {
    expect(beamMaterialRate("double_3x8")).toBe(RATES.beam_3x8);
    expect(steelInsertRate("double_3x8")).toBe(RATES.steel_3x8_14ga_ft);
    expect(beamEndcapRate("double_3x8")).toBe(RATES.endcap_3x8);
  });
});

describe("Newport with a Double 3x8 beam", () => {
  it("lists the beam, steel insert and end caps as two of each, at the same total as before", () => {
    const inp = newportBase();
    inp.beamType1 = "double_3x8";
    const out = calcNewport(inp);
    const beam = out.lineItems.find((i) => i.name.startsWith("Beam #1"))!;
    expect(beam.qty).toBe(2);
    expect(beam.rate).toBe(RATES.beam_3x8);
    expect(beam.amount).toBeCloseTo(2 * RATES.beam_3x8 * inp.beamLength1, 2);
    const insert = findItem(out.lineItems, "Steel Insert #1")!;
    expect(insert.qty).toBe(2);
    expect(insert.rate).toBe(RATES.steel_3x8_14ga_ft);
    const caps = findItem(out.lineItems, "Beam End Caps #1")!;
    expect(caps.qty).toBe(4);
    expect(caps.rate).toBe(RATES.endcap_3x8);
  });

  it("leaves a plain 3x8 beam at one piece", () => {
    const out = calcNewport(newportBase());
    expect(out.lineItems.find((i) => i.name.startsWith("Beam #1"))!.qty).toBe(1);
    expect(findItem(out.lineItems, "Steel Insert #1")!.qty).toBe(1);
    expect(findItem(out.lineItems, "Beam End Caps #1")!.qty).toBe(2);
  });
});

describe("Double 3x8 beam on every awning type", () => {
  it("V-Panel: 2 beams, 2 inserts, 4 end caps", () => {
    const inp = wpanBase();
    inp.beamType1 = "double_3x8";
    const out = calcWPan(inp);
    expect(out.lineItems.find((i) => i.name.startsWith("Beam #1"))!.qty).toBe(2);
    expect(findItem(out.lineItems, "Steel Insert #1")!.qty).toBe(2);
    expect(findItem(out.lineItems, "Beam End Caps #1")!.qty).toBe(4);
  });

  it("V-Panel: a plain beam is still one piece", () => {
    const out = calcWPan(wpanBase());
    expect(out.lineItems.find((i) => i.name.startsWith("Beam #1"))!.qty).toBe(1);
  });

  it("IRP: 2 beams, 2 inserts, 4 end caps", () => {
    const inp = irpBase();
    inp.beamType1 = "double_3x8";
    const out = calcIRP(inp);
    expect(out.lineItems.find((i) => i.name.startsWith("Beam #1"))!.qty).toBe(2);
    expect(findItem(out.lineItems, "Steel Insert #1")!.qty).toBe(2);
    expect(findItem(out.lineItems, "Beam End Caps #1")!.qty).toBe(4);
  });

  it("Pergola: 2 beams, 2 inserts, 4 end caps", () => {
    const inp = pergolaBase();
    inp.beamType = "double_3x8";
    const out = calcPergola(inp);
    expect(out.lineItems.find((i) => i.name.startsWith("Beam ("))!.qty).toBe(2);
    expect(findItem(out.lineItems, "Steel Insert")!.qty).toBe(2);
    expect(findItem(out.lineItems, "3x8 Beam End Caps")!.qty).toBe(4);
  });

  it("an additional beam set to Double counts double too", () => {
    const inp = newportBase();
    inp.beams = [{ type: "double_3x8", qty: 1, length: 19.5, positionFromHouse: 6, posts: 0, postHeight: 10 }];
    const out = calcNewport(inp);
    expect(out.lineItems.find((i) => i.name.startsWith("Beam #3"))!.qty).toBe(2);
    expect(findItem(out.lineItems, "Beam End Caps #3")!.qty).toBe(4);
  });
});

describe("Order sheet shows the doubled quantities", () => {
  it("lists 2 beams, 2 steel inserts and 4 end caps for a Double 3x8", () => {
    const inp = newportBase();
    inp.beamType1 = "double_3x8";
    const lineItems = calcNewport(inp).lineItems;
    const sheet = buildOrderSheetData({
      quotes: { line_items: lineItems, inputs: { jobName: "Test" }, customers: { name: "Test" }, style: "flat_panel" },
    });
    const beam = sheet.items.find((i) => i.name.startsWith("Beam"))!;
    expect(beam.qty).toBe(2);
    expect(sheet.items.find((i) => i.name.startsWith("Steel Insert"))!.qty).toBe(2);
    expect(sheet.items.find((i) => i.name.startsWith("Beam End Caps"))!.qty).toBe(4);
  });
});
