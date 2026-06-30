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

  // 2x6 wrap = 6.59/ft for all wrap pieces, 3x8 wrap = 10.10/ft for all wrap pieces
  const wrapRate     = inp.wrapType === "3x8" ? RATES.beam_3x8 : 6.59;
  const sideRate     = wrapRate;
  const frontRate    = wrapRate;
  const endcapRate   = inp.wrapType === "3x8" ? RATES.endcap_3x8 : RATES.endcap_2x6;
  const insideBrktRate = inp.wrapType === "3x8" ? RATES.inside_brkt_3x8 : RATES.inside_brkt_2x6;
  const miterCapRate = inp.wrapType === "3x8" ? RATES.mitered_cap_3x8 : RATES.mitered_cap_2x6;
  const rafterRate   = wrapRate;

  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / 0.5) : 0;
  const p2Qty = inp.projection2 > 0 ? Math.ceil(inp.width2 / 0.5) : 0;

  if (p1Qty > 0) {
    items.push(li("Panel #1", p1Qty, inp.projection1, panelRate(inp.panelType1), "ft", inp.colorPans));
  }
  if (p2Qty > 0 && inp.panelType2) {
    items.push(li("Panel #2", p2Qty, inp.projection2, panelRate(inp.panelType2), "ft", inp.colorPans));
  }

  const hangerLen = inp.beamLength1 > 0 ? inp.beamLength1 + 1.5 : 0;
  const hangerRate = inp.hangerType === "a_rail" ? RATES.hanger_a_rail_ft : RATES.hanger_roll_form_ft;
  if (hangerLen > 0) {
    items.push(li("Hanger", 1, hangerLen, hangerRate, "", inp.colorPans));
  }

  if (inp.gutterType === "roll_form") {
    const gutterLen = inp.beamLength1 > 0 ? inp.beamLength1 + 1.5 : 0;
    items.push(li("Roll Form Gutter", 1, gutterLen, RATES.gutter_roll_form_ft, "", inp.colorGutterFascia));
  } else {
    const gutterStock = nextStockLength(inp.beamLength1 + 1.5);
    items.push(li("Extruded Gutter", 1, gutterStock, RATES.gutter_extruded_ft, "", inp.colorGutterFascia));
    items.push(li("Extruded Front Plate", 1, gutterStock, frontRate, "", inp.colorGutterFascia));
  }

  if (inp.projection1 > 0) {
    const sideLen = inp.projection1 + 2;
    items.push(li("Side Plates (Cut One Side)", 2, sideLen, sideRate, "", inp.colorPostsBeam));
  }

  if (inp.beamLength1 > 0) {
    items.push(li("Beam #1 (" + inp.beamType1 + ")", 1, inp.beamLength1, RATES.beam_3x8, "", inp.colorPostsBeam));
    const steelStock = nextStockLength(inp.beamLength1 + 1.5);
    items.push(li("Steel Insert #1", 1, steelStock, RATES.steel_3x8_14ga_ft));
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam #2 (" + inp.beamType2 + ")", 1, inp.beamLength2, RATES.beam_3x8, "", inp.colorPostsBeam));
    const steelStock2 = nextStockLength(inp.beamLength2 + 1.5);
    items.push(li("Steel Insert #2", 1, steelStock2, RATES.steel_3x8_14ga_ft));
  }

  const totalPosts = inp.posts1 + inp.posts2;
  if (inp.posts1 > 0) {
    items.push(li("3x3 Post Sleeve #1", inp.posts1, inp.postHeight1, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
    items.push(li("3x3 Steel Post #1",  inp.posts1, inp.postHeight1, RATES.post_3x3_steel_ft));
  }
  if (inp.posts2 > 0) {
    items.push(li("3x3 Post Sleeve #2", inp.posts2, inp.postHeight2, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
    items.push(li("3x3 Steel Post #2",  inp.posts2, inp.postHeight2, RATES.post_3x3_steel_ft));
  }

  if (inp.posts1 > 0) {
    items.push(li("Post Plates #1 (Mitered)", inp.posts1 * 2, inp.postHeight1 + 1, wrapRate, "", inp.colorPostsBeam));
  }
  if (inp.posts2 > 0) {
    items.push(li("Post Plates #2 (Mitered)", inp.posts2 * 2, inp.postHeight2 + 1, wrapRate, "", inp.colorPostsBeam));
  }

  if (totalPosts > 0) {
    items.push(li("Mitered Caps", totalPosts * 2, 0, miterCapRate, "", inp.colorPostsBeam));
  }

  if (inp.rafterTails && inp.width1 > 0) {
    const rtQty = Math.ceil(inp.width1 / 2);
    items.push(li("Rafter Tails", rtQty, 0, rafterRate, "", inp.colorPostsBeam));
  }

  if (inp.width1 > 0) {
    const insideBrktQty = Math.ceil(inp.width1 / 2) + 2;
    items.push(li("Inside Brackets", insideBrktQty, 0, insideBrktRate));
  }

  if (p1Qty > 0) items.push(li("Lock Plugs", p1Qty + 1, 0, RATES.plug_5_8));

  const endCapQty = totalPosts > 0 ? Math.floor(p1Qty / 2) - 1 : 0;
  if (endCapQty > 0) {
    items.push(li("End Caps", endCapQty, 0, endcapRate, "", inp.colorPostsBeam));
  }

  if (totalPosts > 0) {
    items.push(li("Foam Inserts 2x6", totalPosts * 2, 0, RATES.foam_insert_2x6, "ea"));
  }

  if (inp.beamLength1 + 1.5 > 24) {
    items.push(li("Gutter Splice", 1, 0, RATES.gutter_splice));
  }

  if (totalPosts > 0) {
    items.push(li("Post Brackets", totalPosts * 2, 0, RATES.post_brkt));
  }

  items.push(li("Gutter Dams", inp.downspouts * 2, 0, RATES.gutter_dam));

  if (inp.downspouts > 0) {
    items.push(li("Downspouts 2x3 10ft",  inp.downspouts,     0, RATES.downspout_2x3_10, "", inp.colorGutterFascia));
    items.push(li("Elbows 2x3",           inp.downspouts * 3, 0, RATES.elbow_2x3,        "", inp.colorGutterFascia));
    items.push(li("Dropouts",             inp.downspouts,     0, RATES.dropout));
    items.push(li("Downspout Straps",     inp.downspouts * 2, 0, RATES.downspout_strap,  "", inp.colorGutterFascia));
  }

  if (totalPosts > 0) {
    items.push(li("Flashing", totalPosts, 0, RATES.flashing));
  }

  const totalPanels = p1Qty + p2Qty;
  if (totalPanels > 0) {
    items.push(li("Lag Screws",            totalPanels, 0, RATES.lag_screw));
    items.push(li("#14x1 Colored Screws",  totalPanels, 0, RATES.screw_14x1_colored,  "", inp.colorPostsBeam));
    items.push(li("#14x1 Washered Screws", totalPanels, 0, RATES.screw_14x1_washered, "", inp.colorPostsBeam));
  }

  const panScrewQty = Math.ceil(totalPanels * 5.5 / 50) * 50;
  if (panScrewQty > 0) {
    items.push(li("#8x1/2 Pan Color",  panScrewQty, 0, RATES.screw_8x0_5_color,    "", inp.colorPans));
    items.push(li("#8x1/2 Extruded",   panScrewQty, 0, RATES.screw_8x0_5_extruded, "", inp.colorPostsBeam));
  }

  if (inp.sprayPaint) {
    items.push(li("Spray Paint Pan",        1, 0, RATES.spray_paint, "", inp.colorPans));
    items.push(li("Spray Paint Posts/Beam", 1, 0, RATES.spray_paint, "", inp.colorPostsBeam));
  }

  if (inp.beamLength1 > 0) {
    items.push(li("Foam Gasket", 1, Math.ceil(inp.beamLength1), RATES.foam_gasket_ft));
  }

  if (totalPosts > 0) {
    items.push(li("Wedge Anchors", totalPosts * 2, 0, RATES.anchor_wedge));
  }

  if (inp.beamLength1 > 0) {
    items.push(li("Beam End Caps #1", 2, 0, endcapRate, "", inp.colorPostsBeam));
  }
  if (inp.beamLength2 > 0) {
    items.push(li("Beam End Caps #2", 2, 0, endcapRate, "", inp.colorPostsBeam));
  }

  if (inp.beamLength1 > 0) {
    items.push(li("Silicone Clear", Math.ceil(inp.beamLength1 / 10), 0, RATES.silicone_clear));
  }

  if (p1Qty > 0) {
    items.push(li("Pan Clips", Math.ceil(p1Qty / 4), 0, RATES.pan_clip));
  }

  if (inp.fanBeamQty > 0) {
    items.push(li("Fan Beam",     inp.fanBeamQty, inp.fanBeamLength, RATES.fan_beam_ft));
    items.push(li("Fan Beam Cap", inp.fanBeamQty, inp.fanBeamLength, RATES.fan_beam_cap_ft, "", "Match Top Color"));
  }

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
