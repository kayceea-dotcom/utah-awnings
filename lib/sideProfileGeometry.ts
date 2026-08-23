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
  showRafterTail: boolean;
  isLattice: boolean;
  /** X positions of each lattice tube cross-section along the rafter, pergola only. */
  tubeXs: number[];
  /** Px size (both width and height) of each tube cross-section. */
  tubeSize: number;
  isEaveMount: boolean;
  /** SVG/PDF "x,y x,y ..." points string for the eave fascia profile (eave/
   *  angled_eave house attachment only) - a 6in vertical face where the
   *  awning attaches, a 90deg corner at the bottom (soffit), and a 45deg
   *  line off the top (roofline). Empty string when not an eave mount. */
  eavePoints: string;
  /** Y where the plain wall stub below the eave should start - the eave
   *  profile's own back-top corner, so the wall fully backs it with no gap. */
  wallStubTopY: number;
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
  } = input;

  if (!projection || !postHeight) return null;

  const PAD = 44;
  const GROUND_MARGIN = 26;
  const TAIL_W = 32;

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

  const houseX = PAD;
  const postX = PAD + projPx;
  const panelFrontX = postX + beamWidth / 2 + overhangPx;
  const tailStartX = panelFrontX + 4;

  // Lattice tube cross-sections - spaced along the rafter's full length
  // (house to tip), same real pitch as the top-view diagram.
  const tubeSize = (tubeWidthIn / 12) * scale;
  const tubePitchPx = (tubePitchIn / 12) * scale;
  const tubeXs: number[] = [];
  if (isLattice && tubePitchPx > 0) {
    for (let x = houseX + tubePitchPx / 2; x <= panelFrontX; x += tubePitchPx) {
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

  // Eave fascia profile - the awning attaches to a real 6in vertical face,
  // a 90deg corner into the soffit at its bottom, and a 45deg roofline off
  // its top (run = rise, so the angle is always true regardless of scale).
  const isEaveMount = houseAttachment === "eave" || houseAttachment === "angled_eave";
  const EAVE_H = (6 / 12) * scale;
  const fasciaBottomY = roofY + EAVE_H;
  const eaveBackX = houseX - EAVE_H;
  const roofBackY = roofY - EAVE_H;
  const eavePoints = isEaveMount
    ? eaveBackX + "," + fasciaBottomY + " " + houseX + "," + fasciaBottomY + " "
      + houseX + "," + roofY + " " + eaveBackX + "," + roofBackY
    : "";
  const wallStubTopY = isEaveMount ? roofBackY : roofY;

  return {
    svgW, svgH, groundY, surfaceY, deckY, deckHpx,
    postX, postWidth: 10, postTopY, postBottomY, embeddedBottomY,
    beamTopY, beamHeight, beamWidth,
    panelTopY, panelBottomY, panelHeight, panelFrontX,
    houseX, roofY, tailStartX, tailW: TAIL_W,
    footingX, footingWidth,
    scale, isDeck, isGroundMount,
    houseAttachment, groundAttachment, deckHeight, postHeight, projection, endCut, showRafterTail,
    isLattice, tubeXs, tubeSize,
    isEaveMount, eavePoints, wallStubTopY,
  };
}
