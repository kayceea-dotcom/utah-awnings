import { describe, it, expect } from "vitest";
import { calcNewport } from "./newport";
import { calcWPan } from "./wpan";
import { calcIRP } from "./irp";
import { RATES } from "./rates";
import type { NewportInputs, LineItem } from "./types";
import type { WPanInputs } from "./wpan";
import type { IRPInputs } from "./irp";

function findItem(items: LineItem[], name: string) {
  return items.find((i) => i.name === name);
}

function newportBase(): NewportInputs {
  return {
    jobName: "Test", salesman: "Rep", salesmanPhone: "", housePhotoUrl: "",
    projection1: 10, width1: 14, projection2: 0, width2: 0, jogType: "ground",
    panelType1: "T6_040", panelType2: "",
    beamLength1: 20, beamLength2: 0,
    beamType1: "3x8", beamType2: "",
    beamEndCut1: "beveled", beamEndCut2: "",
    beamEndCutSide1: "both_ends", beamEndCutSide2: "both_ends",
    beams: [],
    gutterType: "extruded", hangerType: "extruded",
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
    projection1: 10, width1: 14, projection2: 0, width2: 0,
    panelType: "wpan_032",
    beamLength1: 20, beamLength2: 0, beamQty1: 1, beamQty2: 1,
    beamType1: "3x8", beamType2: "",
    beamEndCut1: "beveled", beamEndCut2: "",
    beamEndCutSide1: "both_ends", beamEndCutSide2: "both_ends",
    jogType: "none", hangerType: "a_rail", gutterType: "extruded",
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

function irpBase(): IRPInputs {
  return {
    jobName: "Test", salesman: "Rep", salesmanPhone: "", housePhotoUrl: "",
    projection1: 12, width1: 20, projection2: 0, width2: 0, jogType: "ground",
    panelType: "lrp_4_032",
    beamLength1: 20, beamLength2: 0,
    beamType1: "3x8", beamType2: "",
    posts1: 2, postHeight1: 10, posts2: 0, postHeight2: 10,
    colorPostsBeam: "White",
    wrapType: "none",
    rafterTails: true,
    fanBeamQty: 0, fanBeamLength: 16,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 10, skyliftPosts: 0,
    shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, customTotal: null, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

describe("Extruded hanger/A-Rail: flat fee per stock piece, not per ft", () => {
  it("Newport: extruded hanger charges the flat 20ft stock price regardless of the run's actual width", () => {
    const inp = newportBase();
    inp.width1 = 14; // well under the 20ft stock piece
    const out = calcNewport(inp);
    const hanger = findItem(out.lineItems, "Hanger")!;
    expect(hanger.rate).toBe(RATES.hanger_extruded_20);
    expect(hanger.amount).toBe(RATES.hanger_extruded_20);
    expect(hanger.displayLength).toBe(20);
  });

  it("W-Pan: A-Rail hanger charges the flat 10ft stock price", () => {
    const out = calcWPan(wpanBase());
    const hanger = findItem(out.lineItems, "Hanger 2.5in")!;
    expect(hanger.rate).toBe(RATES.hanger_a_rail_10);
    expect(hanger.amount).toBe(RATES.hanger_a_rail_10);
    expect(hanger.displayLength).toBe(10);
  });

  it("Newport: Roll Form hanger is unaffected - still priced per ft", () => {
    const inp = newportBase();
    inp.hangerType = "roll_form";
    const out = calcNewport(inp);
    const hanger = findItem(out.lineItems, "Hanger")!;
    expect(hanger.rate).toBe(RATES.hanger_roll_form_ft);
    expect(hanger.length).toBeGreaterThan(0);
  });
});

describe("Extruded gutter/fascia: flat fee per stock tier (16/20/24ft), not per ft", () => {
  it("Newport: a 14ft-wide run picks the 16ft gutter tier", () => {
    const inp = newportBase();
    inp.width1 = 14;
    const out = calcNewport(inp);
    const gutter = findItem(out.lineItems, "Extruded Gutter")!;
    expect(gutter.rate).toBe(RATES.gutter_extruded_16);
    expect(gutter.displayLength).toBe(16);
  });

  it("Newport: an 18ft-wide run picks the 20ft gutter tier", () => {
    const inp = newportBase();
    inp.width1 = 18;
    const out = calcNewport(inp);
    const gutter = findItem(out.lineItems, "Extruded Gutter")!;
    expect(gutter.rate).toBe(RATES.gutter_extruded_20);
    expect(gutter.displayLength).toBe(20);
  });

  it("Newport: a run wider than 24ft is capped at the largest (24ft) gutter tier", () => {
    const inp = newportBase();
    inp.width1 = 30;
    const out = calcNewport(inp);
    const gutter = findItem(out.lineItems, "Extruded Gutter")!;
    expect(gutter.rate).toBe(RATES.gutter_extruded_24);
    expect(gutter.displayLength).toBe(24);
  });

  it("Newport: side fascia under 12ft projection is one piece (cut in half) sized off double the projection", () => {
    const inp = newportBase();
    inp.projection1 = 8; // doubled = 16ft -> 16ft tier
    const out = calcNewport(inp);
    const fascia = findItem(out.lineItems, "Extruded Side Fascia")!;
    expect(fascia.qty).toBe(1);
    expect(fascia.rate).toBe(RATES.fascia_extruded_16);
  });

  it("Newport: side fascia over 12ft projection is two separate pieces sized off the projection itself", () => {
    const inp = newportBase();
    inp.projection1 = 18; // -> 20ft tier
    const out = calcNewport(inp);
    const fascia = findItem(out.lineItems, "Extruded Side Fascia")!;
    expect(fascia.qty).toBe(2);
    expect(fascia.rate).toBe(RATES.fascia_extruded_20);
  });

  it("W-Pan: extruded gutter picks the correct stock tier too", () => {
    const inp = wpanBase();
    inp.width1 = 14;
    const out = calcWPan(inp);
    const gutter = findItem(out.lineItems, "Extruded Gutter 2.5in")!;
    expect(gutter.rate).toBe(RATES.gutter_extruded_16);
  });
});

describe("LRP 4.25in Hanger now has a 24ft tier (previously always charged the 20ft rate)", () => {
  it("beam length over 18ft picks the 24ft hanger, not the 20ft one", () => {
    const inp = irpBase();
    inp.beamLength1 = 22;
    const out = calcIRP(inp);
    const hanger = findItem(out.lineItems, "LRP Hanger")!;
    expect(hanger.rate).toBe(RATES.lrp_4_hanger_24);
  });

  it("beam length 18ft or under still picks the 20ft hanger", () => {
    const inp = irpBase();
    inp.beamLength1 = 18;
    const out = calcIRP(inp);
    const hanger = findItem(out.lineItems, "LRP Hanger")!;
    expect(hanger.rate).toBe(RATES.lrp_4_hanger_20);
  });
});
