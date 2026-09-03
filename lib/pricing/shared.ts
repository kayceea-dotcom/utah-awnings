// Beam/post pricing logic shared across product calculators (Newport, Modern,
// IRP/LRP). Keeping this in one place means a fix made for one product
// (real stock lengths, I-beam rates, etc.) automatically applies to the
// others instead of silently drifting out of sync.

import { RATES } from "./rates";
import type { LineItem } from "./types";

export function li(
  name: string, qty: number, length: number, rate: number,
  unit = "", color = "", displayLength?: number
): LineItem {
  return { name, qty, length, unit, rate, amount: qty * (length || 1) * rate, color, displayLength };
}

export interface PricingSummaryOpts {
  taxRate: number;
  discount: number;
  footings: number;
  roofMounts: number;
  misc: number;
  tearDown: number;
  markup: number;
  // A rep-typed override for the final Total Job Sale (e.g. to land on a
  // round number for a cash job) - null means "use the auto-calculated
  // total". See customTotalAdjustment below for how this stays consistent
  // with commission.
  customTotal: number | null;
}

export interface PricingSummary {
  materialCost: number;
  taxes: number;
  totalMaterials: number;
  footings: number;
  roofMounts: number;
  misc: number;
  tearDown: number;
  subtotal: number;
  markup: number;
  ccFee: number;
  discount: number;
  totalJobSale: number;
  totalProfit: number;
  // totalJobSale minus what the auto-calculated (rounded) total would have
  // been without a customTotal override - 0 when no override is set. Added
  // to the commission basis in commissionBasisPrice so overriding the final
  // price shifts commission by the same real dollar amount, whichever way
  // the rep rounded.
  customTotalAdjustment: number;
}

// Turns a material cost total into the rest of the pricing breakdown (taxes,
// footings/roof mounts/misc/tear down, markup, credit-card fee, discount).
// Same formula for every product - pulled out so the quote builder can
// re-run it against a manually-edited material list without duplicating
// this math, not just so the 4 calculators stay in sync with each other.
//
// Discount is a flat $ amount taken off the final Total Job Sale (after markup
// and CC fee), not off the material cost - so it reduces the customer's price
// and the recorded profit by exactly the same dollar amount, dollar for dollar.
export function finalizePricing(materialCost: number, opts: PricingSummaryOpts): PricingSummary {
  const taxes = materialCost * opts.taxRate;
  const totalMaterials = materialCost + taxes;
  const subtotal = totalMaterials + opts.footings + opts.roofMounts + opts.misc + opts.tearDown;
  const preSaleTotal = subtotal * opts.markup;
  const ccFee = preSaleTotal * RATES.CC_FEE_RATE / (1 - RATES.CC_FEE_RATE);
  // Rounded up to a whole dollar so cash/check jobs land on a clean number
  // by default - a customTotal override (if set) replaces this outright.
  const autoTotalJobSale = Math.ceil(preSaleTotal + ccFee - opts.discount);
  const totalJobSale = opts.customTotal ?? autoTotalJobSale;
  const customTotalAdjustment = totalJobSale - autoTotalJobSale;
  const totalProfit = totalJobSale - subtotal;
  return {
    materialCost, taxes,
    totalMaterials,
    footings: opts.footings,
    roofMounts: opts.roofMounts,
    misc: opts.misc,
    tearDown: opts.tearDown,
    subtotal, markup: opts.markup, ccFee,
    discount: opts.discount,
    totalJobSale, totalProfit, customTotalAdjustment,
  };
}

// The price commission is actually calculated against - preSaleTotal (the
// markup applied to subtotal), before the CC fee is layered on top and
// before a Check/Cash "discount" (which only exists to cancel that fee back
// out) is subtracted. This makes commission identical whether the customer
// pays by card or check/cash - the fee (and waiving it) never touches it.
// A real discount ($200/$600/Custom) DOES reduce it, dollar for dollar,
// since that's an actual price concession - and so does a customTotal
// override, which is really just a discount (or premium) expressed as
// "make the total exactly $X" instead of "take off $Y".
export function commissionBasisPrice(result: PricingSummary, isCashDiscount: boolean): number {
  const preSaleTotal = result.subtotal * result.markup;
  const base = isCashDiscount ? preSaleTotal : preSaleTotal - result.discount;
  return base + result.customTotalAdjustment;
}

// Real supplier stock lengths (not a uniform step) — smallest one that fits. 4/8ft
// pieces are cut-offs the supplier still stocks (e.g. the 8ft left over cutting a
// 16ft piece off a 24ft steel beam), not a separate short product line. Does NOT
// apply to roll form gutter — see rollFormGutterStockLength below.
const STOCK_LENGTHS = [4, 8, 16, 20, 24, 32, 40, 48, 60, 72, 80];
export function nextStockLength(ft: number): number {
  return STOCK_LENGTHS.find((len) => ft <= len) ?? STOCK_LENGTHS[STOCK_LENGTHS.length - 1];
}

// Roll form gutter only ships in 2 lengths — 30ft and 36ft — a completely
// different set than the general stock-length ladder above (which has neither
// value). Extruded gutter stays on the general ladder.
const ROLL_FORM_GUTTER_LENGTHS = [30, 36];
export function rollFormGutterStockLength(ft: number): number {
  return ROLL_FORM_GUTTER_LENGTHS.find((len) => ft <= len) ?? ROLL_FORM_GUTTER_LENGTHS[ROLL_FORM_GUTTER_LENGTHS.length - 1];
}

// Extruded side fascia stock only goes up to 24ft. Up to a 12ft projection, one
// piece covers both sides (cut in half) — 8ft -> one 16ft piece, 10ft -> one 20ft,
// 12ft -> one 24ft. Past 12ft, a single piece can't cover both cuts anymore, so it's
// back to 2 separate pieces, each its own stock length. The 1-piece/2-piece decision
// is always based on the raw projection - only the resulting cut length gets the
// extra allowance, applied per side (so the 1-piece case, which yields 2 finished
// pieces off one board, gets 2x the allowance baked in).
//
// `extraPerSideFt` is a cut-to-fit allowance added past the projection before
// rounding to a stock length. Extruded fascia doesn't need one explicitly - stock
// rounding already leaves a few inches of slack. 2x6 (roll form gutter) does, since
// it's ordered with a flat 1ft allowance regardless of where the projection lands.
export function fasciaQtyLen(maxProjection: number, extraPerSideFt = 0): { qty: number; length: number } {
  if (maxProjection <= 12) {
    return { qty: 1, length: nextStockLength(2 * (maxProjection + extraPerSideFt)) };
  }
  return { qty: 2, length: nextStockLength(maxProjection + extraPerSideFt) };
}

// "double_3x8" is two 3x8 beams mounted to the front and back of the posts
// (instead of one beam sitting on top) to get more span between posts - not a
// distinct catalog rate, just 2x a single 3x8 beam's material/insert/endcap.
// "3x8_no_insert" is a plain 3x8 beam ordered without its steel insert (same
// beam material and end cap - only the insert itself is skipped).

// Beam material rate depends on the selected beam type. "none" (no beam at
// all - the front gutter is what's structural instead) prices at $0, no
// physical beam purchased.
export function beamMaterialRate(beamType: string): number {
  if (beamType === "none") return 0;
  if (beamType === "double_3x8") return RATES.beam_3x8 * 2;
  if (beamType === "3x3") return RATES.beam_3x3;
  if (beamType === "4_i_beam") return RATES.beam_4_i_beam;
  if (beamType === "7_i_beam") return RATES.beam_7_i_beam;
  return RATES.beam_3x8;
}

// Only 3x3/3x8 beams take a steel insert — I-beams are solid, no insert needed,
// and "3x8_no_insert" opts out of it on purpose (falls through to the 0 default).
// "none" falls through the same way - no beam, no insert.
export function steelInsertRate(beamType: string): number {
  if (beamType === "double_3x8") return RATES.steel_3x8_14ga_ft * 2;
  if (beamType === "3x3") return RATES.steel_3x3_g_beam_ft;
  if (beamType === "3x8") return RATES.steel_3x8_14ga_ft;
  return 0;
}

// Beam's own end cap is sized to the beam type, not the wrap kit; I-beams don't
// take one. "3x8_no_insert" still gets the regular 3x8 end cap - it's the same
// physical beam, just shipped without the insert. "none" falls through the
// same way - no beam, no end cap.
export function beamEndcapRate(beamType: string): number {
  if (beamType === "double_3x8") return RATES.endcap_3x8 * 2;
  if (beamType === "3x3") return RATES.endcap_3x3;
  if (beamType === "3x8" || beamType === "3x8_no_insert") return RATES.endcap_3x8;
  return 0;
}

// Friendly display name — everywhere else the raw beamType string is shown as-is.
export function beamTypeLabel(beamType: string): string {
  if (beamType === "double_3x8") return "Double 3x8";
  if (beamType === "3x8_no_insert") return "3x8, No Insert";
  if (beamType === "none") return "No Beam";
  return beamType;
}

// 2 anchors per post — skipped entirely when the job is ground-mounted (posts set
// directly, no concrete/deck surface to anchor into).
export function anchorQty(totalPosts: number, groundAttachment: string): number {
  return groundAttachment === "ground_mount" ? 0 : totalPosts * 2;
}

// A deck-mounted job 12ft or higher needs extra labor/hardware to work at height -
// folded into the Misc $ field rather than its own line item.
export function deckHeightSurcharge(groundAttachment: string, deckHeight: number): number {
  return groundAttachment === "deck" && deckHeight >= 12 ? 250 : 0;
}

// Ground-mounted posts are set directly into a dug/poured hole rather than
// bolted onto a footing/deck surface, so the physical post material needs an
// extra 2ft of buried length beyond the visible/entered post height.
export function postMaterialLength(heightFt: number, groundAttachment: string): number {
  return groundAttachment === "ground_mount" ? heightFt + 2 : heightFt;
}

// $100 per hole for the concrete + labor to set each ground-mounted post.
// Not a purchasable material - excluded from the material list/order sheet on
// purpose - folded into the Misc $ bucket instead, same as deckHeightSurcharge.
export function groundMountSurcharge(groundAttachment: string, totalPosts: number): number {
  return groundAttachment === "ground_mount" ? totalPosts * 100 : 0;
}

// ── Wrap kit ──────────────────────────────────────────────────────────────
// A wrap kit dresses the raw structure in matching trim. Rates depend only on
// which material (3x8 or 2x6) was picked, not the product.
export interface WrapKitRates {
  is3x8: boolean;
  wrapRate: number;
  sideRate: number;
  endcapRate: number;
  insideBrktRate: number;
  outsideBrktRate: number;
  miterCapRate: number;
  rafterRate: number;
}

export function wrapKitRates(wrapType: string): WrapKitRates {
  const is3x8 = wrapType === "3x8";
  return {
    is3x8,
    wrapRate:        is3x8 ? RATES.beam_3x8           : RATES.post_plate_2x6_ft,
    sideRate:        is3x8 ? RATES.sideplate_3x8_ft    : RATES.sideplate_2x6_ft,
    endcapRate:      is3x8 ? RATES.endcap_3x8          : RATES.endcap_2x6,
    insideBrktRate:  is3x8 ? RATES.inside_brkt_3x8     : RATES.inside_brkt_2x6,
    outsideBrktRate: is3x8 ? RATES.outside_brkt_3x8    : RATES.outside_brkt_2x6,
    miterCapRate:    is3x8 ? RATES.mitered_cap_3x8     : RATES.mitered_cap_2x6,
    rafterRate:      is3x8 ? RATES.rafter_tail_3x8_ft  : RATES.rafter_tail_2x6_ft,
  };
}

// Every wrap-kit finishing piece's rate is keyed off this same 2x6/3x8 choice,
// so the order sheet needs the dimension right on each line, not just implied
// by a wrap-type field elsewhere on the form.
function wrapDim(rates: WrapKitRates): string {
  return rates.is3x8 ? "3x8" : "2x6";
}

// Beam end cut (lib/pricing/types.ts EndCut) is only captured for Flat Panel
// (Newport) quotes today - other products simply won't pass an endCut, so
// these pieces come through unlabeled for them, same as before.
export const END_CUT_LABELS: Record<string, string> = {
  scallop: "Scallop", beveled: "Beveled", mitered: "Mitered", corbel: "Corbel",
};
function endCutSuffix(endCut?: string): string {
  return endCut && END_CUT_LABELS[endCut] ? ", " + END_CUT_LABELS[endCut] : "";
}

// Shade Beam: an extra freestanding support beam (Sampson post + 3x3 sleeve
// wrap + outside brackets), qty/length entered directly by the rep - not
// derived from the cover's own posts/beams. Shared across all 4 products so
// the 3-piece material breakdown stays identical everywhere it's offered.
export function shadeBeamItems(qty: number, length: number, color = ""): LineItem[] {
  if (qty <= 0 || length <= 0) return [];
  return [
    li("Shade Beam Post", qty, length, RATES.sampson_post_ft),
    li("Shade Beam Sleeve", qty, length, RATES.post_3x3_sleeve_ft, "", color),
    li("Shade Beam Brackets", qty * 2, 0, RATES.outside_brkt_3x8, "", color),
  ];
}

// Post/beam finishing pieces every wrap-kit product gets: post plates, sideplates,
// mitered caps, foam inserts, end caps, plugs. Independent of hanger/gutter type,
// so it applies the same whether the product has a generic gutter system (Flat
// Panel, W-Pan) or its own dedicated one (IRP/LRP).
export function wrapKitFinishingItems(rates: WrapKitRates, opts: {
  posts1: number; postHeight1: number;
  posts2: number; postHeight2: number;
  // Freestanding jobs only - a third post group (rear beam's own posts) that
  // needs its own Post Plates line (own height) but otherwise counts toward
  // the same totals (Mitered Caps, Foam Inserts) as posts1/posts2.
  postsRear?: number; postHeightRear?: number;
  projection1: number;
  width1: number;
  panelQty1: number;
  colorPostsBeam: string;
  endCut?: string;
  // Freestanding only - the roof now overhangs the rear beam by the same
  // amount it already overhangs the front, so the sideplate has to span
  // 2ft further to actually reach both ends.
  isFreestanding?: boolean;
}): LineItem[] {
  const items: LineItem[] = [];
  const postsRear = opts.postsRear ?? 0;
  const postHeightRear = opts.postHeightRear ?? 0;
  const totalPosts = opts.posts1 + opts.posts2 + postsRear;
  const dim = wrapDim(rates);

  if (opts.posts1 > 0) {
    items.push(li("Post Plates #1 (" + dim + ", Mitered)", opts.posts1 * 2, opts.postHeight1 + 1, rates.wrapRate, "", opts.colorPostsBeam));
  }
  if (opts.posts2 > 0) {
    items.push(li("Post Plates #2 (" + dim + ", Mitered)", opts.posts2 * 2, opts.postHeight2 + 1, rates.wrapRate, "", opts.colorPostsBeam));
  }
  if (postsRear > 0) {
    items.push(li("Post Plates Rear (" + dim + ", Mitered)", postsRear * 2, postHeightRear + 1, rates.wrapRate, "", opts.colorPostsBeam));
  }
  if (opts.projection1 > 0) {
    const sideplateLen = opts.projection1 + 2 + (opts.isFreestanding ? 2 : 0);
    items.push(li("Sideplates Cut One Side (" + dim + endCutSuffix(opts.endCut) + ")", 2, sideplateLen, rates.sideRate, "", opts.colorPostsBeam));
  }
  if (totalPosts > 0) {
    items.push(li("Mitered Caps (" + dim + ")", totalPosts * 2, 0, rates.miterCapRate, "", opts.colorPostsBeam));
    items.push(li("Foam Inserts 2x6", totalPosts * 2, 0, RATES.foam_insert_2x6, "ea"));
  }
  if (opts.width1 > 0) {
    const spacingQty = Math.round(opts.width1 / 2);
    items.push(li("End Caps (" + dim + ")", spacingQty + 2, 0, rates.endcapRate, "", opts.colorPostsBeam));
  }
  if (opts.panelQty1 > 0) {
    items.push(li("Plugs", Math.round(opts.panelQty1 * 0.7) + 1, 0, RATES.plug_5_8));
  }

  return items;
}

// Rafter/hanger finishing pieces — only for products sharing the generic
// extruded-gutter/hanger system (Flat Panel, W-Pan). IRP/LRP has its own
// dedicated hanger/gutter/fascia parts and doesn't use these.
export function wrapKitRafterItems(rates: WrapKitRates, opts: {
  gutterType: string;
  width1: number;
  rafterTails: boolean;
  colorGutterFascia: string;
  colorPostsBeam: string;
  endCut?: string;
  // Freestanding only - a second call with variant "Rear" doubles this same
  // finishing set onto the rear beam, since it's now a real finished edge
  // (no house wall to tuck under) that looks the same as the front.
  variant?: string;
}): LineItem[] {
  const items: LineItem[] = [];
  const dim = wrapDim(rates);
  const suffix = opts.variant ? " " + opts.variant : "";

  if (opts.gutterType === "extruded" && opts.width1 > 0) {
    items.push(li("Front Plate Gutter" + suffix + " (" + dim + ")", 1, opts.width1 + 1, rates.wrapRate, "", opts.colorGutterFascia));
  }
  if (opts.width1 > 0) {
    const spacingQty = Math.round(opts.width1 / 2);
    if (opts.rafterTails) {
      items.push(li("Rafter Tails" + suffix + " (" + dim + endCutSuffix(opts.endCut) + ")", spacingQty, 0, rates.rafterRate, "", opts.colorPostsBeam));
    }
    const bracketQty = spacingQty + 2;
    items.push(li("Inside Brackets" + suffix + " (" + dim + ")", bracketQty, 0, rates.insideBrktRate));
    items.push(li("Outside Brackets" + suffix + " (" + dim + ")", bracketQty, 0, rates.outsideBrktRate, "", opts.colorPostsBeam));
  }

  return items;
}
