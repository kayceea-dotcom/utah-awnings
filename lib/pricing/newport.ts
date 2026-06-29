import { RATES } from "./rates";
import type { NewportInputs, LineItem, QuoteResult } from "./types";

function li(
  name: string,
  qty: number,
  length: number,
  rate: number,
  unit = "",
  color = ""
): LineItem {
  return { name, qty, length, unit, rate, amount: qty * (length || 1) * rate, color };
}

function panelRate(type: string): number {
  return (RATES as Record<string, number>)[type] ?? 0;
}

function steelInsertRate(beamType: string): number {
  if (beamType === "3x3") return RATES.steel_3x8_14ga_ft * 0.6;
  return RATES.steel_3x8_14ga_ft;
}

export function calcNewport(inp: NewportInputs): QuoteResult {
  const items: LineItem[] = [];

  const wrapRate = inp.wrapType === "3x8" ? RATES.beam_3x8 : RATES.post_plate_2x6_ft;
  const sideRate = inp.wrapType === "3x8" ? RATES.sideplate_3x8_ft : RATES.sideplate_2x6_ft;
  const endcapRate = inp.wrapType === "3x8" ? RATES.endcap_3x8 : RATES.endcap_2x6;
  const insideBrktRate = inp.wrapType === "3x8" ? RATES.inside_brkt_3x8 : RATES.inside_brkt_2x6;
  const miterCapRate = inp.wrapType === "3x8" ? RATES.mitered_cap_3x8 : RATES.mitered_cap_2x6;
  const rafterTailRate = inp.wrapType === "3x8" ? RATES.rafter_tail_3x8_ft : RATES.rafter_tail_2x6_ft;

  // Panels
  const p1PanelWidth = inp.panelType1.startsWith("T6") ? 6 / 12 : 8 / 12;
  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / p1PanelWidth) : 0;
  if (p1Qty > 0) {
    items.push(li("Panel #1", p1Qty, inp.projection1, panelRate(inp.panelType1), "ft", inp.colorPans));
  }
  if (inp.panelType2 && inp.projection2 > 0) {
    const p2PanelWidth = inp.panelType2.startsWith("T6") ? 6 / 12 : 8 / 12;
    const p2Qty = Math.ceil(inp.width2 / p2PanelWidth);
    items.push(li("Panel #2", p2Qty, inp.projection2, panelRate(inp.panelType2), "ft", inp.colorPans));
  }

  // Hanger
  const hangerWidth = inp.beamLength1 > 0 ? inp.beamLength1 + 2 : 0;
  const hangerRate = inp.hangerType === "a_rail" ? RATES.hanger_a_rail_ft : RATES.hanger_roll_form_ft;
  if (hangerWidth > 0) {
    items.push(li("Hanger", 1, hangerWidth, hangerRate, "", inp.colorPans));
  }

  // Gutter
  if (inp.gutterType === "roll_form") {
    items.push(li("Roll Form Gutter", 1, hangerWidth, RATES.gutter_roll_form_ft, "", inp.colorGutterFascia));
  } else {
    items.push(li("Extruded Gutter", 1, hangerWidth, RATES.gutter_extruded_ft, "", inp.colorGutterFascia));
    items.push(li("Extruded Side Fascia", 2, inp.projection1, RATES.fascia_extruded_ft, "", inp.colorGutterFascia));
  }

  // Beams
  if (inp.beamLength1 > 0) {
    items.push(li("Beam #1 (" + inp.beamType1 + ")", 1, inp.beamLength1, wrapRate, "", inp.colorPostsBeam));
    items.push(li("Steel Insert #1", 1, inp.beamLength1 + 2.5, steelInsertRate(inp.beamType1)));
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam #2 (" + inp.beamType2 + ")", 1, inp.beamLength2, wrapRate, "", inp.colorPostsBeam));
    items.push(li("Steel Insert #2", 1, inp.beamLength2 + 2.5, steelInsertRate(inp.beamType2)));
  }

  // Posts
  const totalPosts = inp.posts1 + inp.posts2;
  if (inp.posts1 > 0) {
    items.push(li("3x3 Post Sleeve #1", inp.posts1, inp.postHeight1, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
    items.push(li("3x3 Steel Post #1", inp.posts1, inp.postHeight1, RATES.post_3x3_steel_ft));
    const ppLen = inp.postHeight1 + 1;
    items.push(li("Post Plates #1 (Mitered)", inp.posts1 * 2, ppLen, wrapRate, "", inp.colorPostsBeam));
  }
  if (inp.posts2 > 0) {
    items.push(li("3x3 Post Sleeve #2", inp.posts2, inp.postHeight2, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
    items.push(li("3x3 Steel Post #2", inp.posts2, inp.postHeight2, RATES.post_3x3_steel_ft));
    const ppLen = inp.postHeight2 + 1;
    items.push(li("Post Plates #2 (Mitered)", inp.posts2 * 2, ppLen, wrapRate, "", inp.colorPostsBeam));
  }

  // Caps and tails
  if (totalPosts > 0) {
    items.push(li("Mitered Caps", totalPosts * 2, 0, miterCapRate, "", inp.colorPostsBeam));
  }
  if (inp.rafterTails && p1Qty > 0) {
    items.push(li("Rafter Tails", p1Qty, 0, rafterTailRate, "", inp.colorPostsBeam));
  }
  if (inp.projection1 > 0) {
    items.push(li("Side Plates (Cut One Side)", 2, inp.projection1, sideRate, "", inp.colorPostsBeam));
  }

  // Brackets and hardware
  const insideBrktQty = p1Qty > 0 ? Math.ceil(p1Qty * 1.1) : 0;
  if (insideBrktQty > 0) {
    items.push(li("Inside Brackets", insideBrktQty, 0, insideBrktRate));
  }
  if (totalPosts > 0) {
    items.push(li("End Caps (Beam)", 2, 0, endcapRate, "", inp.colorPostsBeam));
    items.push(li("Foam Inserts", totalPosts, 0, RATES.foam_insert_2x6, "ea"));
  }

  const plugQty = p1Qty * 2 + 5;
  if (plugQty > 5) items.push(li("Lock Plugs", plugQty, 0, RATES.plug_5_8));

  items.push(li("Gutter Splice", hangerWidth > 30 ? 1 : 0, 0, RATES.gutter_splice));
  if (totalPosts > 0) items.push(li("Post Brackets", totalPosts * 2, 0, RATES.post_brkt));
  items.push(li("Gutter Dams", inp.downspouts * 2, 0, RATES.gutter_dam));

  // Downspouts
  if (inp.downspouts > 0) {
    items.push(li("Downspouts 2x3 10ft", inp.downspouts, 0, RATES.downspout_2x3_10, "", inp.colorGutterFascia));
    items.push(li("Elbows 2x3", inp.downspouts * 3, 0, RATES.elbow_2x3, "", inp.colorGutterFascia));
    items.push(li("Dropouts", inp.downspouts, 0, RATES.dropout));
    items.push(li("Downspout Straps", inp.downspouts * 2, 0, RATES.downspout_strap, "", inp.colorGutterFascia));
  }

  items.push(li("Flashing", Math.max(2, inp.posts1 + inp.posts2), 0, RATES.flashing));

  // Fasteners
  const lagQty = p1Qty * 2 + (inp.posts1 + inp.posts2) * 4;
  if (lagQty > 0) {
    items.push(li("Lag Screws", lagQty, 0, RATES.lag_screw));
    items.push(li("#14x1 Colored Screws", lagQty, 0, RATES.screw_14x1_colored, "", inp.colorPostsBeam));
    items.push(li("#14x1 Washered Screws", lagQty, 0, RATES.screw_14x1_washered, "", inp.colorPostsBeam));
  }
  const panScrewQty = p1Qty * 6;
  if (panScrewQty > 0) {
    items.push(li("#8x1/2 Pan Color", panScrewQty, 0, RATES.screw_8x0_5_color, "", inp.colorPans));
    items.push(li("#8x1/2 Extruded", panScrewQty, 0, RATES.screw_8x0_5_extruded, "", inp.colorPostsBeam));
  }

  if (inp.sprayPaint) {
    items.push(li("Spray Paint Pan", 1, 0, RATES.spray_paint, "", inp.colorPans));
    items.push(li("Spray Paint Posts/Beam", 1, 0, RATES.spray_paint, "", inp.colorPostsBeam));
  }

  if (inp.beamLength1 > 0) {
    items.push(li("Foam Gasket", 1, inp.beamLength1, RATES.foam_gasket_ft));
  }
  if (totalPosts > 0) {
    items.push(li("Wedge Anchors", totalPosts * 2, 0, RATES.anchor_wedge));
  }

  items.push(li("Beam End Caps #1", 2, 0, endcapRate, "", inp.colorPostsBeam));
  if (inp.beamLength2 > 0) {
    items.push(li("Beam End Caps #2", 2, 0, endcapRate, "", inp.colorPostsBeam));
  }

  const silQty = Math.max(2, Math.ceil(inp.beamLength1 / 10));
  items.push(li("Silicone Clear", silQty, 0, RATES.silicone_clear));

  const panClipQty = Math.ceil(p1Qty * 0.5);
  if (panClipQty > 0) items.push(li("Pan Clips", panClipQty, 0, RATES.pan_clip));

  // Fan beam
  if (inp.fanBeamQty > 0) {
    items.push(li("Fan Beam", inp.fanBeamQty, inp.fanBeamLength, RATES.fan_beam_ft));
    items.push(li("Fan Beam Cap", inp.fanBeamQty, inp.fanBeamLength, RATES.fan_beam_cap_ft, "", "Match Top Color"));
  }

  // Pricing summary
  const materialCost = items.reduce((s, i) => s + i.amount, 0);
  const taxes = materialCost * inp.taxRate;
  const priceIncreaseDollar = (materialCost + taxes) * inp.priceIncrease;
  const totalMaterials = materialCost + taxes + priceIncreaseDollar;
  const subtotal = totalMaterials + inp.footings + inp.roofMounts + inp.misc;
  const preSaleTotal = subtotal * inp.markup;
  const ccFee = preSaleTotal * RATES.CC_FEE_RATE / (1 - RATES.CC_FEE_RATE);
  const totalJobSale = preSaleTotal + ccFee;
  const totalProfit = totalJobSale - subtotal;
  const totalSqFt =
    (inp.projection1 > 0 ? inp.projection1 * inp.width1 : 0) +
    (inp.projection2 > 0 ? inp.projection2 * inp.width2 : 0);

  return {
    lineItems: items.filter((i) => i.amount !== 0),
    materialCost,
    taxes,
    priceIncrease: priceIncreaseDollar,
    totalMaterials,
    footings: inp.footings,
    roofMounts: inp.roofMounts,
    misc: inp.misc,
    subtotal,
    markup: inp.markup,
    ccFee,
    totalJobSale,
    totalProfit,
    costPerSqFt: totalSqFt > 0 ? subtotal / totalSqFt : 0,
    pricePerSqFt: totalSqFt > 0 ? totalJobSale / totalSqFt : 0,
    totalSqFt,
  };
}
