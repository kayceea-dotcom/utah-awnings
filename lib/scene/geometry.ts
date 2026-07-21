import type { BBox } from "./types";

// Beam/post line sits this far in from the outer (front) edge of the cover,
// matching the convention already used by components/quote/CoverDiagram.tsx.
export const BEAM_INSET_FT = 1.5;

export function inchesPerFootToDeg(inchesPerFoot: number): number {
  return Math.atan(inchesPerFoot / 12) * (180 / Math.PI);
}

// Solid patio cover roofs (Newport, Flat-Pan, W-Pan, IRP) are built at a fixed
// 1/2" per foot slope — real jobs range 1/4"–1" per foot, but 1/2" is the
// standard and there's no per-job pitch input, so it's not user-adjustable.
// Pergolas are flat (roofPitchDeg = 0), set directly in their own adapter.
export const STANDARD_ROOF_PITCH_DEG = inchesPerFootToDeg(0.5);

export function computePostXPositions(widthFt: number, postsQty: number): number[] {
  if (postsQty <= 0 || widthFt <= 0) return [];
  if (postsQty === 1) return [widthFt / 2];
  const inset = Math.min(BEAM_INSET_FT, widthFt / 2);
  const xs: number[] = [];
  for (let i = 0; i < postsQty; i++) {
    if (i === 0) xs.push(inset);
    else if (i === postsQty - 1) xs.push(widthFt - inset);
    else xs.push(inset + ((widthFt - 2 * inset) * i) / (postsQty - 1));
  }
  return xs;
}

// Matches the rafter-tail quantity convention used by lib/pricing/newport.ts
// (rtQty = Math.round(width1 / 2)) — a nominal 2ft pitch.
export function computeRafterTailCount(widthFt: number): number {
  return widthFt > 0 ? Math.round(widthFt / 2) : 0;
}

export function computeRafterTailXPositions(widthFt: number): number[] {
  const count = computeRafterTailCount(widthFt);
  if (count <= 0) return [];
  const xs: number[] = [];
  for (let i = 0; i < count; i++) xs.push((widthFt / (count + 1)) * (i + 1));
  return xs;
}

export function computeDownspoutXPositions(totalWidthFt: number, qty: number): number[] {
  if (qty <= 0 || totalWidthFt <= 0) return [];
  const xs: number[] = [];
  for (let i = 0; i < qty; i++) xs.push((totalWidthFt / (qty + 1)) * (i + 1));
  return xs;
}

// Roof pitch tilts the roof plane down toward the front (away from the
// house, for drainage) about the house-side edge — so the front edge sits
// LOWER than the flat post height by this amount. Front-mounted trim
// (gutter, fascia, front plate, downspouts) attaches at this lowered edge,
// not at the post height itself.
export function computeFrontEdgeHeightFt(postHeightFt: number, projectionFt: number, roofPitchDeg: number): number {
  return postHeightFt - projectionFt * Math.tan((roofPitchDeg * Math.PI) / 180);
}

export function formatFeetInches(ft: number): string {
  const totalInches = Math.round(ft * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return inches === 0 ? `${feet}'` : `${feet}'-${inches}"`;
}

export function computeSceneBBox(
  runs: { widthFt: number; projectionFt: number; postHeightFt: number; originOffsetFt: number }[]
): BBox {
  if (runs.length === 0) return { widthFt: 0, depthFt: 0, heightFt: 0 };
  return {
    widthFt: Math.max(...runs.map((r) => r.originOffsetFt + r.widthFt)),
    depthFt: Math.max(...runs.map((r) => r.projectionFt)),
    heightFt: Math.max(...runs.map((r) => r.postHeightFt)),
  };
}
