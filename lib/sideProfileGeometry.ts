export interface SideProfileGeometryInput {
  projection: number;
  postHeight: number;
  deckHeight?: number;
  houseAttachment?: string;
  groundAttachment?: string;
  beamType?: string;
  wrapType?: string;
  hasPanel?: boolean;
  panelOverhangInches?: number;
  endCut?: string;
  showRafterTail?: boolean;
  /** "freestanding" draws a mirrored post+beam at the house end instead of a
   *  wall/eave - fully self-supporting front and back, no house tie-in. */
  mountStyle?: string;
  /** Rear post's own height/beam type - falls back to the front post's own
   *  values when not given. */
  rearPostHeight?: number;
  rearBeamType?: string;
  /** Rear beam's own end-cut style - falls back to the front's endCut when
   *  not given. */
  rearEndCut?: string;
  /** Pergola only - open lattice structure. Draws a real 6in-tall rafter
   *  (not a wrap-kit panel) running house-to-tip with a 1ft overhang past
   *  the beam, plus 2x2 tube cross-sections spaced along its length. */
  isLattice?: boolean;
  latticeType?: string;
  latticeSpacing?: string;
}

export interface SideProfileGeometry {
  svgW: number;
  svgH: number;
  groundY: number;
  surfaceY: number;
  deckY: number | null;
  deckHpx: number;
  postX: number;
  postWidth: number;
  postTopY: number;
  postBottomY: number;
  embeddedBottomY: number | null;
  beamTopY: number;
  beamHeight: number;
  beamWidth: number;
  panelTopY: number;
  panelBottomY: number;
  panelHeight: number;
  panelFrontX: number;
  /** Panel's back edge - flush with houseX when attached (tucks under the
   *  hanger), or overhung past the rear beam by the same amount as the
   *  front when freestanding (no house wall to tuck under). */
  panelBackX: number;
  houseX: number;
  roofY: number;
  tailStartX: number;
  tailW: number;
  footingX: number;
  footingWidth: number;
  scale: number;
  isDeck: boolean;
  isGroundMount: boolean;
  houseAttachment: string;
  groundAttachment: string;
  deckHeight: number;
  postHeight: number;
  projection: number;
  endCut: string;
  /** Rear beam's resolved end-cut style (freestanding only) - falls back to
   *  endCut when rearEndCut isn't given. */
  rearEndCut: string;
  showRafterTail: boolean;
  isLattice: boolean;
  /** X positions of each lattice tube cross-section along the rafter, pergola only. */
  tubeXs: number[];
  /** Px size (both width and height) of each tube cross-section. */
  tubeSize: number;
  isFreestanding: boolean;
  /** Mirrored post+beam at the house end (freestanding only) - null when
   *  attached (the house wall/eave is drawn there instead). */
  rear: {
    postX: number; postTopY: number; postBottomY: number; embeddedBottomY: number | null;
    postHeight: number;
    beamTopY: number; beamHeight: number; beamWidth: number;
    footingX: number; footingWidth: number;
  } | null;
  isEaveMount: boolean;
  /** Soffit board (eave/angled_eave only) - horizontal, wall to fascia,
   *  the eave's real 2ft projection. */
  eaveSoffit: { x: number; y: number; width: number; height: number };
  /** Fascia board (eave/angled_eave only) - vertical, real 6in face where
   *  the awning attaches. */
  eaveFascia: { x: number; y: number; width: number; height: number };
  /** Roof edge line (eave/angled_eave only) - true 45deg (run = rise) off
   *  the fascia's top, drawn as a thick stroke so it reads as roof
   *  sheathing, not just an outline edge. */
  eaveRoofLine: { x1: number; y1: number; x2: number; y2: number };
  /** Y where the plain wall stub below the eave should start - the bottom
   *  of the eave, matching where the soffit board sits. */
  wallStubTopY: number;
  /** X of the wall's outer face for an eave mount - set back from the
   *  fascia by the eave's full projection, since a real eave overhangs
   *  past the wall rather than sitting flush with it. Equals houseX for
   *  every other house attachment. */
  eaveWallX: number;
}

// Real beam depth (the "tall" dimension when mounted, viewed end-on in this
// side profile) - the second number in the beam's name, matching the label
// on the beam type picker ("4in I-Beam" = 4, "7in I-Beam" = 7).
function beamHeightInches(beamType: string): number {
  switch (beamType) {
    case "3x3": return 3;
    case "4_i_beam": return 4;
    case "7_i_beam": return 7;
    case "3x8":
    case "double_3x8":
    default: return 8;
  }
}

// Panel/fascia edge thickness as it actually reads at the front of the
// cover: bare panel with no wrap kit is thinner than a wrapped edge, and a
// 3x8 wrap kit reads thicker than a 2x6 one.
function panelHeightInches(wrapType: string): number {
  if (wrapType === "3x8") return 8;
  if (wrapType === "2x6") return 6;
  return 5;
}

// All the coordinate math behind the side (elevation) profile diagram - deck
// height, footing/embed depth, post height, beam thickness, panel/roofline
// and rafter-tail placement. Kept separate from drawing code
// (SideProfileDiagram.tsx for the browser, sideProfile.pdf.tsx for the
// printable contract) so both draw from exactly the same numbers.
export function computeSideProfileGeometry(input: SideProfileGeometryInput): SideProfileGeometry | null {
  const {
    projection, postHeight,
    deckHeight = 0,
    houseAttachment = "stucco",
    groundAttachment = "concrete",
    beamType = "3x8",
    wrapType = "none",
    hasPanel = true,
    panelOverhangInches = 18,
    endCut = "beveled",
    showRafterTail = true,
    isLattice = false,
    latticeType = "2x2",
    latticeSpacing = "1x",
    mountStyle = "attached",
    rearPostHeight,
    rearBeamType,
    rearEndCut,
  } = input;

  if (!projection || !postHeight) return null;

  const isFreestanding = mountStyle === "freestanding";

  const PAD = 44;
  const GROUND_MARGIN = 26;
  const TAIL_W = 16;

  // Real 2x6 rafter (always - lib/pricing/pergola.ts hardcodes 2x6 regardless
  // of any gauge setting) with a 1ft overhang past the beam, plus 2x2 (or
  // 2x3) tube cross-sections at their real spacing along its full length.
  const LATTICE_RAFTER_HEIGHT_IN = 6;
  const LATTICE_OVERHANG_FT = 1;
  const tubeWidthIn = latticeType === "2x3" ? 3 : 2;
  const tubePitchIn = latticeSpacing === "1.5x" ? tubeWidthIn * 3 : tubeWidthIn * 2;

  const availW = 300;
  const scaleX = availW / projection;
  const scaleY = 140 / postHeight;
  const scale = Math.min(scaleX, scaleY, 16);

  const postHpx = postHeight * scale;
  const projPx = projection * scale;
  const deckHpx = deckHeight * scale;

  const isDeck = groundAttachment === "deck" && deckHeight > 0;
  const isGroundMount = groundAttachment === "ground_mount";

  // Beam is drawn end-on (its real cross-section), not as a long flat slab
  // along the projection - a 3x8 beam is 3in wide, 8in tall when mounted.
  const beamHeight = (beamHeightInches(beamType) / 12) * scale;
  const beamWidth = (3 / 12) * scale + 6; // real 3in depth, floored so it stays visible at small scale

  // Panel/wrap edge sits directly on top of the beam. Products with no
  // panel (pergola - open lattice, nothing to wrap) get 0, not a flat
  // pixel placeholder - a raw px constant here would silently distort the
  // rafter tail's height (which spans panel+beam) since it wouldn't scale
  // with the diagram's actual px-per-foot factor like every other real
  // dimension does.
  const panelHeight = isLattice
    ? (LATTICE_RAFTER_HEIGHT_IN / 12) * scale
    : hasPanel ? (panelHeightInches(wrapType) / 12) * scale : 0;
  // Panel overhangs past the beam's front face - 18in is the normal default,
  // matching how the cover material actually extends past its support beam.
  // A pergola's rafter is structural, not a wrap - it overhangs by exactly 1ft.
  const overhangPx = isLattice
    ? LATTICE_OVERHANG_FT * scale
    : hasPanel ? (panelOverhangInches / 12) * scale : 0;

  // Freestanding shifts the house-end reference point right by the overhang
  // amount, leaving room on the diagram's left edge for the panel to overhang
  // past the rear beam by the same amount as it already does past the front -
  // "houseX" still marks where the rear beam itself sits either way.
  const houseX = PAD + (isFreestanding ? overhangPx : 0);
  const postX = houseX + projPx;
  const panelFrontX = postX + beamWidth / 2 + overhangPx;
  const panelBackX = isFreestanding ? houseX - overhangPx : houseX;
  // Flush with the panel's own front edge - no gap, the rafter tail is
  // attached right there, not floating in front of the cover.
  const tailStartX = panelFrontX;

  // Lattice tube cross-sections - spaced along the rafter's full length
  // (back to tip, including any rear overhang), same real pitch as the
  // top-view diagram.
  const tubeSize = (tubeWidthIn / 12) * scale;
  const tubePitchPx = (tubePitchIn / 12) * scale;
  const tubeXs: number[] = [];
  if (isLattice && tubePitchPx > 0) {
    for (let x = panelBackX + tubePitchPx / 2; x <= panelFrontX; x += tubePitchPx) {
      tubeXs.push(x);
    }
  }

  const topMargin = 40;
  const embedPx = isGroundMount ? 2 * scale : 0;
  const svgH = topMargin + postHpx + beamHeight + panelHeight + deckHpx + GROUND_MARGIN + embedPx + 24;
  const svgW = tailStartX + TAIL_W + 16;

  const groundY = svgH - GROUND_MARGIN - 20 - embedPx;
  const deckY = isDeck ? groundY - deckHpx : null;
  const surfaceY = isDeck ? (deckY as number) : groundY;

  const postTopY = surfaceY - postHpx;
  const postBottomY = surfaceY;
  const embeddedBottomY = isGroundMount ? surfaceY + embedPx : null;

  const beamTopY = postTopY - beamHeight;
  const panelBottomY = beamTopY;
  const panelTopY = panelBottomY - panelHeight;

  const roofY = panelTopY;

  const footingWidth = isGroundMount ? 14 : 26;
  const footingX = postX - footingWidth / 2;

  // Freestanding - a mirrored post+beam at the house end instead of a wall/eave.
  // Shares the same ground/surface reference and ground-mount treatment as the
  // front post; only height and beam type are independent (falling back to the
  // front's own values when not given). The panel rect above still keeps using
  // the front beam's panelTopY as a single flat rect either way - it isn't
  // re-sloped to meet a differently-heighted rear beam exactly.
  let rear: SideProfileGeometry["rear"] = null;
  if (isFreestanding) {
    const rearHeight = rearPostHeight || postHeight;
    const rearHpx = rearHeight * scale;
    const rearPostTopY = surfaceY - rearHpx;
    const rearPostBottomY = surfaceY;
    const rearEmbeddedBottomY = isGroundMount ? surfaceY + embedPx : null;
    const rearBeamHeight = (beamHeightInches(rearBeamType || beamType) / 12) * scale;
    const rearBeamTopY = rearPostTopY - rearBeamHeight;
    rear = {
      postX: houseX, postTopY: rearPostTopY, postBottomY: rearPostBottomY, embeddedBottomY: rearEmbeddedBottomY,
      postHeight: rearHeight,
      beamTopY: rearBeamTopY, beamHeight: rearBeamHeight, beamWidth,
      footingX: houseX - footingWidth / 2, footingWidth,
    };
  }

  // Eave assembly, drawn as the actual boards rather than one abstract
  // outline: a soffit board under the overhang (real 2ft projection from
  // the wall), a fascia board capping the front (real 6in face - where the
  // awning attaches), and a roof edge line off the fascia's top at a true
  // 45deg (run = rise, holds at any scale). The wall stub stops at the
  // bottom of the eave - the overhang above isn't backed by wall, same as
  // a real house.
  const isEaveMount = !isFreestanding && (houseAttachment === "eave" || houseAttachment === "angled_eave");
  const EAVE_H = (6 / 12) * scale;
  const EAVE_PROJECTION = 2 * scale;
  const EAVE_BOARD_T = 4;
  const fasciaBottomY = roofY + EAVE_H;
  const eaveSoffit = {
    x: houseX - EAVE_PROJECTION, y: fasciaBottomY - EAVE_BOARD_T,
    width: EAVE_PROJECTION, height: EAVE_BOARD_T,
  };
  const eaveFascia = {
    x: houseX - EAVE_BOARD_T, y: roofY,
    width: EAVE_BOARD_T, height: EAVE_H,
  };
  const eaveRoofLine = {
    x1: houseX, y1: roofY,
    x2: houseX - EAVE_H, y2: roofY - EAVE_H,
  };
  const wallStubTopY = isEaveMount ? fasciaBottomY : roofY;
  // The wall itself sits at the BACK of the soffit, not flush with the
  // fascia - a real eave overhangs past the wall by its full projection,
  // it isn't flush with it.
  const eaveWallX = isEaveMount ? eaveSoffit.x : houseX;

  return {
    svgW, svgH, groundY, surfaceY, deckY, deckHpx,
    postX, postWidth: 10, postTopY, postBottomY, embeddedBottomY,
    beamTopY, beamHeight, beamWidth,
    panelTopY, panelBottomY, panelHeight, panelFrontX, panelBackX,
    houseX, roofY, tailStartX, tailW: TAIL_W,
    footingX, footingWidth,
    scale, isDeck, isGroundMount,
    houseAttachment, groundAttachment, deckHeight, postHeight, projection, endCut, rearEndCut: rearEndCut || endCut, showRafterTail,
    isLattice, tubeXs, tubeSize,
    isFreestanding, rear,
    isEaveMount, eaveSoffit, eaveFascia, eaveRoofLine, wallStubTopY, eaveWallX,
  };
}
