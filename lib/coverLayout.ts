// Beams and posts for the cover sketch. Works in the same feet-from-the-top-
// left coordinates as lib/coverSketch.ts. Everything here is a view over the
// numbers the quote already prices from (beam types, post counts, additional
// beams) plus, new, the exact spot of each post.

import { runRects, snap, type SketchRuns } from "./coverSketch";
import type { BeamConfig, MountStyle, PostLayout } from "./pricing/types";

export const MIN_POST_GAP_FT = 1;
/** Front beams sit this far back from the front edge (matches the diagram). */
export const BEAM_INSET_FT = 1.5;
/** Matches the diagram: an additional beam can sit anywhere from the house to the front. */
export const MIN_EXTRA_BEAM_FROM_HOUSE_FT = 1;

export interface CoverLayout {
  beamType1: string;
  beamType2: string;
  rearBeamType: string;
  xs1: number[];
  xs2: number[];
  rearXs: number[];
  /** Additional / multi-span beams (run 1 only), each carrying its own post spots. */
  extra: BeamConfig[];
}

export type BeamRowKind = "front" | "front1" | "front2" | "rear" | "extra";
export type BeamTypeSet = "primary" | "secondary" | "plain";

export interface BeamRow {
  id: string;
  kind: BeamRowKind;
  label: string;
  type: string;
  typeSet: BeamTypeSet;
  /** True when there's a real beam member (not "no beam", where posts sit at the front edge). */
  hasBeam: boolean;
  y: number;
  x0: number;
  x1: number;
  xs: number[];
}

/** Evenly spaced post spots, 1.5ft in from each end - the same rule the diagram uses. */
export function evenXs(count: number, x0: number, x1: number): number[] {
  if (count <= 0) return [];
  const w = x1 - x0;
  if (count === 1) return [round2(x0 + w / 2)];
  const xs: number[] = [];
  for (let i = 0; i < count; i++) {
    const pct = i === 0 ? 1.5 / w
      : i === count - 1 ? (w - 1.5) / w
      : (1.5 + (w - 3) * i / (count - 1)) / w;
    xs.push(round2(x0 + pct * w));
  }
  return xs;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function validXs(xs: number[] | undefined, count: number, min: number, max: number): number[] | null {
  if (!Array.isArray(xs) || xs.length !== count) return null;
  if (!xs.every((x) => Number.isFinite(x) && x >= min - 0.01 && x <= max + 0.01)) return null;
  return xs.slice().sort((a, b) => a - b);
}

function hasBeamType(type: string): boolean {
  return type !== "none" && type !== "";
}

export interface LayoutSource {
  runs: SketchRuns;
  mountStyle: MountStyle;
  beamType1: string;
  beamType2: string;
  rearBeamType: string;
  posts1: number;
  posts2: number;
  /** Rear posts (freestanding) or SkyLift risers (roof mount). */
  rearCount: number;
  postLayout?: PostLayout;
  beams: BeamConfig[];
}

/** Current quote numbers -> layout, using stored post spots where they still
 *  fit and even spacing otherwise. */
export function layoutFromInputs(s: LayoutSource): CoverLayout {
  const { runs } = s;
  const hasRun2 = runs.jog !== "none" && runs.width2 > 0 && runs.projection2 > 0;
  const W = hasRun2 ? runs.width1 + runs.width2 : runs.width1;
  const isHouse = hasRun2 && runs.jog === "house";

  let xs1: number[];
  let xs2: number[];
  if (isHouse) {
    const a = validXs(s.postLayout?.xs1, s.posts1, 0, W);
    const b = validXs(s.postLayout?.xs2, hasRun2 ? s.posts2 : 0, 0, W);
    if (a && b) { xs1 = a; xs2 = b; } else {
      // One continuous beam: the diagram spreads every post across the full width.
      const all = evenXs(s.posts1 + s.posts2, 0, W);
      xs1 = all.slice(0, s.posts1);
      xs2 = all.slice(s.posts1);
    }
  } else {
    xs1 = validXs(s.postLayout?.xs1, s.posts1, 0, runs.width1) ?? evenXs(s.posts1, 0, runs.width1);
    xs2 = hasRun2
      ? (validXs(s.postLayout?.xs2, s.posts2, runs.width1, W) ?? evenXs(s.posts2, runs.width1, W))
      : [];
  }
  const rearXs = validXs(s.postLayout?.rearXs, s.rearCount, 0, W) ?? evenXs(s.rearCount, 0, W);
  const extra = (s.beams || []).map((b) => ({
    ...b,
    postXs: validXs(b.postXs, b.posts, 0, runs.width1) ?? evenXs(b.posts, 0, runs.width1),
  }));
  return {
    beamType1: s.beamType1, beamType2: s.beamType2, rearBeamType: s.rearBeamType,
    xs1, xs2, rearXs, extra,
  };
}

/** The beams drawn for this shape, each with its posts. */
export function beamRows(runs: SketchRuns, layout: CoverLayout, mount: MountStyle, extraNumberOffset = 3): BeamRow[] {
  const rects = runRects(runs);
  const hasRun2 = rects.length === 2;
  const isHouse = hasRun2 && runs.jog === "house";
  const W = hasRun2 ? runs.width1 + runs.width2 : runs.width1;
  const rows: BeamRow[] = [];

  const frontY = (r: { y: number; h: number }, type: string) => r.y + r.h - (hasBeamType(type) ? BEAM_INSET_FT : 0);

  if (isHouse) {
    // One continuous beam along the flush front, posts across the full width.
    const r1 = rects[0];
    rows.push({
      id: "front", kind: "front", label: "Front beam", type: layout.beamType1, typeSet: "primary",
      hasBeam: hasBeamType(layout.beamType1), y: frontY(r1, layout.beamType1), x0: 0, x1: W,
      xs: [...layout.xs1, ...layout.xs2].sort((a, b) => a - b),
    });
  } else {
    const r1 = rects[0];
    rows.push({
      id: "front1", kind: "front1", label: hasRun2 ? "Front beam 1" : "Front beam", type: layout.beamType1, typeSet: "primary",
      hasBeam: hasBeamType(layout.beamType1), y: frontY(r1, layout.beamType1), x0: r1.x, x1: r1.x + r1.w, xs: layout.xs1,
    });
    if (hasRun2) {
      const r2 = rects[1];
      rows.push({
        id: "front2", kind: "front2", label: "Front beam 2", type: layout.beamType2, typeSet: "secondary",
        hasBeam: hasBeamType(layout.beamType2), y: frontY(r2, layout.beamType2), x0: r2.x, x1: r2.x + r2.w, xs: layout.xs2,
      });
    }
  }

  if (mount !== "attached") {
    rows.push({
      id: "rear", kind: "rear", label: mount === "roof_mount" ? "Rear beam (SkyLift)" : "Rear beam", type: layout.rearBeamType, typeSet: "plain",
      hasBeam: true, y: rects[0].y + BEAM_INSET_FT, x0: 0, x1: W, xs: layout.rearXs,
    });
  }

  layout.extra.forEach((b, i) => {
    rows.push({
      id: "extra" + i, kind: "extra", label: "Beam " + (i + extraNumberOffset), type: b.type, typeSet: "plain",
      hasBeam: true, y: rects[0].y + Math.max(0, Math.min(b.positionFromHouse, runs.projection1)),
      x0: 0, x1: runs.width1, xs: b.postXs ?? [],
    });
  });
  return rows;
}

/** Write one row's post spots back into the layout. */
export function setRowXs(layout: CoverLayout, runs: SketchRuns, rowId: string, rawXs: number[]): CoverLayout {
  const xs = rawXs.slice().sort((a, b) => a - b).map(round2);
  if (rowId === "front1") return { ...layout, xs1: xs };
  if (rowId === "front2") return { ...layout, xs2: xs };
  if (rowId === "front") {
    // A continuous beam over two runs: the posts left of the step belong to run 1.
    return { ...layout, xs1: xs.filter((x) => x < runs.width1), xs2: xs.filter((x) => x >= runs.width1) };
  }
  if (rowId === "rear") return { ...layout, rearXs: xs };
  if (rowId.startsWith("extra")) {
    const i = Number(rowId.slice(5));
    const extra = layout.extra.map((b, k) => (k === i ? { ...b, postXs: xs, posts: xs.length } : b));
    return { ...layout, extra };
  }
  return layout;
}

function findRow(layout: CoverLayout, runs: SketchRuns, mount: MountStyle, rowId: string): BeamRow | undefined {
  return beamRows(runs, layout, mount).find((r) => r.id === rowId);
}

/** Drop a post on a beam at x. Null when it's off the beam or too close to another post. */
export function addPost(layout: CoverLayout, runs: SketchRuns, mount: MountStyle, rowId: string, rawX: number): CoverLayout | null {
  const row = findRow(layout, runs, mount, rowId);
  if (!row) return null;
  const x = Math.min(Math.max(snap(rawX), row.x0), row.x1);
  if (row.xs.some((p) => Math.abs(p - x) < MIN_POST_GAP_FT)) return null;
  return setRowXs(layout, runs, rowId, [...row.xs, x]);
}

/** Slide a post along its beam, staying a foot clear of its neighbours. */
export function movePost(layout: CoverLayout, runs: SketchRuns, mount: MountStyle, rowId: string, index: number, rawX: number): CoverLayout | null {
  const row = findRow(layout, runs, mount, rowId);
  if (!row || index < 0 || index >= row.xs.length) return null;
  const lo = index > 0 ? row.xs[index - 1] + MIN_POST_GAP_FT : row.x0;
  const hi = index < row.xs.length - 1 ? row.xs[index + 1] - MIN_POST_GAP_FT : row.x1;
  if (lo > hi) return null;
  const x = Math.min(Math.max(snap(rawX), lo), hi);
  const xs = row.xs.slice();
  xs[index] = x;
  return setRowXs(layout, runs, rowId, xs);
}

export function removePost(layout: CoverLayout, runs: SketchRuns, mount: MountStyle, rowId: string, index: number): CoverLayout | null {
  const row = findRow(layout, runs, mount, rowId);
  if (!row || index < 0 || index >= row.xs.length) return null;
  return setRowXs(layout, runs, rowId, row.xs.filter((_, i) => i !== index));
}

export function setRowType(layout: CoverLayout, rowId: string, type: string): CoverLayout {
  if (rowId === "front1" || rowId === "front") return { ...layout, beamType1: type };
  if (rowId === "front2") return { ...layout, beamType2: type };
  if (rowId === "rear") return { ...layout, rearBeamType: type };
  if (rowId.startsWith("extra")) {
    const i = Number(rowId.slice(5));
    return { ...layout, extra: layout.extra.map((b, k) => (k === i ? { ...b, type } : b)) };
  }
  return layout;
}

/** Add an additional beam across run 1, `fromHouse` feet back from the house wall. */
export function addExtraBeam(layout: CoverLayout, runs: SketchRuns, rawFromHouse: number, defaults: { type: string; postHeight: number }): CoverLayout {
  const fromHouse = Math.min(Math.max(snap(rawFromHouse), MIN_EXTRA_BEAM_FROM_HOUSE_FT), Math.max(MIN_EXTRA_BEAM_FROM_HOUSE_FT, runs.projection1 - MIN_EXTRA_BEAM_FROM_HOUSE_FT));
  const xs = evenXs(2, 0, runs.width1);
  const beam: BeamConfig = {
    type: defaults.type, qty: 1, length: Math.max(0, runs.width1 - 0.5),
    positionFromHouse: fromHouse, posts: xs.length, postHeight: defaults.postHeight, postXs: xs,
  };
  return { ...layout, extra: [...layout.extra, beam] };
}

export function removeExtraBeam(layout: CoverLayout, rowId: string): CoverLayout {
  if (!rowId.startsWith("extra")) return layout;
  const i = Number(rowId.slice(5));
  return { ...layout, extra: layout.extra.filter((_, k) => k !== i) };
}

export function setExtraBeamPosition(layout: CoverLayout, runs: SketchRuns, rowId: string, rawFromHouse: number): CoverLayout {
  if (!rowId.startsWith("extra")) return layout;
  const i = Number(rowId.slice(5));
  const v = Math.min(Math.max(snap(rawFromHouse), MIN_EXTRA_BEAM_FROM_HOUSE_FT), Math.max(MIN_EXTRA_BEAM_FROM_HOUSE_FT, runs.projection1 - MIN_EXTRA_BEAM_FROM_HOUSE_FT));
  return { ...layout, extra: layout.extra.map((b, k) => (k === i ? { ...b, positionFromHouse: v } : b)) };
}

/** After the shape changes, keep each beam's post count but re-space them evenly in the new spans. */
export function respaceLayout(layout: CoverLayout, runs: SketchRuns, prevHadRun2: boolean): CoverLayout {
  const hasRun2 = runs.jog !== "none" && runs.width2 > 0 && runs.projection2 > 0;
  const W = hasRun2 ? runs.width1 + runs.width2 : runs.width1;
  const isHouse = hasRun2 && runs.jog === "house";
  const n1 = layout.xs1.length;
  // A newly added second run starts with 2 posts and a beam like run 1's,
  // the same companions the form copies over.
  const n2 = !hasRun2 ? 0 : prevHadRun2 ? layout.xs2.length : layout.xs2.length || 2;
  const beamType2 = hasRun2 && !prevHadRun2 && !layout.beamType2 ? layout.beamType1 : layout.beamType2;
  let xs1: number[];
  let xs2: number[];
  if (isHouse) {
    const all = evenXs(n1 + n2, 0, W);
    xs1 = all.slice(0, n1);
    xs2 = all.slice(n1);
  } else {
    xs1 = evenXs(n1, 0, runs.width1);
    xs2 = hasRun2 ? evenXs(n2, runs.width1, W) : [];
  }
  return {
    ...layout,
    beamType2,
    xs1, xs2,
    rearXs: evenXs(layout.rearXs.length, 0, W),
    extra: layout.extra.map((b) => ({
      ...b,
      positionFromHouse: Math.min(b.positionFromHouse, Math.max(0, runs.projection1 - MIN_EXTRA_BEAM_FROM_HOUSE_FT)),
      length: Math.max(0, runs.width1 - 0.5),
      postXs: evenXs(b.posts, 0, runs.width1),
    })),
  };
}

/** Spans between neighbouring posts, plus the overhang past each end post. */
export function spansOf(row: BeamRow): number[] {
  if (row.xs.length < 2) return [];
  const spans: number[] = [];
  for (let i = 1; i < row.xs.length; i++) spans.push(round2(row.xs[i] - row.xs[i - 1]));
  return spans;
}

/** The post spots to store on the quote. */
export function postLayoutOf(layout: CoverLayout): PostLayout {
  return { xs1: layout.xs1, xs2: layout.xs2, rearXs: layout.rearXs };
}
