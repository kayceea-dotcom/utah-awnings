import { RATES } from "./rates";
import type { LineItem, QuoteResult } from "./types";

export type WPanType = "wpan_032" | "duraking_025" | "duraking_032" | "duraking_040";

export interface WPanInputs {
  jobName: string;
  salesman: string;
  projection1: number;
  width1: number;
  projection2: number;
  width2: number;
  panelType: WPanType;
  beamLength1: number;
  beamLength2: number;
  beamType1: string;
  beamType2: string;
  hangerType: string;
  gutterType: string;
  posts1: number;
  postHeight1: number;
  posts2: number;
  postHeight2: number;
  colorPans: string;
  colorGutterFascia: string;
  colorPostsBeam: string;
  downspouts: number;
  sprayPaint: boolean;
  fanBeamQty: number;
  fanBeamLength: number;
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

function nextStockLength(ft: number): number {
  if (ft <= 16) return 16;
  if (ft <= 20) return 20;
  return 24;
}

function panelRate(type: WPanType): number {
  switch(type) {
    case "duraking_025": return RATES.duraking_025_ft;
    case "duraking_032": return RATES.duraking_032_ft;
    case "duraking_040": return RATES.duraking_040_ft;
    default: return RATES.wpan_sqft;
  }
}

export function calcWPan(inp: WPanInputs): QuoteResult {
  const items: LineItem[] = [];

  // ── PANELS ──
  // W-Pan: 2ft wide panels, priced per sq ft
  // qty = ceil(width/2), amount = qty * projection * rate
  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / 2) : 0;
  const p2Qty = inp.projection2 > 0 ? Math.ceil(inp.width2 / 2) : 0;
  const rate = panelRate(inp.panelType);

  if (p1Qty > 0) {
    items.push(li("W-Pan Panel #1", p1Qty, inp.projection1, rate, "sq ft", inp.colorPans));
  }
  if (p2Qty > 0) {
    items.push(li("W-Pan Panel #2", p2Qty, inp.projection2, rate, "sq ft", inp.colorPans));
  }

  // ── HANGER ──
  const hangerLen = inp.beamLength1 > 0 ? inp.beamLength1 + 1.5 : 0;
  const hangerRate = inp.hangerType === "a_rail" ? RATES.hanger_a_rail_ft : RATES.hanger_roll_form_ft;
  if (hangerLen > 0) {
    items.push(li("Hanger 2.5in", 1, hangerLen, hangerRate, "", inp.colorPans));
  }

  // ── GUTTER ──
  const gutterStockLen = nextStockLength(inp.beamLength1 + 1.5);
  if (inp.gutterType === "roll_form") {
    items.push(li("Roll Form Gutter", 1, inp.beamLength1 + 1.5, RATES.gutter_roll_form_ft, "", inp.colorGutterFascia));
  } else {
    items.push(li("Extruded Gutter 2.5in", 1, gutterStockLen, RATES.gutter_extruded_ft, "", inp.colorGutterFascia));
    const fasciaStock = nextStockLength(inp.projection1);
    items.push(li("Extruded Side Fascia", 2, fasciaStock, RATES.fascia_extruded_2x6_ft, "", inp.colorGutterFascia));
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

  if (inp.beamLength1 > 0) {
    items.push(li("Beam #1 (" + inp.beamType1 + ")", 1, inp.beamLength1, beamRate(inp.beamType1), "", inp.colorPostsBeam));
    const steelStock = nextStockLength(inp.beamLength1 + 1.5);
    items.push(li("Steel Insert #1", 1, steelStock, steelRate(inp.beamType1)));
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam #2 (" + inp.beamType2 + ")", 1, inp.beamLength2, beamRate(inp.beamType2), "", inp.colorPostsBeam));
    const steelStock2 = nextStockLength(inp.beamLength2 + 1.5);
    items.push(li("Steel Insert #2", 1, steelStock2, steelRate(inp.beamType2)));
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
  items.push(li("Gutter Dams", inp.downspouts * 2, 0, RATES.gutter_dam));

  // ── DOWNSPOUTS ──
  if (inp.downspouts > 0) {
    items.push(li("Downspouts 2x3 10ft",  inp.downspouts,     0, RATES.downspout_2x3_10, "", inp.colorGutterFascia));
    items.push(li("Elbows 2x3",           inp.downspouts * 3, 0, RATES.elbow_2x3,        "", inp.colorGutterFascia));
    items.push(li("Dropouts",             inp.downspouts,     0, RATES.dropout));
    items.push(li("Downspout Straps",     inp.downspouts * 2, 0, RATES.downspout_strap,  "", inp.colorGutterFascia));
  }

  // ── FLASHING ──
  if (totalPosts > 0) {
    items.push(li("Flashing", totalPosts, 0, RATES.flashing));
  }

  // ── FASTENERS ──
  const totalPanels = p1Qty + p2Qty;
  if (totalPanels > 0) {
    items.push(li("Lag Screws",            totalPanels, 0, RATES.lag_screw));
    items.push(li("#14x1 Colored Screws",  totalPanels, 0, RATES.screw_14x1_colored,  "", inp.colorPostsBeam));
    items.push(li("#14x1 Washered Screws", totalPanels, 0, RATES.screw_14x1_washered, "", inp.colorPostsBeam));
    const panScrewQty = Math.ceil(totalPanels * 5.5 / 50) * 50;
    items.push(li("#8x1/2 Pan Color",  panScrewQty, 0, RATES.screw_8x0_5_color,    "", inp.colorPans));
    items.push(li("#8x1/2 Extruded",   panScrewQty, 0, RATES.screw_8x0_5_extruded, "", inp.colorPostsBeam));
  }

  // ── FOAM GASKET ──
  if (inp.beamLength1 > 0) {
    items.push(li("Foam Gasket", 1, gutterStockLen, RATES.foam_gasket_ft));
  }

  // ── ANCHORS ──
  if (totalPosts > 0) {
    items.push(li("Wedge Anchors", totalPosts * 2, 0, RATES.anchor_wedge));
  }

  // ── BEAM END CAPS ──
  if (inp.beamLength1 > 0) {
    items.push(li("Beam End Caps #1", 2, 0, RATES.endcap_3x3, "", inp.colorPostsBeam));
  }
  if (inp.beamLength2 > 0) {
    items.push(li("Beam End Caps #2", 2, 0, RATES.endcap_3x3, "", inp.colorPostsBeam));
  }

  // ── SILICONE ──
  if (inp.beamLength1 > 0) {
    items.push(li("Silicone Clear", Math.ceil(inp.beamLength1 / 10), 0, RATES.silicone_clear));
  }

  // ── PAN CLIPS ──
  if (p1Qty > 0) {
    items.push(li("Pan Clips", Math.ceil(p1Qty / 4), 0, RATES.pan_clip));
  }

  // ── FAN BEAM ──
  if (inp.fanBeamQty > 0) {
    items.push(li("Fan Beam",     inp.fanBeamQty, inp.fanBeamLength, RATES.fan_beam_ft));
    items.push(li("Fan Beam Cap", inp.fanBeamQty, inp.fanBeamLength, RATES.fan_beam_cap_ft, "", "Match Top Color"));
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
