import { RATES } from "./rates";
import { CATALOG_BY_KEY } from "./catalog";
import type { NewportInputs, LineItem, QuoteResult } from "./types";
import {
  li, nextStockLength, rollFormGutterStockLength, beamMaterialRate, steelInsertRate, beamEndcapRate, beamTypeLabel, anchorQty,
  wrapKitRates, wrapKitFinishingItems, wrapKitRafterItems, fasciaQtyLen, deckHeightSurcharge,
  postMaterialLength, groundMountSurcharge, finalizePricing, shadeBeamItems, END_CUT_LABELS,
} from "./shared";

function panelRate(type: string): number {
  return (RATES as Record<string, number>)[type] ?? 0;
}

function panelLabel(type: string): string {
  return CATALOG_BY_KEY[type]?.label ?? type;
}

// Only 3x8/double-3x8 beams take the selected end-cut treatment (3x3/I-beam don't).
function beamLabel(type: string, endCut: string): string {
  const takesEndCut = type === "3x8" || type === "double_3x8" || type === "3x8_no_insert";
  if (!takesEndCut || !endCut) return beamTypeLabel(type);
  return beamTypeLabel(type) + ", " + (END_CUT_LABELS[endCut] ?? endCut);
}

function panelWidthFt(type: string): number {
  return type.startsWith("flat_8_") ? 8 / 12 : 0.5;
}

export function calcNewport(inp: NewportInputs): QuoteResult {
  const items: LineItem[] = [];

  const hasWrap = inp.wrapType === "3x8" || inp.wrapType === "2x6";
  const wrapRates = wrapKitRates(inp.wrapType);

  // ── PANELS ──
  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / panelWidthFt(inp.panelType1)) : 0;
  const p2Qty = inp.projection2 > 0 ? Math.ceil(inp.width2 / panelWidthFt(inp.panelType2)) : 0;

  if (p1Qty > 0) {
    items.push(li("Panel #1 (" + panelLabel(inp.panelType1) + ")", p1Qty, inp.projection1, panelRate(inp.panelType1), "ft", inp.colorPans));
  }
  if (p2Qty > 0 && inp.panelType2) {
    items.push(li("Panel #2 (" + panelLabel(inp.panelType2) + ")", p2Qty, inp.projection2, panelRate(inp.panelType2), "ft", inp.colorPans));
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
  // Roll form gutter only ships in 30ft/36ft; extruded stays on the general stock ladder.
  const gutterStockLength = (ft: number) =>
    inp.gutterType === "roll_form" ? rollFormGutterStockLength(ft) : nextStockLength(ft);
  if (splitGutter) {
    if (inp.width1 > 0) items.push(li(gutterName + " #1", gutterMultiplier, gutterStockLength(inp.width1), gutterRate, "", inp.colorGutterFascia));
    if (inp.width2 > 0) items.push(li(gutterName + " #2", gutterMultiplier, gutterStockLength(inp.width2), gutterRate, "", inp.colorGutterFascia));
  } else if (combinedWidth > 0) {
    items.push(li(gutterName, gutterMultiplier, gutterStockLength(combinedWidth), gutterRate, "", inp.colorGutterFascia));
  }

  // ── SIDE FASCIA — extruded gutter uses a generic extruded profile; roll form gutter
  // uses a 2x6 board as its side fascia instead, independent of wrap kit selection (a
  // roll-form job needs this piece regardless of whether a 2x6/3x8 wrap was chosen).
  // Length keyed off the DEEPER of the two projections either way. Rate is a single
  // fixed value, not split by wrap type. Up to a 12ft projection, 1 piece covers both
  // sides (cut in half); past that, 2 separate pieces. The 2x6 gets an extra 1ft past
  // the projection to cut to fit on site - extruded stock rounding already leaves
  // enough slack on its own. ──
  const maxProjection = Math.max(inp.projection1, inp.projection2);
  if (inp.projection1 > 0 || inp.projection2 > 0) {
    if (inp.gutterType === "extruded") {
      const { qty: fasciaQty, length: fasciaLen } = fasciaQtyLen(maxProjection);
      items.push(li("Extruded Side Fascia", fasciaQty, fasciaLen, RATES.fascia_extruded_ft, "", inp.colorGutterFascia));
    } else if (inp.gutterType === "roll_form") {
      const { qty: fasciaQty, length: fasciaLen } = fasciaQtyLen(maxProjection, 1);
      items.push(li("Side Fascia (2x6)", fasciaQty, fasciaLen, RATES.fascia_extruded_2x6_ft, "", inp.colorGutterFascia));
    }
  }

  // ── WRAP KIT — front plate gutter, rafter tails, inside/outside brackets ──
  if (hasWrap) {
    items.push(...wrapKitRafterItems(wrapRates, {
      gutterType: inp.gutterType, width1: inp.width1, rafterTails: inp.rafterTails,
      colorGutterFascia: inp.colorGutterFascia, colorPostsBeam: inp.colorPostsBeam,
      endCut: inp.beamEndCut1,
    }));
  }

  // ── BEAMS — rate depends on selected beam type ──
  if (inp.beamLength1 > 0) {
    items.push(li("Beam #1 (" + beamLabel(inp.beamType1, inp.beamEndCut1) + ")", 1, inp.beamLength1, beamMaterialRate(inp.beamType1), "", inp.colorPostsBeam));
    const steelRate1 = steelInsertRate(inp.beamType1);
    if (steelRate1 > 0) {
      items.push(li("Steel Insert #1", 1, nextStockLength(inp.beamLength1), steelRate1));
    }
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam #2 (" + beamLabel(inp.beamType2, inp.beamEndCut2) + ")", 1, inp.beamLength2, beamMaterialRate(inp.beamType2), "", inp.colorPostsBeam));
    const steelRate2 = steelInsertRate(inp.beamType2);
    if (steelRate2 > 0) {
      items.push(li("Steel Insert #2", 1, nextStockLength(inp.beamLength2), steelRate2));
    }
  }

  // ── POSTS ──
  const multiSpanPosts = (inp.beams || []).reduce((s, b) => s + (b.posts || 0), 0);
  const totalPosts = inp.posts1 + inp.posts2 + multiSpanPosts;
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

  // ── MULTI-SPAN BEAMS — additional beams beyond the two primary runs (Additional /
  // Multi-Span Beams section), each with its own posts. Numbered #3, #4... to
  // continue from the two primary beams, matching the builder UI's "Beam {idx+3}" label. ──
  (inp.beams || []).forEach((beam, idx) => {
    const num = idx + 3;
    if (beam.length > 0 && beam.qty > 0) {
      items.push(li("Beam #" + num + " (" + beamTypeLabel(beam.type) + ")", beam.qty, beam.length, beamMaterialRate(beam.type), "", inp.colorPostsBeam));
      const steelRateN = steelInsertRate(beam.type);
      if (steelRateN > 0) {
        items.push(li("Steel Insert #" + num, beam.qty, nextStockLength(beam.length), steelRateN));
      }
      items.push(li("Beam End Caps #" + num, beam.qty * 2, 0, beamEndcapRate(beam.type), "", inp.colorPostsBeam));
    }
    if (beam.posts > 0) {
      const lenN = postMaterialLength(beam.postHeight, inp.groundAttachment);
      items.push(li("3x3 Post Sleeve #" + num, beam.posts, lenN, RATES.post_3x3_sleeve_ft, "", inp.colorPostsBeam));
      items.push(li("3x3 Steel Post #" + num,  beam.posts, lenN, RATES.post_3x3_steel_ft));
    }
  });

  // ── WRAP KIT — post plates, sideplates, mitered caps, foam inserts, end caps, plugs ──
  if (hasWrap) {
    items.push(...wrapKitFinishingItems(wrapRates, {
      posts1: inp.posts1, postHeight1: inp.postHeight1,
      posts2: inp.posts2, postHeight2: inp.postHeight2,
      projection1: inp.projection1, width1: inp.width1, panelQty1: p1Qty,
      colorPostsBeam: inp.colorPostsBeam,
      endCut: inp.beamEndCut1,
    }));
  }

  // ── GUTTER SPLICE — needed whenever a gutter run exceeds max stock length (36ft for roll
  // form, 24ft for extruded); when the gutter is split (ground/deck jog), check each piece
  // separately instead of the combined width ──
  const gutterMaxStock = inp.gutterType === "roll_form" ? 36 : 24;
  const gutterSpliceQty = splitGutter
    ? (inp.width1 > gutterMaxStock ? 1 : 0) + (inp.width2 > gutterMaxStock ? 1 : 0)
    : combinedWidth > gutterMaxStock ? 1 : 0;
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
  const wedgeAnchorQty = anchorQty(totalPosts, inp.groundAttachment);
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
