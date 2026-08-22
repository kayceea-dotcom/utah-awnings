import type { BeamConfig } from "./pricing/types";

export interface CoverDiagramGeometryInput {
  projection1: number;
  width1: number;
  projection2?: number;
  width2?: number;
  posts1?: number;
  posts2?: number;
  downspouts?: number;
  downspoutSide?: string;
  showRafterTails?: boolean;
  jogType?: string;
  beams?: BeamConfig[];
  beamType1?: string;
  beamType2?: string;
  /** Pergola only - open lattice structure, no panel. Swaps the solid cover
   *  fill for individual rafters (full length, house to tip) crossing
   *  individual lattice tubes, and pulls the beam in to a 1ft overhang
   *  (vs. the generic 1.5ft inset every other product uses). */
  isLattice?: boolean;
  /** "2x2" (default) or "2x3" - real tube width, matches PergolaInputs.latticeType. */
  latticeType?: string;
  /** "1.5x" widens the gap; anything else (including unset) is the default
   *  2x-tube-width spacing. Matches PergolaInputs.latticeSpacing. */
  latticeSpacing?: string;
}

export interface CoverDiagramGeometry {
  svgW: number;
  svgH: number;
  ox: number;
  oy: number;
  PAD: number;
  HOUSE_H: number;
  TAIL_LEN: number;
  hasRun2: boolean;
  isHouseJog: boolean;
  totalWidth: number;
  totalW: number;
  scale: number;
  coverW1: number;
  coverH1: number;
  coverW2: number;
  coverH2: number;
  run1TopY: number;
  run2TopY: number;
  run1FrontY: number;
  run2FrontY: number;
  beamY1: number;
  beamY2: number;
  postPositions: number[];
  postPositions2: number[];
  multiSpanBeams: { y: number; postXs: number[] }[];
  tailCount: number;
  tailCount2: number;
  frontEdgeY: number;
  frontEdgeY2: number;
  tailTipY: number;
  tailTipY2: number;
  downspoutPositions: { x: number; y: number }[];
  beamType1: string;
  beamType2: string;
  width1: number;
  width2: number;
  projection1: number;
  showRafterTails: boolean;
  isLattice: boolean;
  /** X positions of each full-length rafter (house to tip), pergola only. */
  rafterXs: number[];
  /** Y positions of each lattice tube cross-line (spans the width), pergola only. */
  tubeYs: number[];
}

// Post X positions evenly spaced across a run's width - 1.5ft inset from each
// end, matching the beam's own real support spacing. Shared by the two
// primary runs and any additional/multi-span beam (they all use the same rule).
function spacedPostXs(count: number, widthFt: number, xOffsetPx: number, coverWidthPx: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [xOffsetPx + coverWidthPx / 2];
  const xs: number[] = [];
  for (let i = 0; i < count; i++) {
    const pct = i === 0 ? 1.5 / widthFt
      : i === count - 1 ? (widthFt - 1.5) / widthFt
      : (1.5 + (widthFt - 3) * i / (count - 1)) / widthFt;
    xs.push(xOffsetPx + pct * coverWidthPx);
  }
  return xs;
}

// All the coordinate math behind the top-down cover diagram, pulled out so
// both the on-screen SVG (CoverDiagram.tsx) and the printable contract PDF
// (coverDiagram.pdf.tsx) draw from exactly the same numbers - two rendering
// technologies (DOM SVG vs PDF primitives) necessarily need separate drawing
// code, but the geometry itself only ever lives here.
export function computeCoverDiagramGeometry(input: CoverDiagramGeometryInput): CoverDiagramGeometry | null {
  const {
    projection1, width1,
    projection2 = 0, width2 = 0,
    posts1 = 0, posts2 = 0,
    downspouts = 1, downspoutSide = "right",
    showRafterTails = true,
    jogType = "ground",
    beams = [],
    beamType1 = "3x8", beamType2 = "3x8",
    isLattice = false,
    latticeType = "2x2",
    latticeSpacing = "1x",
  } = input;

  if (!projection1 || !width1) return null;

  // Orientation: house wall at TOP, cover extends DOWNWARD
  // X = width (left to right), Y = projection (top to bottom)
  const PAD = 40;
  const HOUSE_H = 20;
  const TAIL_LEN = 12;

  // Pergola-only: rafters run every 2ft of width (matches lib/pricing/pergola.ts
  // rafterQty), the beam sits a 1ft overhang back from the rafter tips (not the
  // generic 1.5ft other products use), and lattice tubes cross the rafters at
  // their real tube-width + gap pitch.
  const LATTICE_RAFTER_SPACING_FT = 2;
  const LATTICE_OVERHANG_FT = 1;
  const tubeWidthIn = latticeType === "2x3" ? 3 : 2;
  const tubePitchIn = latticeSpacing === "1.5x" ? tubeWidthIn * 3 : tubeWidthIn * 2;

  const hasRun2 = projection2 > 0 && width2 > 0;
  const isHouseJog = hasRun2 && jogType === "house";
  const totalWidth = hasRun2 ? width1 + width2 : width1;

  const availW = 300;
  const availH = 240;
  const scaleX = availW / totalWidth;
  const scaleY = availH / Math.max(projection1, projection2 || 0);
  const scale = Math.min(scaleX, scaleY, 14);

  const coverW1 = width1 * scale;
  const coverH1 = projection1 * scale;
  const coverW2 = hasRun2 ? width2 * scale : 0;
  const coverH2 = hasRun2 ? projection2 * scale : 0;
  const totalW = totalWidth * scale;

  const svgW = totalW + PAD * 2 + 30;
  const svgH = Math.max(coverH1, coverH2) + PAD * 2 + HOUSE_H + TAIL_LEN + 30;

  // Origin = top-left corner of cover, below house wall
  const ox = PAD;
  const oy = PAD + HOUSE_H;

  // A house jog keeps the front edge (beam/gutter) as one continuous, flush line and
  // steps the house wall/hanger instead to follow the wall's jog. A ground/deck jog
  // (the default) is the opposite: house wall stays flush, front edge steps.
  const commonFrontY = oy + Math.max(coverH1, coverH2 || 0);
  const run1TopY   = isHouseJog ? commonFrontY - coverH1 : oy;
  const run2TopY   = isHouseJog ? commonFrontY - coverH2 : oy;
  const run1FrontY = isHouseJog ? commonFrontY : oy + coverH1;
  const run2FrontY = isHouseJog ? commonFrontY : oy + coverH2;

  // Beam Y = 1.5ft from BOTTOM (front) of cover - except a pergola's rafters
  // are structural and overhang the beam by exactly 1ft, not the generic inset.
  const beamY1 = run1FrontY - (isLattice ? LATTICE_OVERHANG_FT : 1.5) * scale;
  const beamY2 = run2FrontY - 1.5 * scale;

  // Post X positions along beam - 1.5ft from each end, evenly spaced
  const postPositions = spacedPostXs(posts1, width1, ox, coverW1);
  const postPositions2 = hasRun2 ? spacedPostXs(posts2, width2, ox + coverW1, coverW2) : [];

  // Multi-span beams (Additional / Multi-Span Beams) - run 1 only. Y position is
  // measured from the house wall (0 = at the house), clamped inside the cover so
  // an out-of-range value doesn't draw off the diagram.
  const multiSpanBeams = beams.map((b) => {
    const y = run1TopY + Math.max(0, Math.min(b.positionFromHouse, projection1)) * scale;
    return { y, postXs: spacedPostXs(b.posts, width1, ox, coverW1) };
  });

  const tailCount = Math.round(width1 / 2);
  const frontEdgeY = run1FrontY;
  // A lattice's rafters already run the full length to the front edge - no
  // extra stub past it like the generic rafter-tail flourish other products get.
  const tailTipY = isLattice ? frontEdgeY : showRafterTails ? frontEdgeY + TAIL_LEN : frontEdgeY;

  const tailCount2 = hasRun2 ? Math.round(width2 / 2) : 0;
  const frontEdgeY2 = run2FrontY;
  const tailTipY2 = showRafterTails ? frontEdgeY2 + TAIL_LEN : frontEdgeY2;

  // Rafters - full length (house to tip), evenly spaced, one every 2ft of
  // width (same count as lib/pricing/pergola.ts rafterQty).
  const rafterCount = isLattice ? Math.max(0, Math.round(width1 / LATTICE_RAFTER_SPACING_FT)) : 0;
  const rafterXs = Array.from({ length: rafterCount }, (_, i) =>
    ox + (width1 / (rafterCount + 1)) * (i + 1) * scale);

  // Lattice tubes - cross-lines spanning the width, spaced at the real tube
  // pitch (tube width + gap) along the full projection, house to tip.
  const tubePitchPx = (tubePitchIn / 12) * scale;
  const tubeYs: number[] = [];
  if (isLattice && tubePitchPx > 0) {
    for (let y = run1TopY + tubePitchPx / 2; y <= frontEdgeY; y += tubePitchPx) {
      tubeYs.push(y);
    }
  }

  // Downspouts - hang just in front of (past) the corner post, at the true
  // front edge rather than the post's own beam-line position.
  const leftPos = { x: postPositions.length > 0 ? postPositions[0] : ox, y: frontEdgeY };
  const rightPos = hasRun2
    ? { x: postPositions2.length > 0 ? postPositions2[postPositions2.length - 1] : ox + coverW1 + coverW2, y: frontEdgeY2 }
    : { x: postPositions.length > 0 ? postPositions[postPositions.length - 1] : ox + coverW1, y: frontEdgeY };
  const downspoutPositions =
    downspouts === 1 ? [downspoutSide === "left" ? leftPos : rightPos] :
    downspouts >= 2  ? [leftPos, rightPos] : [];

  return {
    svgW, svgH, ox, oy, PAD, HOUSE_H, TAIL_LEN,
    hasRun2, isHouseJog, totalWidth, totalW, scale,
    coverW1, coverH1, coverW2, coverH2,
    run1TopY, run2TopY, run1FrontY, run2FrontY,
    beamY1, beamY2,
    postPositions, postPositions2, multiSpanBeams,
    tailCount, tailCount2, frontEdgeY, frontEdgeY2, tailTipY, tailTipY2,
    downspoutPositions,
    beamType1, beamType2, width1, width2, projection1, showRafterTails,
    isLattice, rafterXs, tubeYs,
  };
}
