import { RATES } from "./rates";
import type { LineItem, QuoteResult } from "./types";

export type IRPType = "lrp_3_032" | "lrp_4_032";

export interface IRPInputs {
  jobName: string;
  salesman: string;
  projection1: number;
  width1: number;
  projection2: number;
  width2: number;
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
  downspouts: number;
  sprayPaint: boolean;
  priceIncrease: number;
  footings: number;
  roofMounts: number;
  misc: number;
  markup: number;
  taxRate: number;
}

function li(
  name: string, qty: number, length: number, rate: number,
  unit = "", color = ""
): LineItem {
  return { name, qty, length, unit, rate, amount: qty * (length || 1) * rate, color };
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

  // ── PANELS — IRP/LRP is 4ft wide, priced per sq ft. Length is each panel's
  // own area (4ft x projection), not just the projection, so qty x length x
  // rate comes out to the real total square footage x $/sqft. ──
  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / 4) : 0;
  const p2Qty = inp.projection2 > 0 ? Math.ceil(inp.width2 / 4) : 0;

  if (p1Qty > 0) {
    items.push(li("LRP Panel #1 (" + (is4in ? "4.25in" : "3in") + ")", p1Qty, 4 * inp.projection1, panelRate, "sq ft"));
  }
  if (p2Qty > 0) {
    items.push(li("LRP Panel #2 (" + (is4in ? "4.25in" : "3in") + ")", p2Qty, 4 * inp.projection2, panelRate, "sq ft"));
  }

  // ── HANGER ──
  if (inp.beamLength1 > 0) {
    const hangerRate = lrpHangerRate(inp.panelType, inp.beamLength1);
    items.push(li("LRP Hanger #1", 1, 0, hangerRate));
  }
  if (inp.beamLength2 > 0) {
    const hangerRate2 = lrpHangerRate(inp.panelType, inp.beamLength2);
    items.push(li("LRP Hanger #2", 1, 0, hangerRate2));
  }

  // ── GUTTER ──
  if (inp.beamLength1 > 0) {
    const gutterRate = lrpGutterRate(inp.panelType, inp.beamLength1);
    items.push(li("LRP Gutter #1", 1, 0, gutterRate));
  }

  // ── SIDE FASCIA — 2 sides ──
  if (inp.projection1 > 0) {
    const fasciaRate = lrpFasciaRate(inp.panelType, inp.projection1);
    items.push(li("LRP Side Fascia", 2, 0, fasciaRate));
  }

  // ── DRIP EDGE ──
  if (inp.beamLength1 > 0) {
    items.push(li("LRP Drip Edge", 1, 0, RATES.lrp_drip_edge_24));
  }

  // ── BEAMS ──
  function beamRate(beamType: string): number {
    if (beamType === "3x3") return RATES.beam_3x3;
    return RATES.beam_3x8;
  }
  function steelRate(beamType: string): number {
    if (beamType === "3x3") return RATES.steel_3x3_g_beam_ft;
    return RATES.steel_3x8_14ga_ft;
  }
  function nextStockLength(ft: number): number {
    if (ft <= 16) return 16;
    if (ft <= 20) return 20;
    return 24;
  }

  if (inp.beamLength1 > 0) {
    items.push(li("Beam #1 (" + inp.beamType1 + ")", 1, inp.beamLength1, beamRate(inp.beamType1), "", inp.colorPostsBeam));
    items.push(li("Steel Insert #1", 1, nextStockLength(inp.beamLength1 + 1.5), steelRate(inp.beamType1)));
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam #2 (" + inp.beamType2 + ")", 1, inp.beamLength2, beamRate(inp.beamType2), "", inp.colorPostsBeam));
    items.push(li("Steel Insert #2", 1, nextStockLength(inp.beamLength2 + 1.5), steelRate(inp.beamType2)));
  }

  // ── POSTS ──
  const totalPosts = inp.posts1 + inp.posts2;
  if (inp.posts1 > 0) {
    items.push(li("3x3 Post Sleeve #1", inp.posts1, inp.postHeight1, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
    items.push(li("3x3 Steel Post #1",  inp.posts1, inp.postHeight1, RATES.post_3x3_steel_ft));
  }
  if (inp.posts2 > 0) {
    items.push(li("3x3 Post Sleeve #2", inp.posts2, inp.postHeight2, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
    items.push(li("3x3 Steel Post #2",  inp.posts2, inp.postHeight2, RATES.post_3x3_steel_ft));
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

  // ── ANCHORS ──
  if (totalPosts > 0) {
    items.push(li("Wedge Anchors", totalPosts * 2, 0, RATES.anchor_wedge));
  }

  // ── SILICONE ──
  if (inp.beamLength1 > 0) {
    items.push(li("Silicone Clear", Math.ceil(inp.beamLength1 / 10), 0, RATES.silicone_clear));
  }

  // ── PRICING SUMMARY ──
  const materialCost        = items.reduce((s, i) => s + i.amount, 0);
  const taxes               = materialCost * inp.taxRate;
  const priceIncreaseDollar = (materialCost + taxes) * inp.priceIncrease;
  const totalMaterials      = materialCost + taxes + priceIncreaseDollar;
  const subtotal            = totalMaterials + inp.footings + inp.roofMounts + inp.misc;
  const preSaleTotal        = subtotal * inp.markup;
  const ccFee               = preSaleTotal * RATES.CC_FEE_RATE / (1 - RATES.CC_FEE_RATE);
  const totalJobSale        = preSaleTotal + ccFee;
  const totalProfit         = totalJobSale - subtotal;
  const totalSqFt           =
    (inp.projection1 > 0 ? inp.projection1 * inp.width1 : 0) +
    (inp.projection2 > 0 ? inp.projection2 * inp.width2 : 0);

  return {
    lineItems: items.filter((i) => i.amount !== 0),
    materialCost, taxes,
    priceIncrease: priceIncreaseDollar,
    totalMaterials,
    footings:   inp.footings,
    roofMounts: inp.roofMounts,
    misc:       inp.misc,
    subtotal, markup: inp.markup, ccFee,
    totalJobSale, totalProfit,
    costPerSqFt:  totalSqFt > 0 ? subtotal     / totalSqFt : 0,
    pricePerSqFt: totalSqFt > 0 ? totalJobSale / totalSqFt : 0,
    totalSqFt,
  };
}
