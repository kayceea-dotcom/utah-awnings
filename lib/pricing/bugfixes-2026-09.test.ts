import { describe, it, expect } from "vitest";
import { calcNewport } from "./newport";
import { calcIRP } from "./irp";
import type { NewportInputs, LineItem } from "./types";
import type { IRPInputs } from "./irp";

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

function irpBase(): IRPInputs {
  return {
    jobName: "Test", salesman: "Rep", salesmanPhone: "", housePhotoUrl: "",
    projection1: 12, width1: 20, projection2: 0, width2: 0, jogType: "ground",
    panelType: "lrp_3_032",
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

function hasNameStartingWith(items: LineItem[], prefix: string) {
  return items.some((i) => i.name.startsWith(prefix));
}

describe("Issue 1 - Flat Panel: No Rafter Tails drops rafter-tail-only materials", () => {
  it("rafterTails=false omits Rafter Tails, End Caps, and Inside/Outside Brackets", () => {
    const inp = newportBase();
    inp.rafterTails = false;
    const out = calcNewport(inp);
    expect(hasNameStartingWith(out.lineItems, "Rafter Tails")).toBe(false);
    expect(hasNameStartingWith(out.lineItems, "End Caps")).toBe(false);
    expect(hasNameStartingWith(out.lineItems, "Inside Brackets")).toBe(false);
    expect(hasNameStartingWith(out.lineItems, "Outside Brackets")).toBe(false);
  });

  it("rafterTails=true still includes Rafter Tails, End Caps, and Brackets", () => {
    const out = calcNewport(newportBase());
    expect(hasNameStartingWith(out.lineItems, "Rafter Tails")).toBe(true);
    expect(hasNameStartingWith(out.lineItems, "End Caps")).toBe(true);
    expect(hasNameStartingWith(out.lineItems, "Inside Brackets")).toBe(true);
    expect(hasNameStartingWith(out.lineItems, "Outside Brackets")).toBe(true);
  });
});

describe("Issue 2 - Flat Panel: mixed Ground Mount / Concrete Mount posts", () => {
  it("splits Posts #1 into ground-mount and concrete lines using the entered quantity", () => {
    const inp = newportBase();
    inp.posts1 = 5;
    inp.posts1GroundMount = 3;
    const out = calcNewport(inp);
    const ground = findItem(out.lineItems, "3x3 Post Sleeve #1 (Ground Mount)");
    const concrete = findItem(out.lineItems, "3x3 Post Sleeve #1");
    expect(ground?.qty).toBe(3);
    expect(concrete?.qty).toBe(2);
  });

  it("mixes Posts #1 (ground) and Posts #2 (concrete) independently in the same project", () => {
    const inp = newportBase();
    inp.posts1 = 3; inp.posts1GroundMount = 3; // all ground mount
    inp.posts2 = 2; inp.posts2GroundMount = 0; // all concrete
    const out = calcNewport(inp);
    expect(findItem(out.lineItems, "3x3 Post Sleeve #1 (Ground Mount)")?.qty).toBe(3);
    expect(findItem(out.lineItems, "3x3 Post Sleeve #1")).toBeUndefined();
    expect(findItem(out.lineItems, "3x3 Post Sleeve #2")?.qty).toBe(2);
    expect(findItem(out.lineItems, "3x3 Post Sleeve #2 (Ground Mount)")).toBeUndefined();
  });

  it("anchors are only charged for the concrete-mounted subset, and the $100/post surcharge only for the ground-mounted subset", () => {
    const inp = newportBase();
    inp.posts1 = 5; inp.posts1GroundMount = 3; // 3 ground, 2 concrete
    const out = calcNewport(inp);
    expect(findItem(out.lineItems, "Wedge Anchors")?.qty).toBe(2 * 2); // 2 concrete posts x 2 anchors
    expect(out.misc).toBe(3 * 100); // 3 ground-mount posts x $100
  });

  it("ground-mount quantity is clamped to the group's own post count and ignored entirely on deck mount", () => {
    const inp = newportBase();
    inp.posts1 = 2; inp.posts1GroundMount = 99;
    inp.groundAttachment = "deck";
    const out = calcNewport(inp);
    expect(findItem(out.lineItems, "3x3 Post Sleeve #1 (Ground Mount)")).toBeUndefined();
    expect(findItem(out.lineItems, "3x3 Post Sleeve #1")?.qty).toBe(2);
  });
});

describe("Issue 3 - LRP: Drip Edge only applies to the 4.25in gutter, not the 3in gutter", () => {
  it("3in gutter (lrp_3_032) omits LRP Drip Edge", () => {
    const inp = irpBase();
    inp.panelType = "lrp_3_032";
    const out = calcIRP(inp);
    expect(findItem(out.lineItems, "LRP Drip Edge")).toBeUndefined();
  });

  it("4.25in gutter (lrp_4_032) still includes LRP Drip Edge", () => {
    const inp = irpBase();
    inp.panelType = "lrp_4_032";
    const out = calcIRP(inp);
    expect(findItem(out.lineItems, "LRP Drip Edge")).toBeTruthy();
  });

  it("no gutter present (no beam length) omits drip edge for either panel type", () => {
    const inp = irpBase();
    inp.panelType = "lrp_4_032";
    inp.beamLength1 = 0;
    const out = calcIRP(inp);
    expect(findItem(out.lineItems, "LRP Drip Edge")).toBeUndefined();
  });
});

describe("Issue 4 - LRP: Wrap Kit never adds a Front Plate Gutter", () => {
  it("Wrap Kit selected produces no 'Front Plate' line item", () => {
    const inp = irpBase();
    inp.wrapType = "2x6";
    const out = calcIRP(inp);
    expect(out.lineItems.some((i) => i.name.includes("Front Plate"))).toBe(false);
  });
});

describe("Issue 5 - LRP: rafter tails require a Wrap Kit, and don't double-count End Caps", () => {
  it("no Wrap Kit selected: rafter tails toggle has no effect", () => {
    const inp = irpBase();
    inp.wrapType = "none";
    inp.rafterTails = true;
    const out = calcIRP(inp);
    expect(findItem(out.lineItems, "Rafter Tails (2x6)")).toBeUndefined();
  });

  it("Wrap Kit + rafterTails=true adds Rafter Tails and brackets, with exactly one End Caps line from the Wrap Kit", () => {
    const inp = irpBase();
    inp.wrapType = "2x6";
    inp.rafterTails = true;
    const out = calcIRP(inp);
    expect(findItem(out.lineItems, "Rafter Tails (2x6)")).toBeTruthy();
    expect(findItem(out.lineItems, "Inside Brackets (2x6)")).toBeTruthy();
    expect(findItem(out.lineItems, "Outside Brackets (2x6)")).toBeTruthy();
    const endCapMatches = out.lineItems.filter((i) => i.name.startsWith("End Caps"));
    expect(endCapMatches.length).toBe(1);
  });

  it("Wrap Kit + rafterTails=false still includes the Wrap Kit's own End Caps, but no Rafter Tails", () => {
    const inp = irpBase();
    inp.wrapType = "2x6";
    inp.rafterTails = false;
    const out = calcIRP(inp);
    expect(findItem(out.lineItems, "Rafter Tails (2x6)")).toBeUndefined();
    const endCapMatches = out.lineItems.filter((i) => i.name.startsWith("End Caps"));
    expect(endCapMatches.length).toBe(1);
  });
});

describe("Issue 6 - LRP: Wrap Kit Plugs account for both panel runs", () => {
  it("a 2nd run's panels are included in the Plugs quantity", () => {
    const single = irpBase();
    single.wrapType = "2x6";
    const singleOut = calcIRP(single);
    const singlePlugs = findItem(singleOut.lineItems, "Plugs")!;

    const both = irpBase();
    both.wrapType = "2x6";
    both.projection2 = 12; both.width2 = 20; both.beamLength2 = 20;
    const bothOut = calcIRP(both);
    const bothPlugs = findItem(bothOut.lineItems, "Plugs")!;

    expect(bothPlugs.qty).toBeGreaterThan(singlePlugs.qty);
  });
});

describe("Issue 7 - LRP: Fan Beam option", () => {
  it("fanBeamQty=0 omits Fan Beam entirely", () => {
    const out = calcIRP(irpBase());
    expect(findItem(out.lineItems, "Fan Beam")).toBeUndefined();
    expect(findItem(out.lineItems, "Fan Beam Cap")).toBeUndefined();
  });

  it("fanBeamQty>0 adds Fan Beam and Fan Beam Cap sized by qty and length", () => {
    const inp = irpBase();
    inp.fanBeamQty = 2;
    inp.fanBeamLength = 16;
    const out = calcIRP(inp);
    const beam = findItem(out.lineItems, "Fan Beam");
    const cap = findItem(out.lineItems, "Fan Beam Cap");
    expect(beam?.qty).toBe(2);
    expect(beam?.length).toBe(16);
    expect(cap?.qty).toBe(2);
    expect(cap?.length).toBe(16);
  });
});

describe("Issue 8 - LRP: $300 Misc charge is the ground-mount surcharge, not a hidden default", () => {
  it("default (concrete mount) inputs produce $0 misc", () => {
    const out = calcIRP(irpBase());
    expect(out.misc).toBe(0);
  });

  it("3 ground-mounted posts produce exactly $300 misc via the $100/post ground-mount surcharge", () => {
    const inp = irpBase();
    inp.groundAttachment = "ground_mount";
    inp.posts1 = 3;
    inp.posts2 = 0;
    const out = calcIRP(inp);
    expect(out.misc).toBe(300);
  });
});
