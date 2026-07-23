import { RATES } from "./rates";
import type { NewportInputs, LineItem, QuoteResult } from "./types";
import { li, nextStockLength, beamMaterialRate, steelInsertRate, beamEndcapRate, anchorQty } from "./shared";

function panelRate(type: string): number {
  return (RATES as Record<string, number>)[type] ?? 0;
}

function panelWidthFt(type: string): number {
  return type.startsWith("flat_8_") ? 8 / 12 : 0.5;
}

export function calcNewport(inp: NewportInputs): QuoteResult {
  const items: LineItem[] = [];

  const hasWrap = inp.wrapType === "3x8" || inp.wrapType === "2x6";
  const is3x8 = inp.wrapType === "3x8";
  const wrapRate     = is3x8 ? RATES.beam_3x8            : RATES.post_plate_2x6_ft;
  const sideRate     = is3x8 ? RATES.sideplate_3x8_ft    : RATES.sideplate_2x6_ft;
  const endcapRate   = is3x8 ? RATES.endcap_3x8          : RATES.endcap_2x6;
  const insideBrktRate = is3x8 ? RATES.inside_brkt_3x8   : RATES.inside_brkt_2x6;
  const outsideBrktRate = is3x8 ? RATES.outside_brkt_3x8 : RATES.outside_brkt_2x6;
  const miterCapRate = is3x8 ? RATES.mitered_cap_3x8     : RATES.mitered_cap_2x6;
  const rafterRate   = is3x8 ? RATES.rafter_tail_3x8_ft  : RATES.rafter_tail_2x6_ft;

  // ── PANELS ──
  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / panelWidthFt(inp.panelType1)) : 0;
  const p2Qty = inp.projection2 > 0 ? Math.ceil(inp.width2 / panelWidthFt(inp.panelType2)) : 0;

  if (p1Qty > 0) {
    items.push(li("Panel #1", p1Qty, inp.projection1, panelRate(inp.panelType1), "ft", inp.colorPans));
  }
  if (p2Qty > 0 && inp.panelType2) {
    items.push(li("Panel #2", p2Qty, inp.projection2, panelRate(inp.panelType2), "ft", inp.colorPans));
  }

  const combinedWidth = inp.width1 + inp.width2;
  const hasSecondRun = inp.width2 > 0;

  // ── HANGER — combined into 1 piece, UNLESS the second run is a jog in the house wall,
  // which forces the hanger to split into 2 (the beam/gutter stay continuous in that case).
  // A bay window/pop-out is itself a jog in the house wall with the same projection throughout —
  // the wall's angled path is longer, so the hanger needs a bigger allowance (+8 instead of +1). ──
  const splitHanger = hasSecondRun && inp.jogType === "house";
  const hangerAllowance = inp.bayWindowPopout ? 8 : 1;
  function hangerRateFor(type: string): number {
    if (type === "a_rail") return RATES.hanger_a_rail_ft;
    if (type === "extruded") return RATES.hanger_extruded_ft;
    if (type === "elevated_roof_mount") return RATES.hanger_elevated_roof_mount;
    return RATES.hanger_roll_form_ft;
  }
  if (inp.hangerType === "elevated_roof_mount") {
    if (combinedWidth > 0) items.push(li("Hanger", 1, 0, RATES.hanger_elevated_roof_mount, "", inp.colorPans));
  } else if (splitHanger) {
    if (inp.width1 > 0) items.push(li("Hanger #1", 1, inp.width1 + hangerAllowance, hangerRateFor(inp.hangerType), "", inp.colorPans));
    if (inp.width2 > 0) items.push(li("Hanger #2", 1, inp.width2 + hangerAllowance, hangerRateFor(inp.hangerType), "", inp.colorPans));
  } else if (combinedWidth > 0) {
    items.push(li("Hanger", 1, combinedWidth + hangerAllowance, hangerRateFor(inp.hangerType), "", inp.colorPans));
  }

  // ── GUTTER — combined into 1 piece, UNLESS the second run is a jog in the ground/deck,
  // which forces the beam/gutter to split into 2 (the hanger stays continuous in that case).
  // Roof-mount hanger needs 2 gutters regardless. ──
  const gutterMultiplier = inp.hangerType === "elevated_roof_mount" ? 2 : 1;
  const splitGutter = hasSecondRun && inp.jogType === "ground";
  const gutterName = inp.gutterType === "roll_form" ? "Roll Form Gutter" : "Extruded Gutter";
  const gutterRate = inp.gutterType === "roll_form" ? RATES.gutter_roll_form_ft : RATES.gutter_extruded_ft;
  if (splitGutter) {
    if (inp.width1 > 0) items.push(li(gutterName + " #1", gutterMultiplier, nextStockLength(inp.width1), gutterRate, "", inp.colorGutterFascia));
    if (inp.width2 > 0) items.push(li(gutterName + " #2", gutterMultiplier, nextStockLength(inp.width2), gutterRate, "", inp.colorGutterFascia));
  } else if (combinedWidth > 0) {
    items.push(li(gutterName, gutterMultiplier, nextStockLength(combinedWidth), gutterRate, "", inp.colorGutterFascia));
  }

  // ── EXTRUDED SIDE FASCIA — only with extruded gutter; length keyed off the DEEPER of the two
  // projections. Rate is a single fixed value, not split by wrap type. ──
  if (inp.gutterType === "extruded" && (inp.projection1 > 0 || inp.projection2 > 0)) {
    const fasciaLen = nextStockLength(Math.max(inp.projection1, inp.projection2));
    items.push(li("Extruded Side Fascia", 2, fasciaLen, RATES.fascia_extruded_ft, "", inp.colorGutterFascia));
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

  // ── INSIDE / OUTSIDE BRACKETS — only with wrap kit, same spacing as rafter tails plus 2 ──
  if (hasWrap && inp.width1 > 0) {
    const spacingQty = Math.round(inp.width1 / 2);
    const bracketQty = spacingQty + 2;
    items.push(li("Inside Brackets", bracketQty, 0, insideBrktRate));
    items.push(li("Outside Brackets", bracketQty, 0, outsideBrktRate, "", inp.colorPostsBeam));
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

  // ── FOAM INSERTS — posts * 2; part of the wrap kit bundle, Newport-only
  // (Modern's post system doesn't use a wrap kit at all) ──
  if (inp.product === "newport" && hasWrap && totalPosts > 0) {
    items.push(li("Foam Inserts 2x6", totalPosts * 2, 0, RATES.foam_insert_2x6, "ea"));
  }

  // ── GUTTER SPLICE — needed whenever a gutter run exceeds max stock length (24ft); when the
  // gutter is split (ground/deck jog), check each piece separately instead of the combined width ──
  const gutterSpliceQty = splitGutter
    ? (inp.width1 > 24 ? 1 : 0) + (inp.width2 > 24 ? 1 : 0)
    : combinedWidth > 24 ? 1 : 0;
  if (gutterSpliceQty > 0) {
    items.push(li("Gutter Splice", gutterSpliceQty, 0, RATES.gutter_splice));
  }

  // ── POST BRACKETS — posts * 2 ──
  if (totalPosts > 0) {
    items.push(li("Post Brackets", totalPosts * 2, 0, RATES.post_brkt));
  }

  // ── GUTTER DAMS — 4 with a second run, else 2 ──
  items.push(li("Gutter Dams", inp.width2 > 0 ? 4 : 2, 0, RATES.gutter_dam));

  // ── DOWNSPOUTS ──
  if (inp.downspouts > 0) {
    items.push(li("Downspouts 2x3 10ft",  inp.downspouts,     0, RATES.downspout_2x3_10, "", inp.colorGutterFascia));
    items.push(li("Elbows 2x3",           inp.downspouts * 3, 0, RATES.elbow_2x3,        "", inp.colorGutterFascia));
    items.push(li("Dropouts",             inp.downspouts,     0, RATES.dropout));
    items.push(li("Downspout Straps",     inp.downspouts * 2, 0, RATES.downspout_strap,  "", inp.colorGutterFascia));
  }

  // ── FLASHING — combined width / 10, rounded up ──
  if (combinedWidth > 0) {
    items.push(li("Flashing", Math.ceil(combinedWidth / 10), 0, RATES.flashing));
  }

  // ── LAGS — combined width * 2 ──
  const fastenerQty = combinedWidth * 2;
  if (fastenerQty > 0) {
    items.push(li("Lag Screws",            fastenerQty, 0, RATES.lag_screw));
    items.push(li("#14x1 Colored Screws",  fastenerQty, 0, RATES.screw_14x1_colored,  "", inp.colorPostsBeam));
    items.push(li("#14x1 Washered Screws", fastenerQty, 0, RATES.screw_14x1_washered, "", inp.colorPostsBeam));
  }

  // ── PAN SCREWS — combined width * 10, rounded up to the nearest 100 ──
  const panScrewQty = Math.ceil((combinedWidth * 10) / 100) * 100;
  if (panScrewQty > 0) {
    items.push(li("#8x1/2 Pan Color",  panScrewQty, 0, RATES.screw_8x0_5_color,    "", inp.colorPans));
    items.push(li("#8x1/2 Extruded",   panScrewQty, 0, RATES.screw_8x0_5_extruded, "", inp.colorPostsBeam));
  }

  // ── SPRAY PAINT ──
  if (inp.sprayPaint) {
    items.push(li("Spray Paint Pan",        1, 0, RATES.spray_paint, "", inp.colorPans));
    items.push(li("Spray Paint Posts/Beam", 1, 0, RATES.spray_paint, "", inp.colorPostsBeam));
  }

  // ── FOAM GASKET — raw combined width, not rounded to a stock length ──
  if (combinedWidth > 0) {
    items.push(li("Foam Gasket", 1, combinedWidth, RATES.foam_gasket_ft));
  }

  // ── ANCHORS — 2 per post, skip whichever post group is ground-mounted (no anchor needed) ──
  const wedgeAnchorQty = anchorQty(inp.posts1, inp.groundMountPosts1, inp.posts2, inp.groundMountPosts2);
  if (wedgeAnchorQty > 0) {
    items.push(li("Wedge Anchors", wedgeAnchorQty, 0, RATES.anchor_wedge));
  }

  // ── BEAM END CAPS — sized to the beam's own type, zero for I-beams ──
  if (inp.beamLength1 > 0) {
    items.push(li("Beam End Caps #1", 2, 0, beamEndcapRate(inp.beamType1), "", inp.colorPostsBeam));
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam End Caps #2", 2, 0, beamEndcapRate(inp.beamType2), "", inp.colorPostsBeam));
  }

  // ── SILICONE — combined width / 10, rounded up ──
  if (combinedWidth > 0) {
    items.push(li("Silicone Clear", Math.ceil(combinedWidth / 10), 0, RATES.silicone_clear));
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
