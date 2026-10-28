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

describe("Freestanding Brackets - $150 each, freestanding / roof mount only", () => {
  it("Newport: adds the line at $150 each when freestanding", () => {
    const inp = newportBase();
    inp.mountStyle = "freestanding"; inp.rearBeamLength = 20; inp.rearPosts = 2;
    inp.freestandingBrackets = 4;
    const item = findItem(calcNewport(inp).lineItems, "Freestanding Brackets")!;
    expect(item.qty).toBe(4);
    expect(item.rate).toBe(150);
    expect(item.amount).toBe(600);
    expect(RATES.freestanding_bracket).toBe(150);
  });

  it("Newport: also applies to roof mount", () => {
    const inp = newportBase();
    inp.mountStyle = "roof_mount"; inp.rearBeamLength = 20; inp.skyliftPosts = 2;
    inp.freestandingBrackets = 2;
    expect(findItem(calcNewport(inp).lineItems, "Freestanding Brackets")!.amount).toBe(300);
  });

  it("Newport: ignored when attached, even if a count was left in from before", () => {
    const inp = newportBase();
    inp.freestandingBrackets = 4;
    expect(findItem(calcNewport(inp).lineItems, "Freestanding Brackets")).toBeUndefined();
  });

  it("Newport: no line at 0 or when the field is missing (older saved quotes)", () => {
    const inp = newportBase();
    inp.mountStyle = "freestanding"; inp.rearBeamLength = 20; inp.rearPosts = 2;
    expect(findItem(calcNewport(inp).lineItems, "Freestanding Brackets")).toBeUndefined();
    inp.freestandingBrackets = 0;
    expect(findItem(calcNewport(inp).lineItems, "Freestanding Brackets")).toBeUndefined();
  });

  it("V-Panel, IRP and Pergola all add it too", () => {
    const w = wpanBase(); w.mountStyle = "freestanding"; w.rearBeamLength = 20; w.rearPosts = 2; w.freestandingBrackets = 2;
    const i = irpBase(); i.mountStyle = "freestanding"; i.rearBeamLength = 20; i.rearPosts = 2; i.freestandingBrackets = 2;
    const p = pergolaBase(); p.mountStyle = "freestanding"; p.rearBeamLength = 20; p.rearPosts = 2; p.freestandingBrackets = 2;
    for (const items of [calcWPan(w).lineItems, calcIRP(i).lineItems, calcPergola(p).lineItems]) {
      expect(findItem(items, "Freestanding Brackets")!.amount).toBe(300);
    }
  });

  it("changes the total by exactly the bracket cost before markup", () => {
    const base = newportBase();
    base.mountStyle = "freestanding"; base.rearBeamLength = 20; base.rearPosts = 2;
    const withB = { ...base, freestandingBrackets: 3 };
    expect(calcNewport(withB).materialCost - calcNewport(base).materialCost).toBeCloseTo(450, 2);
  });
});
