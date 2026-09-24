import { describe, it, expect } from "vitest";
import { calcWPan } from "./wpan";
import { RATES } from "./rates";
import type { LineItem } from "./types";
import type { WPanInputs } from "./wpan";

function findItem(items: LineItem[], name: string) {
  return items.find((i) => i.name === name);
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

describe("V-Panel/DuraKing gutter and hanger never run longer than the job's own total width", () => {
  it("a 24ft-wide DuraKing job needs a single 24ft gutter, not two 16ft pieces", () => {
    const inp = wpanBase();
    inp.panelType = "duraking_025";
    inp.hangerType = "duraking_hanger";
    inp.width1 = 24;
    const out = calcWPan(inp);
    const gutter = findItem(out.lineItems, "DuraKing Gutter");
    expect(gutter).toBeTruthy();
    expect(gutter!.qty).toBe(1);
    expect(gutter!.amount).toBeCloseTo(RATES.duraking_gutter_24, 2);
    expect(out.lineItems.some((i) => i.name.startsWith("DuraKing Gutter ("))).toBe(false);
  });

  it("a 24ft-wide Tri-V job needs a single 24ft gutter too", () => {
    const inp = wpanBase();
    inp.width1 = 24;
    inp.gutterType = "extruded";
    const out = calcWPan(inp);
    const gutter = findItem(out.lineItems, "Extruded Gutter 2.5in");
    expect(gutter).toBeTruthy();
    expect(gutter!.qty).toBe(1);
    expect(gutter!.amount).toBeCloseTo(RATES.gutter_extruded_24, 2);
  });
});

describe("DuraKing hanger/gutter/fascia - its own hardware, distinct from Tri-V's 2.5in extruded line", () => {
  it("Tri-V: extruded gutter/fascia use the real extruded stock-piece rates (matches Flat Panel)", () => {
    const inp = wpanBase();
    inp.gutterType = "extruded";
    const out = calcWPan(inp);
    const gutter = findItem(out.lineItems, "Extruded Gutter 2.5in");
    const fascia = findItem(out.lineItems, "Extruded Side Fascia");
    // width1=20 -> gutterNeededFt=20 -> 20ft tier; projection1=12 -> one-piece fascia, neededFt=24 -> 24ft tier
    expect(gutter).toBeTruthy();
    expect(gutter!.amount).toBeCloseTo(RATES.gutter_extruded_20, 2);
    expect(fascia).toBeTruthy();
    expect(fascia!.rate).toBeCloseTo(RATES.fascia_extruded_24, 2);
  });

  it("Tri-V: roll form gutter still uses the 2x6 board fascia, unaffected", () => {
    const inp = wpanBase();
    inp.gutterType = "roll_form";
    const out = calcWPan(inp);
    expect(findItem(out.lineItems, "Roll Form Gutter")).toBeTruthy();
    const fascia = findItem(out.lineItems, "Side Fascia (2x6)");
    expect(fascia).toBeTruthy();
    expect(fascia!.rate).toBeCloseTo(RATES.fascia_extruded_2x6_ft, 2);
  });

  it("DuraKing: gutter and fascia price off DuraKing's own rates, not Tri-V's", () => {
    const inp = wpanBase();
    inp.panelType = "duraking_025";
    inp.hangerType = "duraking_hanger";
    const out = calcWPan(inp);
    const gutter = findItem(out.lineItems, "DuraKing Gutter");
    const fascia = findItem(out.lineItems, "DuraKing Fascia");
    expect(gutter).toBeTruthy();
    expect(fascia).toBeTruthy();
    expect(fascia!.rate).toBeCloseTo(RATES.duraking_fascia_24, 2);
    expect(findItem(out.lineItems, "Extruded Gutter 2.5in")).toBeUndefined();
    expect(findItem(out.lineItems, "Extruded Side Fascia")).toBeUndefined();
  });

  it("DuraKing: ignores the Gutter Type dropdown (no roll-form DuraKing product) - always the stock-piece system", () => {
    const inp = wpanBase();
    inp.panelType = "duraking_032";
    inp.hangerType = "duraking_hanger";
    inp.gutterType = "roll_form";
    const out = calcWPan(inp);
    expect(findItem(out.lineItems, "DuraKing Gutter")).toBeTruthy();
    expect(findItem(out.lineItems, "Roll Form Gutter")).toBeUndefined();
  });

  it("DuraKing hanger: plain Hanger vs J-Hanger vs A-Rail each price differently", () => {
    const base = wpanBase();
    base.panelType = "duraking_040";

    const plain = calcWPan({ ...base, hangerType: "duraking_hanger" });
    const jHanger = calcWPan({ ...base, hangerType: "duraking_j_hanger" });
    const aRail = calcWPan({ ...base, hangerType: "a_rail" });

    // width1=20 -> hangerLen=20 -> exactly the 20ft tier
    expect(findItem(plain.lineItems, "DuraKing Hanger")!.rate).toBeCloseTo(RATES.duraking_hanger_20, 2);
    expect(findItem(jHanger.lineItems, "DuraKing J-Hanger")!.rate).toBeCloseTo(RATES.duraking_j_hanger_20, 2);
    expect(findItem(aRail.lineItems, "DuraKing A-Rail")!.rate).toBeCloseTo(RATES.hanger_a_rail_10, 2);
  });
});
