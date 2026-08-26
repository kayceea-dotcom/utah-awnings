import { RATES } from "./rates";
import type { LineItem, QuoteResult, HouseAttachmentType, GroundAttachmentType, MountStyle } from "./types";
import {
  li, nextStockLength, beamMaterialRate, steelInsertRate, beamEndcapRate, beamTypeLabel, anchorQty,
  wrapKitRates, wrapKitFinishingItems, deckHeightSurcharge, postMaterialLength, groundMountSurcharge,
  finalizePricing, shadeBeamItems,
} from "./shared";

export type IRPType = "lrp_3_032" | "lrp_4_032";

export interface IRPInputs {
  jobName: string;
  salesman: string;
  housePhotoUrl: string;
  projection1: number;
  width1: number;
  projection2: number;
  width2: number;
  jogType: string;
  panelType: IRPType;
  beamLength1: number;
  beamLength2: number;
  beamType1: string;
  beamType2: string;
  posts1: number;
  postHeight1: number;
  posts2: number;
  postHeight2: number;
  colorPostsBeam: string;
  wrapType: string;
  downspouts: number;
  downspoutSide: "left" | "right";
  sprayPaint: boolean;
  houseAttachment: HouseAttachmentType;
  groundAttachment: GroundAttachmentType;
  deckHeight: number;
  mountStyle: MountStyle;
  rearBeamType: string;
  rearBeamLength: number;
  rearPosts: number;
  rearPostHeight: number;
  shadeBeamQty: number;
  shadeBeamLength: number;
  discount: number;
  footings: number;
  roofMounts: number;
  misc: number;
  tearDown: number;
  markup: number;
  taxRate: number;
}

// LRP hanger: pick correct stock piece based on beam length
function lrpHangerRate(panelType: IRPType, beamLength: number): number {
  if (panelType === "lrp_4_032") return RATES.lrp_4_hanger_20;
  if (beamLength <= 14) return RATES.lrp_3_hanger_16;
  if (beamLength <= 18) return RATES.lrp_3_hanger_20;
  return RATES.lrp_3_hanger_24;
}

// LRP gutter: pick correct stock piece
function lrpGutterRate(panelType: IRPType, beamLength: number): number {
  if (panelType === "lrp_4_032") {
    return beamLength <= 18 ? RATES.lrp_4_gutter_20 : RATES.lrp_4_gutter_24;
  }
  if (beamLength <= 14) return RATES.lrp_3_gutter_16;
  if (beamLength <= 18) return RATES.lrp_3_gutter_20;
  return RATES.lrp_3_gutter_24;
}

// LRP fascia: pick correct stock piece based on projection
function lrpFasciaRate(panelType: IRPType, projection: number): number {
  if (panelType === "lrp_4_032") return RATES.lrp_4_fascia_25;
  if (projection <= 15) return RATES.lrp_3_fascia_17;
  if (projection <= 19) return RATES.lrp_3_fascia_21;
  return RATES.lrp_3_fascia_25;
}

export function calcIRP(inp: IRPInputs): QuoteResult {
  const items: LineItem[] = [];

  const panelRate = inp.panelType === "lrp_4_032" ? RATES.IRP_4_032 : RATES.IRP_3_032;
  const is4in = inp.panelType === "lrp_4_032";

  // ── PANELS — IRP/LRP is 4ft wide, priced per sq ft. `length` here is each panel's
  // own area (4ft x projection), not just the projection, so qty x length x rate
  // comes out to the real total square footage x $/sqft. displayLength overrides
  // what the material list shows so it reads as the real linear length instead of
  // that area value. ──
  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / 4) : 0;
  const p2Qty = inp.projection2 > 0 ? Math.ceil(inp.width2 / 4) : 0;

  if (p1Qty > 0) {
    items.push(li("LRP Panel #1 (" + (is4in ? "4.25in" : "3in") + ")", p1Qty, 4 * inp.projection1, panelRate, "sq ft", "", inp.projection1));
  }
  if (p2Qty > 0) {
    items.push(li("LRP Panel #2 (" + (is4in ? "4.25in" : "3in") + ")", p2Qty, 4 * inp.projection2, panelRate, "sq ft", "", inp.projection2));
  }

  // A 2nd run's jog only matters once there's a 2nd run at all. A house-wall jog keeps the
  // gutter/fascia/drip-edge as one continuous piece (the front stays straight) but splits the
  // hanger in 2 to follow the wall. A ground/deck jog does the opposite: 2 separate gutter/
  // fascia/drip-edge sets (the front steps), 1 continuous hanger.
  const hasSecondRun = inp.width2 > 0;
  const combinedBeamLength = inp.beamLength1 + inp.beamLength2;
  const splitHanger = hasSecondRun && inp.jogType === "house";
  const splitGutter = hasSecondRun && inp.jogType === "ground";

  // ── HANGER — skipped when freestanding, replaced by a rear beam + posts below ──
  const isFreestanding = inp.mountStyle === "freestanding";
  if (isFreestanding) {
    // No house tie-in - the back edge gets its own beam + posts below instead.
  } else if (splitHanger) {
    if (inp.beamLength1 > 0) items.push(li("LRP Hanger #1", 1, 0, lrpHangerRate(inp.panelType, inp.beamLength1)));
    if (inp.beamLength2 > 0) items.push(li("LRP Hanger #2", 1, 0, lrpHangerRate(inp.panelType, inp.beamLength2)));
  } else if (inp.beamLength1 > 0 || inp.beamLength2 > 0) {
    items.push(li("LRP Hanger", 1, 0, lrpHangerRate(inp.panelType, combinedBeamLength)));
  }

  // ── GUTTER ──
  if (splitGutter) {
    if (inp.beamLength1 > 0) items.push(li("LRP Gutter #1", 1, 0, lrpGutterRate(inp.panelType, inp.beamLength1)));
    if (inp.beamLength2 > 0) items.push(li("LRP Gutter #2", 1, 0, lrpGutterRate(inp.panelType, inp.beamLength2)));
  } else if (inp.beamLength1 > 0 || inp.beamLength2 > 0) {
    items.push(li("LRP Gutter", 1, 0, lrpGutterRate(inp.panelType, combinedBeamLength)));
  }

  // ── SIDE FASCIA — 2 sides per run ──
  if (splitGutter) {
    if (inp.projection1 > 0) items.push(li("LRP Side Fascia #1", 2, 0, lrpFasciaRate(inp.panelType, inp.projection1)));
    if (inp.projection2 > 0) items.push(li("LRP Side Fascia #2", 2, 0, lrpFasciaRate(inp.panelType, inp.projection2)));
  } else if (inp.projection1 > 0 || inp.projection2 > 0) {
    items.push(li("LRP Side Fascia", 2, 0, lrpFasciaRate(inp.panelType, Math.max(inp.projection1, inp.projection2))));
  }

  // ── DRIP EDGE ──
  if (splitGutter) {
    if (inp.beamLength1 > 0) items.push(li("LRP Drip Edge #1", 1, 0, RATES.lrp_drip_edge_24));
    if (inp.beamLength2 > 0) items.push(li("LRP Drip Edge #2", 1, 0, RATES.lrp_drip_edge_24));
  } else if (inp.beamLength1 > 0 || inp.beamLength2 > 0) {
    items.push(li("LRP Drip Edge", 1, 0, RATES.lrp_drip_edge_24));
  }

  // ── BEAMS ──
  if (inp.beamLength1 > 0) {
    items.push(li("Beam #1 (" + beamTypeLabel(inp.beamType1) + ")", 1, inp.beamLength1, beamMaterialRate(inp.beamType1), "", inp.colorPostsBeam));
    const steelRate1 = steelInsertRate(inp.beamType1);
    if (steelRate1 > 0) {
      items.push(li("Steel Insert #1", 1, nextStockLength(inp.beamLength1), steelRate1));
    }
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam #2 (" + beamTypeLabel(inp.beamType2) + ")", 1, inp.beamLength2, beamMaterialRate(inp.beamType2), "", inp.colorPostsBeam));
    const steelRate2 = steelInsertRate(inp.beamType2);
    if (steelRate2 > 0) {
      items.push(li("Steel Insert #2", 1, nextStockLength(inp.beamLength2), steelRate2));
    }
  }

  // ── BEAM END CAPS — sized to the beam's own type, zero for I-beams ──
  if (inp.beamLength1 > 0) {
    items.push(li("Beam End Caps #1", 2, 0, beamEndcapRate(inp.beamType1), "", inp.colorPostsBeam));
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam End Caps #2", 2, 0, beamEndcapRate(inp.beamType2), "", inp.colorPostsBeam));
  }

  // ── REAR BEAM — freestanding only, replaces the house-side LRP Hanger ──
  if (isFreestanding && inp.rearBeamLength > 0) {
    items.push(li("Beam Rear (" + beamTypeLabel(inp.rearBeamType) + ")", 1, inp.rearBeamLength, beamMaterialRate(inp.rearBeamType), "", inp.colorPostsBeam));
    const steelRateRear = steelInsertRate(inp.rearBeamType);
    if (steelRateRear > 0) {
      items.push(li("Steel Insert Rear", 1, nextStockLength(inp.rearBeamLength), steelRateRear));
    }
    items.push(li("Beam End Caps Rear", 2, 0, beamEndcapRate(inp.rearBeamType), "", inp.colorPostsBeam));
  }

  // ── POSTS ──
  const rearPosts = isFreestanding ? inp.rearPosts : 0;
  const totalPosts = inp.posts1 + inp.posts2 + rearPosts;
  if (inp.posts1 > 0) {
    const len1 = postMaterialLength(inp.postHeight1, inp.groundAttachment);
    items.push(li("3x3 Post Sleeve #1", inp.posts1, len1, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
    items.push(li("3x3 Steel Post #1",  inp.posts1, len1, RATES.post_3x3_steel_ft));
  }
  if (inp.posts2 > 0) {
    const len2 = postMaterialLength(inp.postHeight2, inp.groundAttachment);
    items.push(li("3x3 Post Sleeve #2", inp.posts2, len2, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
    items.push(li("3x3 Steel Post #2",  inp.posts2, len2, RATES.post_3x3_steel_ft));
  }
  if (rearPosts > 0) {
    const lenRear = postMaterialLength(inp.rearPostHeight, inp.groundAttachment);
    items.push(li("3x3 Post Sleeve Rear", rearPosts, lenRear, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
    items.push(li("3x3 Steel Post Rear",  rearPosts, lenRear, RATES.post_3x3_steel_ft));
  }

  // ── WRAP KIT — post plates, sideplates, mitered caps, foam inserts, end caps, plugs.
  // IRP keeps its own dedicated LRP hanger/gutter/fascia regardless, so unlike Flat Panel
  // and W-Pan there are no rafter-tail/front-plate/bracket items here. ──
  const hasWrap = inp.wrapType === "3x8" || inp.wrapType === "2x6";
  if (hasWrap) {
    items.push(...wrapKitFinishingItems(wrapKitRates(inp.wrapType), {
      posts1: inp.posts1, postHeight1: inp.postHeight1,
      posts2: inp.posts2, postHeight2: inp.postHeight2,
      postsRear: rearPosts, postHeightRear: inp.rearPostHeight,
      projection1: inp.projection1, width1: inp.width1, panelQty1: p1Qty,
      colorPostsBeam: inp.colorPostsBeam,
    }));
  }

  // ── POST BRACKETS ──
  if (totalPosts > 0) {
    items.push(li("Post Brackets", totalPosts * 2, 0, RATES.post_brkt));
  }

  // ── DOWNSPOUTS ──
  items.push(li("Gutter Dams", inp.downspouts * 2, 0, RATES.gutter_dam));
  if (inp.downspouts > 0) {
    items.push(li("Downspouts 2x3 10ft",  inp.downspouts,     0, RATES.downspout_2x3_10));
    items.push(li("Elbows 2x3",           inp.downspouts * 3, 0, RATES.elbow_2x3));
    items.push(li("Dropouts",             inp.downspouts,     0, RATES.dropout));
    items.push(li("Downspout Straps",     inp.downspouts * 2, 0, RATES.downspout_strap));
  }

  // ── FLASHING ──
  if (totalPosts > 0) {
    items.push(li("Flashing", totalPosts, 0, RATES.flashing));
  }

  // ── FASTENERS ──
  const totalPanels = p1Qty + p2Qty;
  if (totalPanels > 0) {
    items.push(li("Lag Screws",           totalPanels, 0, RATES.lag_screw));
    items.push(li("#14x1 Colored Screws", totalPanels, 0, RATES.screw_14x1_colored, "", inp.colorPostsBeam));
    const panScrewQty = Math.ceil(totalPanels * 5.5 / 50) * 50;
    items.push(li("#8x1/2 Pan Color", panScrewQty, 0, RATES.screw_8x0_5_color));
  }

  // ── SPRAY PAINT ──
  if (inp.sprayPaint) {
    items.push(li("Spray Paint Posts/Beam", 1, 0, RATES.spray_paint, "", inp.colorPostsBeam));
  }

  // ── ANCHORS — 2 per post, skip whichever post group is ground-mounted (no anchor needed) ──
  const wedgeAnchorQty = anchorQty(totalPosts, inp.groundAttachment);
  if (wedgeAnchorQty > 0) {
    items.push(li("Wedge Anchors", wedgeAnchorQty, 0, RATES.anchor_wedge));
  }

  // ── SILICONE — combined beam length / 10, rounded up ──
  if (combinedBeamLength > 0) {
    items.push(li("Silicone Clear", Math.ceil(combinedBeamLength / 10), 0, RATES.silicone_clear));
  }

  // ── SHADE BEAM ──
  items.push(...shadeBeamItems(inp.shadeBeamQty, inp.shadeBeamLength, inp.colorPostsBeam));

  // ── PRICING SUMMARY ──
  const misc = inp.misc + deckHeightSurcharge(inp.groundAttachment, inp.deckHeight)
             + groundMountSurcharge(inp.groundAttachment, totalPosts);
  const materialCost = items.reduce((s, i) => s + i.amount, 0);
  const pricing = finalizePricing(materialCost, {
    taxRate: inp.taxRate, discount: inp.discount,
    footings: inp.footings, roofMounts: inp.roofMounts, misc, tearDown: inp.tearDown, markup: inp.markup,
  });
  const totalSqFt =
    (inp.projection1 > 0 ? inp.projection1 * inp.width1 : 0) +
    (inp.projection2 > 0 ? inp.projection2 * inp.width2 : 0);

  return {
    lineItems: items.filter((i) => i.amount !== 0),
    ...pricing,
    costPerSqFt:  totalSqFt > 0 ? pricing.subtotal     / totalSqFt : 0,
    pricePerSqFt: totalSqFt > 0 ? pricing.totalJobSale / totalSqFt : 0,
    totalSqFt,
  };
}
