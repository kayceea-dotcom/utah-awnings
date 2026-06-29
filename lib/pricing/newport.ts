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

// Round up to next standard stock length (16, 20, 24)
function nextStockLength(ft: number): number {
  if (ft <= 16) return 16;
  if (ft <= 20) return 20;
  return 24;
}

export function calcNewport(inp: NewportInputs): QuoteResult {
  const items: LineItem[] = [];

  const wrapRate       = inp.wrapType === "3x8" ? RATES.beam_3x8           : RATES.post_plate_2x6_ft;
  const sideRate       = inp.wrapType === "3x8" ? RATES.sideplate_3x8_ft   : RATES.sideplate_2x6_ft;
  const endcapRate     = inp.wrapType === "3x8" ? RATES.endcap_3x8         : RATES.endcap_2x6;
  const insideBrktRate = inp.wrapType === "3x8" ? RATES.inside_brkt_3x8    : RATES.inside_brkt_2x6;
  const miterCapRate   = inp.wrapType === "3x8" ? RATES.mitered_cap_3x8    : RATES.mitered_cap_2x6;
  const rafterRate     = inp.wrapType === "3x8" ? RATES.rafter_tail_3x8_ft : RATES.rafter_tail_2x6_ft;

  // ── PANELS ──
  // T6 is 6" (0.5ft) wide — sheet always divides by 0.5
  const p1Qty = inp.projection1 > 0 ? Math.ceil(inp.width1 / 0.5) : 0;
  const p2Qty = inp.projection2 > 0 ? Math.ceil(inp.width2 / 0.5) : 0;

  if (p1Qty > 0) {
    items.push(li("Panel #1", p1Qty, inp.projection1, panelRate(inp.panelType1), "ft", inp.colorPans));
  }
  if (p2Qty > 0 && inp.panelType2) {
    items.push(li("Panel #2", p2Qty, inp.projection2, panelRate(inp.panelType2), "ft", inp.colorPans));
  }

  // ── HANGER ──
  // Sheet: beam=17.5 -> hanger=19 = beam + 1.5
  const hangerLen = inp.beamLength1 > 0 ? inp.beamLength1 + 1.5 : 0;
  const hangerRate = inp.hangerType === "a_rail" ? RATES.hanger_a_rail_ft : RATES.hanger_roll_form_ft;
  if (hangerLen > 0) {
    items.push(li("Hanger", 1, hangerLen, hangerRate, "", inp.colorPans));
  }

  // ── GUTTER & FASCIA ──
  // Extruded gutter/fascia/steel insert round UP to next stock length (16/20/24ft)
  // Sheet: beam=17.5 -> gutter stock=20, fascia stock=16 (projection=11 -> next=16)
  if (inp.gutterType === "roll_form") {
    // Roll form comes in 30ft rolls — just bill linear ft
    const gutterLen = inp.beamLength1 > 0 ? inp.beamLength1 + 1.5 : 0;
    items.push(li("Roll Form Gutter", 1, gutterLen, RATES.gutter_roll_form_ft, "", inp.colorGutterFascia));
  } else {
    // Extruded — round up to stock length
    const gutterStock = nextStockLength(inp.beamLength1 + 1.5);
    const fasciaStock = nextStockLength(inp.projection1);
    items.push(li("Extruded Gutter",      1, gutterStock, RATES.gutter_extruded_ft,  "", inp.colorGutterFascia));
    // Sheet shows qty=1 for side fascia (one piece covers both sides at stock length)
    items.push(li("Extruded Side Fascia", 2, fasciaStock, RATES.fascia_extruded_ft,  "", inp.colorGutterFascia));
    items.push(li("Extruded Front Plate", 1, gutterStock, RATES.fascia_extruded_ft,  "", inp.colorGutterFascia));
  }

  // ── BEAMS ──
  if (inp.beamLength1 > 0) {
    items.push(li("Beam #1 (" + inp.beamType1 + ")", 1, inp.beamLength1, wrapRate, "", inp.colorPostsBeam));
    // Steel insert rounds up to same stock length as gutter
    const steelStock = nextStockLength(inp.beamLength1 + 1.5);
    items.push(li("Steel Insert #1", 1, steelStock, RATES.steel_3x8_14ga_ft));
  }
  if (inp.beamLength2 > 0 && inp.beamType2) {
    items.push(li("Beam #2 (" + inp.beamType2 + ")", 1, inp.beamLength2, wrapRate, "", inp.colorPostsBeam));
    const steelStock2 = nextStockLength(inp.beamLength2 + 1.5);
    items.push(li("Steel Insert #2", 1, steelStock2, RATES.steel_3x8_14ga_ft));
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

  // ── POST PLATES — qty=posts*2, length=postHeight+1 ──
  if (inp.posts1 > 0) {
    items.push(li("Post Plates #1 (Mitered)", inp.posts1 * 2, inp.postHeight1 + 1, wrapRate, "", inp.colorPostsBeam));
  }
  if (inp.posts2 > 0) {
    items.push(li("Post Plates #2 (Mitered)", inp.posts2 * 2, inp.postHeight2 + 1, wrapRate, "", inp.colorPostsBeam));
  }

  // ── MITERED CAPS — totalPosts * 2 ──
  if (totalPosts > 0) {
    items.push(li("Mitered Caps", totalPosts * 2, 0, miterCapRate, "", inp.colorPostsBeam));
  }

  // ── RAFTER TAILS ──
  // Newport sheet: width=17, posts=3 -> rafter tails=14
  // Formula: panels - (posts * 2) - 6 does not work cleanly
  // Better: width * 2 - posts * 2 - 6 = 17*2 - 3*2 - 6 = 34-6-6 = 22 (no)
  // Actually looking at sheet: 14 rafter tails for 17ft wide, 3 posts
  // 17ft / 1.5ft spacing = ~11, but that gives 11 not 14
  // Most likely: (p1Qty / 2) - posts1 = 34/2 - 3 = 14 ✓ EXACT MATCH
  if (inp.rafterTails && p1Qty > 0) {
    const rtQty = Math.max(0, Math.floor(p1Qty / 2) - inp.posts1);
    items.push(li("Rafter Tails", rtQty, 0, rafterRate, "", inp.colorPostsBeam));
  }

  // ── SIDE PLATES ──
  if (inp.projection1 > 0) {
    items.push(li("Side Plates (Cut One Side)", 2, inp.projection1, sideRate, "", inp.colorPostsBeam));
  }

  // ── INSIDE BRACKETS ──
  // Newport sheet: 16 inside brackets for 34 panels = panels/2 - 1 = 16 ✓
  const insideBrktQty = Math.max(0, Math.floor(p1Qty / 2) - 1);
  if (insideBrktQty > 0) {
    items.push(li("Inside Brackets", insideBrktQty, 0, insideBrktRate));
  }

  // ── PLUGS — sheet: 35 for 34 panels = panels + 1 ──
  if (p1Qty > 0) items.push(li("Lock Plugs", p1Qty + 1, 0, RATES.plug_5_8));

  // ── END CAPS — sheet Newport: 16 for 3 posts ──
  // = panels/2 - posts = 34/2 - 3 - 2 = 12? No.
  // Newport: End Caps qty=16 with scallop cut
  // Flat Pan: End Caps not listed separately (uses beam end caps only)
  // 16 = p1Qty/2 + totalPosts - 1 = 17 + 3 - 1 = 19 (no)
  // Most likely 16 = p1Qty / 2 - 1 = 16 ✓ (same as inside brackets + 0)
  const endCapQty = Math.max(0, Math.floor(p1Qty / 2) - 1);
  if (endCapQty > 0) {
    items.push(li("End Caps", endCapQty, 0, endcapRate, "", inp.colorPostsBeam));
  }

  // ── FOAM INSERTS — sheet: 6 for 3 posts = posts * 2 ──
  if (totalPosts > 0) {
    items.push(li("Foam Inserts 2x6", totalPosts * 2, 0, RATES.foam_insert_2x6, "ea"));
  }

  // ── GUTTER SPLICE — sheet Flat Pan: 0 (fits in one piece), Newport: 1 ──
  // Use 1 when gutter length exceeds 24ft stock
  const gutterNeedsStock = inp.beamLength1 + 1.5;
  if (gutterNeedsStock > 24) {
    items.push(li("Gutter Splice", 1, 0, RATES.gutter_splice));
  }

  // ── POST BRACKETS — posts * 2 ──
  if (totalPosts > 0) {
    items.push(li("Post Brackets", totalPosts * 2, 0, RATES.post_brkt));
  }

  // ── GUTTER DAMS — sheet: 2 for 1 downspout = downspouts * 2 ──
  items.push(li("Gutter Dams", inp.downspouts * 2, 0, RATES.gutter_dam));

  // ── DOWNSPOUTS ──
  if (inp.downspouts > 0) {
    items.push(li("Downspouts 2x3 10ft",  inp.downspouts,     0, RATES.downspout_2x3_10, "", inp.colorGutterFascia));
    items.push(li("Elbows 2x3",           inp.downspouts * 3, 0, RATES.elbow_2x3,        "", inp.colorGutterFascia));
    items.push(li("Dropouts",             inp.downspouts,     0, RATES.dropout));
    items.push(li("Downspout Straps",     inp.downspouts * 2, 0, RATES.downspout_strap,  "", inp.colorGutterFascia));
  }

  // ── FLASHING — sheet: 2 for 2 posts, 3 for 3 posts = totalPosts ──
  if (totalPosts > 0) {
    items.push(li("Flashing", totalPosts, 0, RATES.flashing));
  }

  // ── LAGS — sheet: 36 for 36 panels, 56 for 34+22=56 panels = total panels ──
  const totalPanels = p1Qty + p2Qty;
  if (totalPanels > 0) {
    items.push(li("Lag Screws",           totalPanels, 0, RATES.lag_screw));
    items.push(li("#14x1 Colored Screws", totalPanels, 0, RATES.screw_14x1_colored,  "", inp.colorPostsBeam));
    items.push(li("#14x1 Washered Screws",totalPanels, 0, RATES.screw_14x1_washered, "", inp.colorPostsBeam));
  }

  // ── PAN SCREWS — sheet: 200 for 36 panels, 300 for 56 panels
  // 200/36 = 5.5, 300/56 = 5.3 -> ceil(panels * 5.5) rounded to nearest 50
  const panScrewQty = Math.ceil(totalPanels * 5.5 / 50) * 50;
  if (panScrewQty > 0) {
    items.push(li("#8x1/2 Pan Color",  panScrewQty, 0, RATES.screw_8x0_5_color,    "", inp.colorPans));
    items.push(li("#8x1/2 Extruded",   panScrewQty, 0, RATES.screw_8x0_5_extruded, "", inp.colorPostsBeam));
  }

  // ── SPRAY PAINT ──
  if (inp.sprayPaint) {
    items.push(li("Spray Paint Pan",        1, 0, RATES.spray_paint, "", inp.colorPans));
    items.push(li("Spray Paint Posts/Beam", 1, 0, RATES.spray_paint, "", inp.colorPostsBeam));
  }

  // ── FOAM GASKET — sheet: beam=17.5 -> gasket length=18 = ceil(beam) ──
  if (inp.beamLength1 > 0) {
    items.push(li("Foam Gasket", 1, Math.ceil(inp.beamLength1), RATES.foam_gasket_ft));
  }

  // ── ANCHORS — posts * 2 ──
  if (totalPosts > 0) {
    items.push(li("Wedge Anchors", totalPosts * 2, 0, RATES.anchor_wedge));
  }

  // ── BEAM END CAPS ──
  if (inp.beamLength1 > 0) {
    items.push(li("Beam End Caps #1", 2, 0, endcapRate, "", inp.colorPostsBeam));
  }
  if (inp.beamLength2 > 0) {
    items.push(li("Beam End Caps #2", 2, 0, endcapRate, "", inp.colorPostsBeam));
  }

  // ── SILICONE — sheet: 2 for 17.5ft beam = ceil(beam/10) ──
  if (inp.beamLength1 > 0) {
    items.push(li("Silicone Clear", Math.ceil(inp.beamLength1 / 10), 0, RATES.silicone_clear));
  }

  // ── PAN CLIPS — sheet: 9 for 36 panels = ceil(panels/4) ──
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
