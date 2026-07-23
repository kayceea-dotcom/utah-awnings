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
