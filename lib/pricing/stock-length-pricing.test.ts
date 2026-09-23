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
    beams: [],
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
    beams: [],
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

  it("Newport: a run over 24ft combines two pieces - 30ft picks the shortest 2-piece combo (two 16ft pieces)", () => {
    const inp = newportBase();
    inp.width1 = 30;
    const out = calcNewport(inp);
    const gutter = findItem(out.lineItems, "Extruded Gutter")!;
    expect(gutter.rate).toBe(RATES.gutter_extruded_16);
    expect(gutter.displayLength).toBe(16);
    expect(gutter.qty).toBe(2);
    expect(gutter.amount).toBe(2 * RATES.gutter_extruded_16);
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

describe("Extruded gutter over 24ft combines two stock pieces (shortest combo that covers the run)", () => {
  it("28ft needs two 16ft pieces (32ft total - the shortest 2-piece combo covering 28)", () => {
    const inp = newportBase();
    inp.width1 = 28;
    const out = calcNewport(inp);
    const gutter = findItem(out.lineItems, "Extruded Gutter")!;
    expect(gutter.qty).toBe(2);
    expect(gutter.rate).toBe(RATES.gutter_extruded_16);
    expect(gutter.displayLength).toBe(16);
  });

  it("35ft needs a 16ft + a 20ft piece (36ft total) as two separate line items, not two 20s (40ft)", () => {
    const inp = newportBase();
    inp.width1 = 35;
    const out = calcNewport(inp);
    const piece16 = findItem(out.lineItems, "Extruded Gutter (16ft)")!;
    const piece20 = findItem(out.lineItems, "Extruded Gutter (20ft)")!;
    expect(piece16.qty).toBe(1);
    expect(piece16.rate).toBe(RATES.gutter_extruded_16);
    expect(piece20.qty).toBe(1);
    expect(piece20.rate).toBe(RATES.gutter_extruded_20);
    // Bare "Extruded Gutter" (no size suffix) shouldn't also exist once split.
    expect(findItem(out.lineItems, "Extruded Gutter")).toBeUndefined();
  });

  it("42ft needs a 20ft + a 24ft piece (44ft total), not a 16+24 (40ft, which falls short)", () => {
    const inp = newportBase();
    inp.width1 = 42;
    const out = calcNewport(inp);
    const piece20 = findItem(out.lineItems, "Extruded Gutter (20ft)")!;
    const piece24 = findItem(out.lineItems, "Extruded Gutter (24ft)")!;
    expect(piece20.rate).toBe(RATES.gutter_extruded_20);
    expect(piece24.rate).toBe(RATES.gutter_extruded_24);
    expect(findItem(out.lineItems, "Extruded Gutter (16ft)")).toBeUndefined();
  });

  it("W-Pan: a run needing 35ft (after its own +1.5ft allowance) also splits into a 16ft + 20ft combo", () => {
    const inp = wpanBase();
    inp.width1 = 33.5; // + W-Pan's own 1.5ft gutter allowance = 35ft needed
    const out = calcWPan(inp);
    expect(findItem(out.lineItems, "Extruded Gutter 2.5in (16ft)")).toBeTruthy();
    expect(findItem(out.lineItems, "Extruded Gutter 2.5in (20ft)")).toBeTruthy();
  });
});

describe("Roll Form gutter only comes in 30ft pieces - runs over 30ft need multiple whole 30ft pieces", () => {
  it("a run at or under 30ft is a single 30ft piece", () => {
    const inp = newportBase();
    inp.hangerType = "roll_form";
    inp.gutterType = "roll_form";
    inp.width1 = 25;
    const out = calcNewport(inp);
    const gutter = findItem(out.lineItems, "Roll Form Gutter")!;
    expect(gutter.qty).toBe(1);
    expect(gutter.length).toBe(30);
  });

  it("a run over 30ft doubles up on whole 30ft pieces, not a 36ft piece (no such stock size exists)", () => {
    const inp = newportBase();
    inp.hangerType = "roll_form";
    inp.gutterType = "roll_form";
    inp.width1 = 35;
    const out = calcNewport(inp);
    const gutter = findItem(out.lineItems, "Roll Form Gutter")!;
    expect(gutter.qty).toBe(2);
    expect(gutter.length).toBe(30);
    expect(gutter.amount).toBe(2 * 30 * RATES.gutter_roll_form_ft);
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

describe("LRP 3in .024 panel - new lighter gauge alongside the existing .032", () => {
  it("prices at its own rate and labels itself distinctly from .032", () => {
    const inp = irpBase();
    inp.panelType = "lrp_3_024";
    const out = calcIRP(inp);
    const panel = findItem(out.lineItems, "LRP Panel #1 (3in .024)")!;
    expect(panel).toBeTruthy();
    expect(panel.rate).toBe(RATES.IRP_3_024);
  });

  it("shares the same 3in hanger/gutter/side-fascia hardware as .032 (same width, different gauge)", () => {
    const base = irpBase();
    base.panelType = "lrp_3_032";
    const baseOut = calcIRP(base);

    const inp = irpBase();
    inp.panelType = "lrp_3_024";
    const out = calcIRP(inp);

    expect(findItem(out.lineItems, "LRP Hanger")!.rate).toBe(findItem(baseOut.lineItems, "LRP Hanger")!.rate);
    expect(findItem(out.lineItems, "LRP Gutter")!.rate).toBe(findItem(baseOut.lineItems, "LRP Gutter")!.rate);
    expect(findItem(out.lineItems, "LRP Side Fascia")!.rate).toBe(findItem(baseOut.lineItems, "LRP Side Fascia")!.rate);
  });

  it("has no drip edge, same as the other 3in gutter (drip edge is 4.25in-only)", () => {
    const inp = irpBase();
    inp.panelType = "lrp_3_024";
    const out = calcIRP(inp);
    expect(findItem(out.lineItems, "LRP Drip Edge")).toBeUndefined();
  });

  it(".032 and 4.25in panel labels are unchanged in shape (still show the gauge, just alongside .024 now)", () => {
    const inp32 = irpBase();
    inp32.panelType = "lrp_3_032";
    expect(findItem(calcIRP(inp32).lineItems, "LRP Panel #1 (3in .032)")).toBeTruthy();

    const inp4 = irpBase();
    inp4.panelType = "lrp_4_032";
    expect(findItem(calcIRP(inp4).lineItems, "LRP Panel #1 (4.25in .032)")).toBeTruthy();
  });
});
