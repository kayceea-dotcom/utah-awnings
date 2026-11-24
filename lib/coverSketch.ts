// Geometry behind the "Draw it" cover sketch. The sketch is a rectilinear
// polygon in feet, house wall along the top (y grows toward the front). It's
// only a faster way to fill in the numbers the quote forms already take, so
// everything here ends in `analyzeShape` turning the outline back into the
// two-run inputs (width/projection x2 + jog type) the pricing engine knows.

export interface Pt { x: number; y: number }

export type SketchJog = "none" | "ground" | "house";

/** The quote-form numbers a drawn shape stands for. */
export interface SketchRuns {
  width1: number;
  projection1: number;
  width2: number;
  projection2: number;
  jog: SketchJog;
}

export type SketchAnalysis =
  | { ok: true; runs: SketchRuns }
  | { ok: false; reason: string };

export const SNAP_FT = 0.5;
export const MIN_EDGE_FT = 1;
export const MAX_EDGE_FT = 100;

export function snap(v: number): number {
  return Math.round(v / SNAP_FT) * SNAP_FT;
}

// ── Runs -> outline ──────────────────────────────────────────────────────────

/** Clockwise (on screen, y down) outline of the runs: house wall along the
 *  top, left run = run 1. Matches how the cover diagram lays the runs out. */
export function shapeFromRuns(r: SketchRuns): Pt[] {
  const { width1: w1, projection1: p1, width2: w2, projection2: p2 } = r;
  const hasRun2 = r.jog !== "none" && w2 > 0 && p2 > 0;
  if (!hasRun2) return normalizeShape([{ x: 0, y: 0 }, { x: w1, y: 0 }, { x: w1, y: p1 }, { x: 0, y: p1 }]);
  const W = w1 + w2;
  if (r.jog === "house") {
    // Front stays flush, the house wall steps.
    const F = Math.max(p1, p2);
    const t1 = F - p1;
    const t2 = F - p2;
    return normalizeShape([
      { x: 0, y: t1 }, { x: w1, y: t1 }, { x: w1, y: t2 }, { x: W, y: t2 }, { x: W, y: F }, { x: 0, y: F },
    ]);
  }
  // Ground/deck jog: house wall flush, the front steps.
  return normalizeShape([
    { x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: p2 }, { x: w1, y: p2 }, { x: w1, y: p1 }, { x: 0, y: p1 },
  ]);
}

export interface RunRect { x: number; y: number; w: number; h: number }

/** The two runs as rectangles in the same coordinates as the outline. */
export function runRects(r: SketchRuns): RunRect[] {
  const rects: RunRect[] = [];
  const hasRun2 = r.jog !== "none" && r.width2 > 0 && r.projection2 > 0;
  const F = hasRun2 && r.jog === "house" ? Math.max(r.projection1, r.projection2) : 0;
  const y1 = r.jog === "house" && hasRun2 ? F - r.projection1 : 0;
  rects.push({ x: 0, y: y1, w: r.width1, h: r.projection1 });
  if (hasRun2) {
    const y2 = r.jog === "house" ? F - r.projection2 : 0;
    rects.push({ x: r.width1, y: y2, w: r.width2, h: r.projection2 });
  }
  return rects;
}

// ── Outline helpers ──────────────────────────────────────────────────────────

function cross(a: Pt, b: Pt, c: Pt): number {
  return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
}

/** Drops duplicate and collinear points and slides the outline so its top-left
 *  bounding corner sits at (0,0). */
export function normalizeShape(pts: Pt[]): Pt[] {
  let cur = pts.map((p) => ({ x: p.x, y: p.y }));
  let changed = true;
  while (changed && cur.length > 2) {
    changed = false;
    for (let i = 0; i < cur.length; i++) {
      const prev = cur[(i - 1 + cur.length) % cur.length];
      const here = cur[i];
      const next = cur[(i + 1) % cur.length];
      const dup = here.x === next.x && here.y === next.y;
      if (dup || cross(prev, here, next) === 0) {
        cur.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  const minX = Math.min(...cur.map((p) => p.x));
  const minY = Math.min(...cur.map((p) => p.y));
  return cur.map((p) => ({ x: p.x - minX, y: p.y - minY }));
}

export function boundsOf(pts: Pt[]): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number } {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/** Positive when the outline runs clockwise on screen (y down). */
export function signedArea(pts: Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

function isAxisAligned(a: Pt, b: Pt): boolean {
  return a.x === b.x || a.y === b.y;
}

export function edgeLength(pts: Pt[], i: number): number {
  const a = pts[i];
  const b = pts[(i + 1) % pts.length];
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}

/** Axis-aligned segments cross or touch exactly when their bounding boxes do. */
function segmentsTouch(a1: Pt, a2: Pt, b1: Pt, b2: Pt): boolean {
  return Math.max(Math.min(a1.x, a2.x), Math.min(b1.x, b2.x)) <= Math.min(Math.max(a1.x, a2.x), Math.max(b1.x, b2.x))
    && Math.max(Math.min(a1.y, a2.y), Math.min(b1.y, b2.y)) <= Math.min(Math.max(a1.y, a2.y), Math.max(b1.y, b2.y));
}

/** True when no two edges that aren't neighbours cross or touch. */
export function isSimple(pts: Pt[]): boolean {
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (segmentsTouch(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return false;
    }
  }
  return true;
}

function isValidOutline(pts: Pt[]): boolean {
  const n = pts.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const c = pts[(i + 2) % n];
    if (!isAxisAligned(a, b)) return false;
    // Neighbouring edges must turn a corner (one horizontal, one vertical).
    const abHorizontal = a.y === b.y;
    const bcHorizontal = b.y === c.y;
    if (abHorizontal === bcHorizontal) return false;
    const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (len < MIN_EDGE_FT || len > MAX_EDGE_FT) return false;
  }
  return signedArea(pts) > 0 && isSimple(pts);
}

// ── Editing ──────────────────────────────────────────────────────────────────

/** Drag a corner. The two edges meeting there stay straight, so the neighbour
 *  across the vertical edge follows in x and the neighbour across the
 *  horizontal edge follows in y. Returns null for a move that would make a
 *  too-short edge or tangle the outline - the caller keeps the old shape. */
export function moveVertex(pts: Pt[], i: number, rawX: number, rawY: number): Pt[] | null {
  const n = pts.length;
  const x = Math.max(0, snap(rawX));
  const y = Math.max(0, snap(rawY));
  const prevI = (i - 1 + n) % n;
  const nextI = (i + 1) % n;
  const next = pts.map((p) => ({ x: p.x, y: p.y }));
  next[i] = { x, y };
  if (pts[prevI].x === pts[i].x) next[prevI] = { x, y: pts[prevI].y };
  else next[prevI] = { x: pts[prevI].x, y };
  if (pts[nextI].x === pts[i].x) next[nextI] = { x, y: pts[nextI].y };
  else next[nextI] = { x: pts[nextI].x, y };
  return isValidOutline(next) ? next : null;
}

/** Set one edge to an exact length by moving its far corner along the edge. */
export function setEdgeLength(raw: Pt[], edge: number, lengthFt: number): Pt[] | null {
  const n = raw.length;
  const len = snap(lengthFt);
  if (!(len >= MIN_EDGE_FT) || len > MAX_EDGE_FT) return null;
  // Slide the outline well clear of the left/top limit first: stretching an
  // edge that runs leftward or upward has to grow past 0, and the result is
  // slid back to the origin by normalizeShape afterwards.
  const pts = raw.map((p) => ({ x: p.x + MAX_EDGE_FT, y: p.y + MAX_EDGE_FT }));
  const a = pts[edge];
  const bi = (edge + 1) % n;
  const b = pts[bi];
  const moved = a.y === b.y
    ? moveVertex(pts, bi, a.x + Math.sign(b.x - a.x) * len, b.y)
    : moveVertex(pts, bi, b.x, a.y + Math.sign(b.y - a.y) * len);
  return moved ? normalizeShape(moved) : null;
}

/** Turn a plain rectangle into a rectangle with one step in a front corner. */
export function addStep(pts: Pt[]): Pt[] {
  const b = boundsOf(pts);
  const nx = Math.min(Math.max(snap(b.w * 0.6), MIN_EDGE_FT), Math.max(MIN_EDGE_FT, b.w - MIN_EDGE_FT));
  const ny = Math.min(Math.max(snap(b.h * 0.6), MIN_EDGE_FT), Math.max(MIN_EDGE_FT, b.h - MIN_EDGE_FT));
  return [{ x: 0, y: 0 }, { x: b.w, y: 0 }, { x: b.w, y: ny }, { x: nx, y: ny }, { x: nx, y: b.h }, { x: 0, y: b.h }];
}

/** Squares the outline back off to its bounding rectangle. */
export function removeStep(pts: Pt[]): Pt[] {
  const b = boundsOf(pts);
  return [{ x: 0, y: 0 }, { x: b.w, y: 0 }, { x: b.w, y: b.h }, { x: 0, y: b.h }];
}

// ── Outline -> runs ──────────────────────────────────────────────────────────

/** Reads a drawn outline as the quote-form numbers, or says why it can't. */
export function analyzeShape(raw: Pt[]): SketchAnalysis {
  let pts = normalizeShape(raw);
  if (pts.length < 4) return { ok: false, reason: "Draw a closed shape with at least four corners." };
  for (let i = 0; i < pts.length; i++) {
    if (!isAxisAligned(pts[i], pts[(i + 1) % pts.length])) {
      return { ok: false, reason: "Angled edges can't be priced yet. Keep every edge straight across or straight up and down." };
    }
  }
  if (signedArea(pts) < 0) pts = pts.slice().reverse();
  if (!isSimple(pts)) return { ok: false, reason: "The outline crosses itself. Drag a corner back." };

  const b = boundsOf(pts);
  if (pts.length === 4) {
    return { ok: true, runs: { width1: b.w, projection1: b.h, width2: 0, projection2: 0, jog: "none" } };
  }
  if (pts.length !== 6) {
    return {
      ok: false,
      reason: `This shape has ${pts.length} corners. Flat Panel and V-Panel can price a rectangle, or a rectangle with one step. Shapes with more steps, notches or angles aren't supported yet.`,
    };
  }

  // One step: a hexagon with exactly one corner strictly inside the bounding box.
  const inside = pts.filter((p) => p.x > 0 && p.x < b.w && p.y > 0 && p.y < b.h);
  if (inside.length !== 1) return { ok: false, reason: "This outline isn't a rectangle with a single step." };
  const { x: nx, y: ny } = inside[0];
  const has = (x: number, y: number) => pts.some((p) => p.x === x && p.y === y);
  const W = b.w;
  const H = b.h;

  if (!has(W, H)) {
    // Front-right corner missing: left run is the full depth.
    return { ok: true, runs: { width1: nx, projection1: H, width2: W - nx, projection2: ny, jog: "ground" } };
  }
  if (!has(0, H)) {
    return { ok: true, runs: { width1: nx, projection1: ny, width2: W - nx, projection2: H, jog: "ground" } };
  }
  if (!has(W, 0)) {
    // House-side corner missing: the house wall steps, the front stays flush.
    return { ok: true, runs: { width1: nx, projection1: H, width2: W - nx, projection2: H - ny, jog: "house" } };
  }
  if (!has(0, 0)) {
    return { ok: true, runs: { width1: nx, projection1: H - ny, width2: W - nx, projection2: H, jog: "house" } };
  }
  return { ok: false, reason: "This outline isn't a rectangle with a single step." };
}

/** Flip a one-step shape between a stepped front and a stepped house wall. */
export function toggleJog(r: SketchRuns): SketchRuns {
  if (r.jog === "none") return r;
  return { ...r, jog: r.jog === "ground" ? "house" : "ground" };
}

/** Swap which side the two runs sit on. */
export function swapRuns(r: SketchRuns): SketchRuns {
  if (r.jog === "none") return r;
  return { ...r, width1: r.width2, projection1: r.projection2, width2: r.width1, projection2: r.projection1 };
}

export function areaSqFt(r: SketchRuns): number {
  return r.width1 * r.projection1 + (r.jog !== "none" ? r.width2 * r.projection2 : 0);
}

/** "12" or "12.5" - feet without a trailing .0. */
export function fmtFt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
