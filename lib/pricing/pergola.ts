import { RATES } from "./rates";
import type { LineItem, QuoteResult } from "./types";

export interface PergolaInputs {
  jobName: string;
  salesman: string;
  projection: number;
  width: number;
  beamLength: number;
  beamType: string;
  beamEndCut: string;
  beamQty: number;
  rafterGauge: string;
  latticeType: string;
  latticeSpacing: string;
  headerBoard: boolean;
  posts: number;
  postHeight: number;
  colorPergola: string;
  endCut: string;
  endCutSide: string;
  sprayPaint: boolean;
  groundMount: boolean;
  shadeBeamQty: number;
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

export function calcPergola(inp: PergolaInputs): QuoteResult {
  const items: LineItem[] = [];

  const rafterRate = RATES.rafter_2x6_032_ft;
  const latticeRate = inp.latticeType === "2x3" ? RATES.lattice_2x3_ft : RATES.lattice_2x2_ft;
  const latticeEndcapRate = inp.latticeType === "2x3" ? RATES.endcap_2x3 : RATES.endcap_2x2;
  const latticeSpliceRate = inp.latticeType === "2x3" ? RATES.lattice_splice_2x3 : RATES.lattice_splice_2x2;
  const tubeInches = inp.latticeType === "2x3" ? 3 : 2;

  // ── RAFTERS ──
  // One rafter every 2ft of width — they're inset 6in-1ft from each end
  // (depending on whether the width is odd or even), not flush with the beam.
  const rafterQty = inp.width > 0 ? Math.round(inp.width / 2) : 0;
  if (rafterQty > 0) {
    items.push(li("2x6 Rafters", rafterQty, inp.projection, rafterRate, "ft", inp.colorPergola));
  }

  // ── LATTICE TUBING ──
  // Per foot of rafter: 12" / (tube_inches * 2) runs per foot of projection
  // e.g. 2x2 at 2" spacing: 12/(2*2) = 3 runs per ft of projection
  // 1.5x spacing: 12/(tube_inches * 3) runs per ft
  const spacingMultiplier = inp.latticeSpacing === "1.5x" ? 3 : 2;
  const latticeRunsPerFt = 12 / (tubeInches * spacingMultiplier);
  const latticeQty = inp.projection > 0 ? Math.round(inp.projection * latticeRunsPerFt) : 0;
  if (latticeQty > 0) {
    items.push(li("Lattice Tubing (" + inp.latticeType + ")", latticeQty, inp.width, latticeRate, "ft", inp.colorPergola));
  }

  // ── LATTICE SPLICES (for covers > 24ft projection) ──
  if (inp.projection > 24 && latticeQty > 0) {
    items.push(li("Lattice Splices", latticeQty, 0, latticeSpliceRate));
  }

  // ── HEADER BOARD ──
  if (inp.headerBoard && inp.beamLength > 0) {
    items.push(li("2x6 Header Board", 1, inp.beamLength, rafterRate, "", inp.colorPergola));
  }

  // ── BEAMS ──
  if (inp.beamLength > 0 && inp.beamQty > 0) {
    items.push(li("Beam (" + inp.beamType + ")", inp.beamQty, inp.beamLength, RATES.beam_3x8, "", inp.colorPergola));
    const steelStock = nextStockLength(inp.beamLength + 1.5);
    items.push(li("Steel Insert", inp.beamQty, steelStock, RATES.steel_3x8_14ga_ft));
  }

  // ── POSTS ──
  const totalPosts = inp.posts;
  if (totalPosts > 0) {
    items.push(li("3x3 Post Sleeve", totalPosts, inp.postHeight, RATES.post_3x3_sleeve_ft, "", inp.colorPergola));
    items.push(li("3x3 Steel Post", totalPosts, inp.postHeight, RATES.post_3x3_steel_ft));
    // Post plates mitered one end
    items.push(li("2x6 Post Plates (Mitered)", totalPosts * 2, inp.postHeight + 1, RATES.post_plate_2x6_ft, "", inp.colorPergola));
  }

  // ── MITERED CAPS ──
  if (totalPosts > 0) {
    items.push(li("Mitered Caps", totalPosts * 2, 0, RATES.mitered_cap_2x6, "", inp.colorPergola));
  }

  // ── INSIDE BRACKETS — one per rafter ──
  if (rafterQty > 0) {
    items.push(li("2x6 Inside Brackets", rafterQty, 0, RATES.inside_brkt_2x6));
  }

  // ── OUTSIDE BRACKETS — one per rafter ──
  if (rafterQty > 0) {
    items.push(li("2x6 Outside Brackets", rafterQty, 0, RATES.outside_brkt_2x6, "", inp.colorPergola));
  }

  // ── PLUGS ──
  if (rafterQty > 0) {
    items.push(li("Plugs", rafterQty + 6, 0, RATES.plug_5_8));
  }

  // ── END CAPS (rafter end caps) — one per rafter ──
  if (rafterQty > 0) {
    items.push(li("2x6 End Caps", rafterQty, 0, RATES.endcap_2x6, "", inp.colorPergola));
  }

  // ── LATTICE END CAPS — 2 per lattice piece ──
  if (latticeQty > 0) {
    items.push(li("Lattice End Caps (" + inp.latticeType + ")", latticeQty * 2, 0, latticeEndcapRate));
  }

  // ── FOAM INSERTS ──
  if (totalPosts > 0) {
    items.push(li("Foam Inserts 2x6", totalPosts * 2, 0, RATES.foam_insert_pergola, "ea"));
  }

  // ── POST BRACKETS ──
  if (totalPosts > 0) {
    items.push(li("Post Brackets", totalPosts * 2, 0, RATES.post_brkt));
  }

  // ── LAGS — one per rafter ──
  if (rafterQty > 0) {
    items.push(li("Lag Screws", rafterQty, 0, RATES.lag_screw));
    items.push(li("#14x1 Colored Screws", rafterQty * 10, 0, RATES.screw_14x1_colored, "", inp.colorPergola));
  }

  // ── LATTICE SCREWS — sheet: 324 screws for 36 lattice pieces = 9 per piece ──
  if (latticeQty > 0) {
    const latticeScrew = Math.ceil(latticeQty * 9);
    items.push(li("#10x2.5 Lattice Screws", latticeScrew, 0, RATES.lattice_screw, "", inp.colorPergola));
  }

  // ── SPRAY PAINT ──
  if (inp.sprayPaint) {
    items.push(li("Spray Paint Posts/Beam", 1, 0, RATES.spray_paint, "", inp.colorPergola));
  }

  // ── ANCHORS ──
  if (totalPosts > 0) {
    items.push(li("Wedge Anchors", totalPosts * 2, 0, RATES.anchor_wedge));
  }

  // ── BEAM END CAPS — 2 per beam ──
  if (inp.beamLength > 0 && inp.beamQty > 0) {
    items.push(li("3x8 Beam End Caps", inp.beamQty * 2, 0, RATES.endcap_3x8, "", inp.colorPergola));
  }

  // ── SILICONE ──
  if (inp.beamLength > 0) {
    items.push(li("Silicone Clear", Math.ceil(inp.beamLength / 10), 0, RATES.silicone_clear));
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
  const totalSqFt           = inp.projection > 0 ? inp.projection * inp.width : 0;

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
