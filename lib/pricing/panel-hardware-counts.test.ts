import { describe, it, expect } from "vitest";
import { calcNewport } from "./newport";
import { calcWPan } from "./wpan";
import { calcIRP } from "./irp";
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
    beams: [], walls: [],
    gutterType: "extruded", hangerType: "extruded",
    posts1: 2, postHeight1: 8, posts2: 0, postHeight2: 8,
    posts1GroundMount: 0, posts2GroundMount: 0,
    colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "White",
    wrapType: "none", rafterTails: true, bayWindowPopout: false,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamEndCut: "beveled", rearBeamEndCutSide: "both_ends", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 8, skyliftPosts: 0,
    fanBeamQty: 0, fanBeamLength: 16, shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, customTotal: null, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

function wpanBase(): WPanInputs {
  return {
    jobName: "Test", salesman: "Rep", salesmanPhone: "", housePhotoUrl: "",
    projection1: 10, width1: 20, projection2: 0, width2: 0,
    panelType: "wpan_032",
    beamLength1: 20, beamLength2: 0, beamQty1: 1, beamQty2: 1,
    beamType1: "3x8", beamType2: "",
    beamEndCut1: "beveled", beamEndCut2: "",
    beamEndCutSide1: "both_ends", beamEndCutSide2: "both_ends",
    beams: [], walls: [],
    jogType: "none", hangerType: "roll_form", gutterType: "extruded",
    posts1: 2, postHeight1: 8, posts2: 0, postHeight2: 8,
    colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "White",
    wrapType: "none", rafterTails: true,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamEndCut: "beveled", rearBeamEndCutSide: "both_ends", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 8, skyliftPosts: 0,
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
    posts1: 2, postHeight1: 8, posts2: 0, postHeight2: 8,
    colorPostsBeam: "White",
    beams: [], walls: [],
    wrapType: "none",
    rafterTails: true,
    fanBeamQty: 0, fanBeamLength: 16,
    downspouts: 1, downspoutSide: "right", sprayPaint: false,
    houseAttachment: "stucco", groundAttachment: "concrete", deckHeight: 0,
    mountStyle: "attached",
    rearBeamType: "3x8", rearBeamLength: 0,
    rearPosts: 0, rearPostHeight: 8, skyliftPosts: 0,
    shadeBeamQty: 0, shadeBeamLength: 16,
    discount: 0, customTotal: null, footings: 0, roofMounts: 0, misc: 0, tearDown: 0,
    markup: 2.0, taxRate: 0.0745,
  };
}

describe("downspouts come in 10' pieces - posts taller than 8' need a second piece each", () => {
  it("8' posts: one piece per downspout", () => {
    expect(findItem(calcNewport(newportBase()).lineItems, "Downspouts 2x3 10ft")!.qty).toBe(1);
    expect(findItem(calcWPan(wpanBase()).lineItems, "Downspouts 2x3 10ft")!.qty).toBe(1);
    expect(findItem(calcIRP(irpBase()).lineItems, "Downspouts 2x3 10ft")!.qty).toBe(1);
  });

  it("posts over 8': two pieces per downspout, other downspout parts unchanged", () => {
    const n = newportBase(); n.postHeight1 = 9; n.downspouts = 2;
    const w = wpanBase(); w.postHeight1 = 9; w.downspouts = 2;
    const i = irpBase(); i.postHeight1 = 9; i.downspouts = 2;
    for (const out of [calcNewport(n), calcWPan(w), calcIRP(i)]) {
      expect(findItem(out.lineItems, "Downspouts 2x3 10ft")!.qty).toBe(4);
      expect(findItem(out.lineItems, "Dropouts")!.qty).toBe(2);
      expect(findItem(out.lineItems, "Elbows 2x3")!.qty).toBe(6);
    }
  });

  it("only counts posts the job actually has", () => {
    const w = wpanBase(); w.posts2 = 0; w.postHeight2 = 12;
    expect(findItem(calcWPan(w).lineItems, "Downspouts 2x3 10ft")!.qty).toBe(1);
  });
});

describe("flashing - 10' pieces that overlap, one per 9' of hanger", () => {
  it("20' of hanger needs 3 pieces on every product", () => {
    expect(findItem(calcWPan(wpanBase()).lineItems, "Flashing")!.qty).toBe(3);
    const n = newportBase(); n.width1 = 20;
    expect(findItem(calcNewport(n).lineItems, "Flashing")!.qty).toBe(3);
    expect(findItem(calcIRP(irpBase()).lineItems, "Flashing")!.qty).toBe(3);
  });

  it("exactly 9' is one piece, a little over is two", () => {
    const a = wpanBase(); a.width1 = 9;
    expect(findItem(calcWPan(a).lineItems, "Flashing")!.qty).toBe(1);
    const b = wpanBase(); b.width1 = 9.5;
    expect(findItem(calcWPan(b).lineItems, "Flashing")!.qty).toBe(2);
  });

  it("no hanger (freestanding) means no flashing", () => {
    const w = wpanBase(); w.mountStyle = "freestanding";
    expect(findItem(calcWPan(w).lineItems, "Flashing")).toBeUndefined();
  });
});

describe("panel screws - 6 x #8x1/2 and 2 x #14x1 per panel, bagged by 100", () => {
  it("V-Panel 20' wide = 10 panels -> 60 and 20 screws round up to one bag each", () => {
    const out = calcWPan(wpanBase());
    expect(findItem(out.lineItems, "#8x1/2 Pan Color")!.qty).toBe(100);
    expect(findItem(out.lineItems, "#8x1/2 Extruded")!.qty).toBe(100);
    expect(findItem(out.lineItems, "#14x1 Colored Screws")!.qty).toBe(100);
    expect(findItem(out.lineItems, "#14x1 Washered Screws")!.qty).toBe(100);
  });

  it("a bigger job rolls over into a second bag", () => {
    const w = wpanBase(); w.width1 = 40; w.beamLength1 = 40; // 20 panels -> 120 of #8x1/2
    const out = calcWPan(w);
    expect(findItem(out.lineItems, "#8x1/2 Pan Color")!.qty).toBe(200);
    expect(findItem(out.lineItems, "#14x1 Colored Screws")!.qty).toBe(100);
  });

  it("Flat Panel and IRP use the same per-panel counts", () => {
    const n = newportBase(); n.width1 = 40; // T6 panels -> several; just check bag multiples
    const nOut = calcNewport(n);
    expect(findItem(nOut.lineItems, "#8x1/2 Pan Color")!.qty % 100).toBe(0);
    expect(findItem(nOut.lineItems, "#14x1 Colored Screws")!.qty % 100).toBe(0);
    const iOut = calcIRP(irpBase()); // 5 panels -> 30 and 10
    expect(findItem(iOut.lineItems, "#8x1/2 Pan Color")!.qty).toBe(100);
    expect(findItem(iOut.lineItems, "#14x1 Colored Screws")!.qty).toBe(100);
  });
});

describe("pan clips double when there is no beam on the job", () => {
  it("V-Panel: with a beam vs without", () => {
    const withBeam = wpanBase();
    const noBeam = wpanBase(); noBeam.beamLength1 = 0;
    const a = findItem(calcWPan(withBeam).lineItems, "Pan Clips")!.qty;
    const b = findItem(calcWPan(noBeam).lineItems, "Pan Clips")!.qty;
    expect(a).toBe(5); // 10 panels / 2
    expect(b).toBe(10);
  });

  it("Flat Panel: with a beam vs without", () => {
    const withBeam = newportBase();
    const noBeam = newportBase(); noBeam.beamLength1 = 0;
    const a = findItem(calcNewport(withBeam).lineItems, "Pan Clips")!.qty;
    const b = findItem(calcNewport(noBeam).lineItems, "Pan Clips")!.qty;
    expect(b).toBe(a * 2);
  });
});
