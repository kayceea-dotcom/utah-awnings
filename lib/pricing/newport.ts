import { RATES } from "./rates";
import type { NewportInputs, LineItem, QuoteResult } from "./types";

function li(
  name: string, qty: number, length: number, rate: number,
  unit = "", color = ""
): LineItem {
  return { name, qty, length, unit, rate, amount: qty * (length || 1) * rate, color };
}

function panelRate(type: string): number {
  return (RATES as Record<string, number>)[type] ?? 0;
}

function nextStockLength(ft: number): number {
  if (ft <= 16) return 16;
  if (ft <= 20) return 20;
  return 24;
}

export function calcNewport(inp: NewportInputs): QuoteResult {
  const items: LineItem[] = [];

  const hasWrap = inp.wrapType === "3x8" || inp.wrapType === "2x6";
  const is3x8 = inp.wrapType === "3x8";
  const wrapRate     = is3x8 ? RATES.beam_3x8            : RATES.post_plate_2x6_ft;
  const sideRate     = is3x8 ? RATES.sideplate_3x8_ft    : RATES.sideplate_2x6_ft;
  const fasciaRate   = is3x8 ? RATES.fascia_extruded_3x8_ft : RATES.fascia_extruded_2x6_ft;
  const endcapRate   = is3x8 ? RATES.endcap_3x8          : RATES.endcap_2x6;
  const insideBrktRate = is3x8 ? RATES.inside_brkt_3x8   : RATES.inside_brkt_2x6;
  const miterCapRate = is3x8 ? RATES.mitered_cap_3x8     : RATES.mitered_cap_2x6;
  const rafterRate   = is3x8 ? RATES.rafter_tail_3x8_ft  : RATES.rafter_tail_2x6_ft;

  // ── PANELS ──
  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / 0.5) : 0;
  const p2Qty = inp.projection2 > 0 ? Math.ceil(inp.width2 / 0.5) : 0;

  if (p1Qty > 0) {
    items.push(li("Panel #1", p1Qty, inp.projection1, panelRate(inp.panelType1), "ft", inp.colorPans));
  }
  if (p2Qty > 0 && inp.panelType2) {
    items.push(li("Panel #2", p2Qty, inp.projection2, panelRate(inp.panelType2), "ft", inp.colorPans));
  }

  // ── HANGER ──
  const hangerLen = inp.beamLength1 > 0 ? inp.beamLength1 + 1.5 : 0;
  const hangerRate = inp.hangerType === "a_rail" ? RATES.hanger_a_rail_ft : RATES.hanger_roll_form_ft;
  if (hangerLen > 0) {
    items.push(li("Hanger", 1, hangerLen, hangerRate, "", inp.colorPans));
  }

  // ── GUTTER ──
  const gutterStockLen = nextStockLength(inp.beamLength1 + 1.5);
  if (inp.gutterType === "roll_form") {
    items.push(li("Roll Form Gutter", 1, inp.beamLength1 + 1.5, RATES.gutter_roll_form_ft, "", inp.colorGutterFascia));
  } else {
    items.push(li("Extruded Gutter", 1, gutterStockLen, RATES.gutter_extruded_ft, "", inp.colorGutterFascia));
  }

  // ── EXTRUDED SIDE FASCIA — only with extruded gutter; length tied to PROJECTION (depth) ──
  if (inp.gutterType === "extruded" && inp.projection1 > 0) {
    const fasciaLen = nextStockLength(inp.projection1);
    items.push(li("Extruded Side Fascia", 2, fasciaLen, fasciaRate, "", inp.colorGutterFascia));
  }

  // ── FRONT PLATE — only with wrap kit + extruded gutter; exact length = width + 1 ──
  if (hasWrap && inp.gutterType === "extruded" && inp.width1 > 0) {
    const frontPlateLen = inp.width1 + 1;
    items.push(li("Front Plate Gutter", 1, frontPlateLen, wrapRate, "", inp.colorGutterFascia));
  }

  // ── SIDE PLATES (structural, cut one side) — only with wrap kit; length = projection + 2ft ──
  if (hasWrap && inp.projection1 > 0) {
    const sideLen = inp.projection1 + 2;
    items.push(li("Sideplates Cut One Side", 2, sideLen, sideRate, "", inp.colorPostsBeam));
  }

  // ── BEAMS — rate depends on selected beam type ──
  function beamMaterialRate(beamType: string): number {
    if (beamType === "3x3") return RATES.beam_3x3;
    return RATES.beam_3x8; // 3x8, 4_i_beam, 7_i_beam all use 3x8 wrap rate for now
  }
  function steelInsertRate(beamType: string): number {
    if (beamType === "3x3") return RATES.steel_3x3_g_beam_ft;
    return RATES.steel_3x8_14ga_ft;
  }

  if (inp.beamLength1 > 0) {
    items.push(li("Beam #1 (" + inp.beamType1 + ")", 1, inp.beamLength1, beamMaterialRate(inp.beamType1), "", inp.colorPostsBeam));
    const steelStock = nextStockLength(inp.beamLength1 + 1.5);
    items.push(li("Steel Insert #1", 1, steelStock, steelInsertRate(inp.beamType1)));
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam #2 (" + inp.beamType2 + ")", 1, inp.beamLength2, beamMaterialRate(inp.beamType2), "", inp.colorPostsBeam));
    const steelStock2 = nextStockLength(inp.beamLength2 + 1.5);
    items.push(li("Steel Insert #2", 1, steelStock2, steelInsertRate(inp.beamType2)));
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

  // ── POST PLATES — only with wrap kit; qty=posts*2, length=postHeight+1 ──
  if (hasWrap && inp.posts1 > 0) {
    items.push(li("Post Plates #1 (Mitered)", inp.posts1 * 2, inp.postHeight1 + 1, wrapRate, "", inp.colorPostsBeam));
  }
  if (hasWrap && inp.posts2 > 0) {
    items.push(li("Post Plates #2 (Mitered)", inp.posts2 * 2, inp.postHeight2 + 1, wrapRate, "", inp.colorPostsBeam));
  }

  // ── MITERED CAPS — only with wrap kit; totalPosts * 2, uses endcap-style rate ──
  if (hasWrap && totalPosts > 0) {
    items.push(li("Mitered Caps", totalPosts * 2, 0, miterCapRate, "", inp.colorPostsBeam));
  }

  // ── RAFTER TAILS — only with wrap kit, spaced every ~2ft along width ──
  let rtQty = 0;
  if (hasWrap && inp.rafterTails && inp.width1 > 0) {
    rtQty = Math.round(inp.width1 / 2);
    items.push(li("Rafter Tails", rtQty, 0, rafterRate, "", inp.colorPostsBeam));
  }

  // ── INSIDE BRACKETS — only with wrap kit, same spacing as rafter tails plus 2 ──
  if (hasWrap && inp.width1 > 0) {
    const spacingQty = Math.round(inp.width1 / 2);
    const insideBrktQty = spacingQty + 2;
    items.push(li("Inside Brackets", insideBrktQty, 0, insideBrktRate));
  }

  // ── PLUGS — only with wrap kit; roughly panels*0.7 + 1 ──
  if (hasWrap && p1Qty > 0) {
    const plugQty = Math.round(p1Qty * 0.7) + 1;
    items.push(li("Plugs", plugQty, 0, RATES.plug_5_8));
  }

  // ── END CAPS — only with wrap kit; same spacing as rafter tails plus 2 ──
  if (hasWrap && inp.width1 > 0) {
    const spacingQty = Math.round(inp.width1 / 2);
    const endCapQty = spacingQty + 2;
    items.push(li("End Caps", endCapQty, 0, endcapRate, "", inp.colorPostsBeam));
  }

  // ── FOAM INSERTS — posts * 2 ──
  if (totalPosts > 0) {
    items.push(li("Foam Inserts 2x6", totalPosts * 2, 0, RATES.foam_insert_2x6, "ea"));
  }

  // ── GUTTER SPLICE — only when extruded gutter and beam+1.5 exceeds max stock length (24ft) ──
  if (inp.gutterType === "extruded" && inp.beamLength1 + 1.5 > 24) {
    items.push(li("Gutter Splice", 1, 0, RATES.gutter_splice));
  }

  // ── POST BRACKETS — posts * 2 ──
  if (totalPosts > 0) {
    items.push(li("Post Brackets", totalPosts * 2, 0, RATES.post_brkt));
  }

  // ── GUTTER DAMS — downspouts * 2 ──
  items.push(li("Gutter Dams", inp.downspouts * 2, 0, RATES.gutter_dam));

  // ── DOWNSPOUTS ──
  if (inp.downspouts > 0) {
    items.push(li("Downspouts 2x3 10ft",  inp.downspouts,     0, RATES.downspout_2x3_10, "", inp.colorGutterFascia));
    items.push(li("Elbows 2x3",           inp.downspouts * 3, 0, RATES.elbow_2x3,        "", inp.colorGutterFascia));
    items.push(li("Dropouts",             inp.downspouts,     0, RATES.dropout));
    items.push(li("Downspout Straps",     inp.downspouts * 2, 0, RATES.downspout_strap,  "", inp.colorGutterFascia));
  }

  // ── FLASHING — totalPosts ──
  if (totalPosts > 0) {
    items.push(li("Flashing", totalPosts, 0, RATES.flashing));
  }

  // ── LAGS — total panels ──
  const totalPanels = p1Qty + p2Qty;
  if (totalPanels > 0) {
    items.push(li("Lag Screws",            totalPanels, 0, RATES.lag_screw));
    items.push(li("#14x1 Colored Screws",  totalPanels, 0, RATES.screw_14x1_colored,  "", inp.colorPostsBeam));
    items.push(li("#14x1 Washered Screws", totalPanels, 0, RATES.screw_14x1_washered, "", inp.colorPostsBeam));
  }

  // ── PAN SCREWS — ~panels * 6.25, rounded to nearest 50 ──
  const panScrewQty = Math.round(totalPanels * 6.25 / 50) * 50;
  if (panScrewQty > 0) {
    items.push(li("#8x1/2 Pan Color",  panScrewQty, 0, RATES.screw_8x0_5_color,    "", inp.colorPans));
    items.push(li("#8x1/2 Extruded",   panScrewQty, 0, RATES.screw_8x0_5_extruded, "", inp.colorPostsBeam));
  }

  // ── SPRAY PAINT ──
  if (inp.sprayPaint) {
    items.push(li("Spray Paint Pan",        1, 0, RATES.spray_paint, "", inp.colorPans));
    items.push(li("Spray Paint Posts/Beam", 1, 0, RATES.spray_paint, "", inp.colorPostsBeam));
  }

  // ── FOAM GASKET — length = stock length matching gutter/steel ──
  if (inp.beamLength1 > 0) {
    items.push(li("Foam Gasket", 1, gutterStockLen, RATES.foam_gasket_ft));
  }

  // ── ANCHORS ──
  if (totalPosts > 0) {
    items.push(li("Wedge Anchors", totalPosts * 2, 0, RATES.anchor_wedge));
  }

  // ── BEAM END CAPS — uses wrap-type endcap rate ──
  if (inp.beamLength1 > 0) {
    items.push(li("Beam End Caps #1", 2, 0, endcapRate, "", inp.colorPostsBeam));
  }
  if (inp.beamLength2 > 0) {
    items.push(li("Beam End Caps #2", 2, 0, endcapRate, "", inp.colorPostsBeam));
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
