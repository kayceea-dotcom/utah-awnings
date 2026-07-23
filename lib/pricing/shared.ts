// Beam/post pricing logic shared across product calculators (Newport, Modern,
// IRP/LRP). Keeping this in one place means a fix made for one product
// (real stock lengths, I-beam rates, etc.) automatically applies to the
// others instead of silently drifting out of sync.

import { RATES } from "./rates";
import type { LineItem } from "./types";

export function li(
  name: string, qty: number, length: number, rate: number,
  unit = "", color = ""
): LineItem {
  return { name, qty, length, unit, rate, amount: qty * (length || 1) * rate, color };
}

// Real supplier stock lengths (not a uniform step) — smallest one that fits.
const STOCK_LENGTHS = [16, 20, 24, 32, 40, 48, 60, 72, 80];
export function nextStockLength(ft: number): number {
  return STOCK_LENGTHS.find((len) => ft <= len) ?? STOCK_LENGTHS[STOCK_LENGTHS.length - 1];
}

// Beam material rate depends on the selected beam type.
export function beamMaterialRate(beamType: string): number {
  if (beamType === "3x3") return RATES.beam_3x3;
  if (beamType === "4_i_beam") return RATES.beam_4_i_beam;
  if (beamType === "7_i_beam") return RATES.beam_7_i_beam;
  return RATES.beam_3x8;
}

// Only 3x3/3x8 beams take a steel insert — I-beams are solid, no insert needed.
export function steelInsertRate(beamType: string): number {
  if (beamType === "3x3") return RATES.steel_3x3_g_beam_ft;
  if (beamType === "3x8") return RATES.steel_3x8_14ga_ft;
  return 0;
}

// Beam's own end cap is sized to the beam type, not the wrap kit; I-beams don't take one.
export function beamEndcapRate(beamType: string): number {
  if (beamType === "3x3") return RATES.endcap_3x3;
  if (beamType === "3x8") return RATES.endcap_3x8;
  return 0;
}

// 2 anchors per post, skipping whichever post group is ground-mounted (no anchor needed).
export function anchorQty(
  posts1: number, groundMountPosts1: boolean,
  posts2: number, groundMountPosts2: boolean
): number {
  return (groundMountPosts1 ? 0 : posts1 * 2) + (groundMountPosts2 ? 0 : posts2 * 2);
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

// Post/beam finishing pieces every wrap-kit product gets: post plates, sideplates,
// mitered caps, foam inserts, end caps, plugs. Independent of hanger/gutter type,
// so it applies the same whether the product has a generic gutter system (Flat
// Panel, W-Pan) or its own dedicated one (IRP/LRP).
export function wrapKitFinishingItems(rates: WrapKitRates, opts: {
  posts1: number; postHeight1: number;
  posts2: number; postHeight2: number;
  projection1: number;
  width1: number;
  panelQty1: number;
  colorPostsBeam: string;
}): LineItem[] {
  const items: LineItem[] = [];
  const totalPosts = opts.posts1 + opts.posts2;

  if (opts.posts1 > 0) {
    items.push(li("Post Plates #1 (Mitered)", opts.posts1 * 2, opts.postHeight1 + 1, rates.wrapRate, "", opts.colorPostsBeam));
  }
  if (opts.posts2 > 0) {
    items.push(li("Post Plates #2 (Mitered)", opts.posts2 * 2, opts.postHeight2 + 1, rates.wrapRate, "", opts.colorPostsBeam));
  }
  if (opts.projection1 > 0) {
    items.push(li("Sideplates Cut One Side", 2, opts.projection1 + 2, rates.sideRate, "", opts.colorPostsBeam));
  }
  if (totalPosts > 0) {
    items.push(li("Mitered Caps", totalPosts * 2, 0, rates.miterCapRate, "", opts.colorPostsBeam));
    items.push(li("Foam Inserts 2x6", totalPosts * 2, 0, RATES.foam_insert_2x6, "ea"));
  }
  if (opts.width1 > 0) {
    const spacingQty = Math.round(opts.width1 / 2);
    items.push(li("End Caps", spacingQty + 2, 0, rates.endcapRate, "", opts.colorPostsBeam));
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
}): LineItem[] {
  const items: LineItem[] = [];

  if (opts.gutterType === "extruded" && opts.width1 > 0) {
    items.push(li("Front Plate Gutter", 1, opts.width1 + 1, rates.wrapRate, "", opts.colorGutterFascia));
  }
  if (opts.width1 > 0) {
    const spacingQty = Math.round(opts.width1 / 2);
    if (opts.rafterTails) {
      items.push(li("Rafter Tails", spacingQty, 0, rates.rafterRate, "", opts.colorPostsBeam));
    }
    const bracketQty = spacingQty + 2;
    items.push(li("Inside Brackets", bracketQty, 0, rates.insideBrktRate));
    items.push(li("Outside Brackets", bracketQty, 0, rates.outsideBrktRate, "", opts.colorPostsBeam));
  }

  return items;
}
