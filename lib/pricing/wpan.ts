import { RATES } from "./rates";
import { CATALOG_BY_KEY } from "./catalog";
import type { LineItem, QuoteResult, HouseAttachmentType, GroundAttachmentType, EndCut, MountStyle } from "./types";
import {
  li, nextStockLength, rollFormGutterStockLength, wrapKitRates, wrapKitFinishingItems, wrapKitRafterItems, fasciaQtyLen,
  anchorQty, deckHeightSurcharge, postMaterialLength, groundMountSurcharge, finalizePricing, shadeBeamItems, beamTypeLabel,
  END_CUT_LABELS,
} from "./shared";

export type WPanType = "wpan_032" | "duraking_025" | "duraking_032" | "duraking_040";

export interface WPanInputs {
  jobName: string;
  salesman: string;
  housePhotoUrl: string;
  projection1: number;
  width1: number;
  projection2: number;
  width2: number;
  panelType: WPanType;
  beamLength1: number;
  beamLength2: number;
  beamQty1: number;
  beamQty2: number;
  beamType1: string;
  beamType2: string;
  beamEndCut1: EndCut;
  beamEndCut2: EndCut | "";
  jogType: string;
  hangerType: string;
  gutterType: string;
  posts1: number;
  postHeight1: number;
  posts2: number;
  postHeight2: number;
  colorPans: string;
  colorGutterFascia: string;
  colorPostsBeam: string;
  wrapType: string;
  rafterTails: boolean;
  downspouts: number;
  downspoutSide: "left" | "right";
  sprayPaint: boolean;
  houseAttachment: HouseAttachmentType;
  groundAttachment: GroundAttachmentType;
  deckHeight: number;
  mountStyle: MountStyle;
  rearBeamType: string;
  rearBeamEndCut: EndCut | "";
  rearBeamLength: number;
  rearPosts: number;
  rearPostHeight: number;
  fanBeamQty: number;
  fanBeamLength: number;
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

function panelRate(type: WPanType): number {
  switch(type) {
    case "duraking_025": return RATES.duraking_025_ft;
    case "duraking_032": return RATES.duraking_032_ft;
    case "duraking_040": return RATES.duraking_040_ft;
    default: return RATES.wpan_sqft;
  }
}

// WPanType values don't exactly match their CATALOG keys (e.g. "duraking_025" vs
// catalog's "duraking_025_ft"), so map to the catalog key before looking up the label.
function panelCatalogKey(type: WPanType): string {
  switch(type) {
    case "duraking_025": return "duraking_025_ft";
    case "duraking_032": return "duraking_032_ft";
    case "duraking_040": return "duraking_040_ft";
    default: return "wpan_sqft";
  }
}

function panelLabel(type: WPanType): string {
  return CATALOG_BY_KEY[panelCatalogKey(type)]?.label ?? type;
}

// Tri-V panels are 2ft wide; DuraKing panels are 1ft wide regardless of
// gauge - quantity must divide by the real panel width, not a fixed 2ft
// assumption, or DuraKing comes out at half the panels actually needed.
function panelWidthFt(type: WPanType): number {
  return type === "wpan_032" ? 2 : 1;
}

// Only 3x8/double-3x8 beams take the selected end-cut treatment (3x3/I-beam don't).
function beamLabel(type: string, endCut: string): string {
  const takesEndCut = type === "3x8" || type === "3x8_no_insert";
  if (!takesEndCut || !endCut) return beamTypeLabel(type);
  return beamTypeLabel(type) + ", " + (END_CUT_LABELS[endCut] ?? endCut);
}

export function calcWPan(inp: WPanInputs): QuoteResult {
  const items: LineItem[] = [];

  // ── PANELS ──
  // Priced per sq ft - qty = ceil(width / real panel width), amount = qty * projection * rate
  const panelWidth = panelWidthFt(inp.panelType);
  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / panelWidth) : 0;
  const p2Qty = inp.projection2 > 0 ? Math.ceil(inp.width2 / panelWidth) : 0;
  const rate = panelRate(inp.panelType);

  if (p1Qty > 0) {
    items.push(li("V-Panel #1 (" + panelLabel(inp.panelType) + ")", p1Qty, inp.projection1, rate, "sq ft", inp.colorPans));
  }
  if (p2Qty > 0) {
    items.push(li("V-Panel #2 (" + panelLabel(inp.panelType) + ")", p2Qty, inp.projection2, rate, "sq ft", inp.colorPans));
  }

  // ── HANGER — skipped when freestanding, replaced by a rear beam + posts below ──
  const isFreestanding = inp.mountStyle === "freestanding";
  // For two-run jobs hanger spans combined width
  const totalWidth = inp.width1 + (inp.width2 > 0 ? inp.width2 : 0);
  const hangerLen = totalWidth > 0 ? totalWidth + 1.5 : 0;
  const hangerRate = inp.hangerType === "a_rail" ? RATES.hanger_a_rail_ft : RATES.hanger_roll_form_ft;
  if (!isFreestanding && hangerLen > 0) {
    items.push(li("Hanger 2.5in", 1, hangerLen, hangerRate, "", inp.colorPans));
  }

  // ── GUTTER ──
  // Gutter spans combined width, rounded to next stock length
  const gutterStockLen = nextStockLength(totalWidth + 1.5);
  const maxProjection = Math.max(inp.projection1, inp.projection2 || 0);
  if (inp.gutterType === "roll_form") {
    items.push(li("Roll Form Gutter", 1, rollFormGutterStockLength(totalWidth + 1.5), RATES.gutter_roll_form_ft, "", inp.colorGutterFascia));
    // Roll form gutter uses a 2x6 board as its side fascia, independent of
    // wrap kit selection - needed regardless of whether a 2x6/3x8 wrap was chosen.
    // Gets an extra 1ft past the projection to cut to fit on site.
    const { qty: rollFasciaQty, length: rollFasciaStockLen } = fasciaQtyLen(maxProjection, 1);
    items.push(li("Side Fascia (2x6)", rollFasciaQty, rollFasciaStockLen, RATES.fascia_extruded_2x6_ft, "", inp.colorGutterFascia));
  } else {
    items.push(li("Extruded Gutter 2.5in", 1, gutterStockLen, RATES.gutter_extruded_ft, "", inp.colorGutterFascia));
    const { qty: fasciaQty, length: fasciaStockLen } = fasciaQtyLen(maxProjection);
    items.push(li("Extruded Side Fascia", fasciaQty, fasciaStockLen, RATES.fascia_extruded_2x6_ft, "", inp.colorGutterFascia));
  }

  // ── WRAP KIT — front plate gutter, rafter tails, inside/outside brackets ──
  const hasWrap = inp.wrapType === "3x8" || inp.wrapType === "2x6";
  const wrapRates = wrapKitRates(inp.wrapType);
  if (hasWrap) {
    items.push(...wrapKitRafterItems(wrapRates, {
      gutterType: inp.gutterType, width1: inp.width1, rafterTails: inp.rafterTails,
      colorGutterFascia: inp.colorGutterFascia, colorPostsBeam: inp.colorPostsBeam,
      endCut: inp.beamEndCut1,
    }));
  }

  // ── BEAMS ──
  function beamRate(beamType: string): number {
    if (beamType === "3x3") return RATES.beam_3x3;
    return RATES.beam_3x8;
  }
  function steelRate(beamType: string): number {
    if (beamType === "3x3") return RATES.steel_3x3_g_beam_ft;
    if (beamType === "3x8_no_insert") return 0;
    return RATES.steel_3x8_14ga_ft;
  }

  if (inp.beamLength1 > 0) {
    const bq1 = inp.beamQty1 || 1;
    items.push(li("Beam #1 (" + beamLabel(inp.beamType1, inp.beamEndCut1) + ")", bq1, inp.beamLength1, beamRate(inp.beamType1), "", inp.colorPostsBeam));
    const steelRate1 = steelRate(inp.beamType1);
    if (steelRate1 > 0) {
      items.push(li("Steel Insert #1", bq1, nextStockLength(inp.beamLength1), steelRate1));
    }
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    const bq2 = inp.beamQty2 || 1;
    items.push(li("Beam #2 (" + beamLabel(inp.beamType2, inp.beamEndCut2) + ")", bq2, inp.beamLength2, beamRate(inp.beamType2), "", inp.colorPostsBeam));
    const steelRate2 = steelRate(inp.beamType2);
    if (steelRate2 > 0) {
      items.push(li("Steel Insert #2", bq2, nextStockLength(inp.beamLength2), steelRate2));
    }
  }

  // ── REAR BEAM — freestanding only, replaces the house-side Hanger ──
  if (isFreestanding && inp.rearBeamLength > 0) {
    items.push(li("Beam Rear (" + beamLabel(inp.rearBeamType, inp.rearBeamEndCut) + ")", 1, inp.rearBeamLength, beamRate(inp.rearBeamType), "", inp.colorPostsBeam));
    const steelRateRear = steelRate(inp.rearBeamType);
    if (steelRateRear > 0) {
      items.push(li("Steel Insert Rear", 1, nextStockLength(inp.rearBeamLength), steelRateRear));
    }
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

  // ── WRAP KIT — post plates, sideplates, mitered caps, foam inserts, end caps, plugs ──
  if (hasWrap) {
    items.push(...wrapKitFinishingItems(wrapRates, {
      posts1: inp.posts1, postHeight1: inp.postHeight1,
      posts2: inp.posts2, postHeight2: inp.postHeight2,
      postsRear: rearPosts, postHeightRear: inp.rearPostHeight,
      projection1: inp.projection1, width1: inp.width1, panelQty1: p1Qty,
      colorPostsBeam: inp.colorPostsBeam,
      endCut: inp.beamEndCut1,
    }));
  }

  // ── GUTTER SPLICE — always include for W-Pan ──
  items.push(li("Gutter Splice", 1, 0, RATES.gutter_splice));

  // ── SPRAY PAINT ──
  if (inp.sprayPaint) {
    items.push(li("Spray Paint Pan",        1, 0, RATES.spray_paint, "", inp.colorPans));
    items.push(li("Spray Paint Posts/Beam", 1, 0, RATES.spray_paint, "", inp.colorPostsBeam));
  }

  // ── POST BRACKETS ──
  if (totalPosts > 0) {
    items.push(li("Post Brackets", totalPosts * 2, 0, RATES.post_brkt));
  }

  // ── GUTTER DAMS ──
  items.push(li("Gutter Dams", inp.downspouts * 2 + 2, 0, RATES.gutter_dam));

  // ── DOWNSPOUTS ──
  if (inp.downspouts > 0) {
    items.push(li("Downspouts 2x3 10ft",  inp.downspouts,     0, RATES.downspout_2x3_10, "", inp.colorGutterFascia));
    items.push(li("Elbows 2x3",           inp.downspouts * 3, 0, RATES.elbow_2x3,        "", inp.colorGutterFascia));
    items.push(li("Dropouts",             inp.downspouts,     0, RATES.dropout));
    items.push(li("Downspout Straps",     inp.downspouts * 2, 0, RATES.downspout_strap,  "", inp.colorGutterFascia));
  }

  // ── FLASHING — wall attachment posts only (posts1) ──
  if (inp.posts1 > 0) {
    items.push(li("Flashing", inp.posts1, 0, RATES.flashing));
  }

  // ── FASTENERS ──
  const totalPanels = p1Qty + p2Qty;
  if (totalPanels > 0) {
    const lagQty = totalPanels * 4;
    items.push(li("Lag Screws",            lagQty, 0, RATES.lag_screw));
    items.push(li("#14x1 Colored Screws",  lagQty, 0, RATES.screw_14x1_colored,  "", inp.colorPostsBeam));
    items.push(li("#14x1 Washered Screws", lagQty, 0, RATES.screw_14x1_washered, "", inp.colorPostsBeam));
    const panScrewQty = Math.ceil(totalPanels * 20 / 50) * 50;
    items.push(li("#8x1/2 Pan Color",  panScrewQty, 0, RATES.screw_8x0_5_color,    "", inp.colorPans));
    items.push(li("#8x1/2 Extruded",   panScrewQty, 0, RATES.screw_8x0_5_extruded, "", inp.colorPostsBeam));
  }

  // ── FOAM GASKET — spans combined width ──
  if (inp.beamLength1 > 0) {
    const gasketLen = inp.beamLength1 + (inp.beamLength2 > 0 ? inp.beamLength2 : 0) + 1.5;
    items.push(li("Foam Gasket", 1, gasketLen, RATES.foam_gasket_ft));
  }

  // ── ANCHORS ──
  const wedgeAnchorQty = anchorQty(totalPosts, inp.groundAttachment);
  if (wedgeAnchorQty > 0) {
    items.push(li("Wedge Anchors", wedgeAnchorQty, 0, RATES.anchor_wedge));
  }

  // ── BEAM END CAPS ──
  if (inp.beamLength1 > 0) {
    items.push(li("Beam End Caps #1", 2, 0, RATES.endcap_3x3, "", inp.colorPostsBeam));
  }
  if (inp.beamLength2 > 0) {
    items.push(li("Beam End Caps #2", 2, 0, RATES.endcap_3x3, "", inp.colorPostsBeam));
  }
  if (isFreestanding && inp.rearBeamLength > 0) {
    items.push(li("Beam End Caps Rear", 2, 0, RATES.endcap_3x3, "", inp.colorPostsBeam));
  }

  // ── SILICONE — based on combined beam length ──
  if (inp.beamLength1 > 0) {
    const combinedBeam = inp.beamLength1 + (inp.beamLength2 > 0 ? inp.beamLength2 : 0);
    items.push(li("Silicone Clear", Math.ceil(combinedBeam / 10), 0, RATES.silicone_clear));
  }

  // ── PAN CLIPS ──
  if (totalPanels > 0) {
    items.push(li("Pan Clips", Math.ceil(totalPanels / 2), 0, RATES.pan_clip));
  }

  // ── FAN BEAM ──
  if (inp.fanBeamQty > 0) {
    items.push(li("Fan Beam",     inp.fanBeamQty, inp.fanBeamLength, RATES.fan_beam_ft));
    items.push(li("Fan Beam Cap", inp.fanBeamQty, inp.fanBeamLength, RATES.fan_beam_cap_ft, "", "Match Top Color"));
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
