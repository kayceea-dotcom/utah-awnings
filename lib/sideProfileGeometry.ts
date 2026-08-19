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
  } = input;

  if (!projection || !postHeight) return null;

  const PAD = 44;
  const GROUND_MARGIN = 26;
  const TAIL_W = 32;

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

  // Panel/wrap edge sits directly on top of the beam.
  const panelHeight = hasPanel ? (panelHeightInches(wrapType) / 12) * scale : 3;
  // Panel overhangs past the beam's front face - 18in is the normal default,
  // matching how the cover material actually extends past its support beam.
  const overhangPx = hasPanel ? (panelOverhangInches / 12) * scale : 0;

  const houseX = PAD;
  const postX = PAD + projPx;
  const panelFrontX = postX + beamWidth / 2 + overhangPx;
  const tailStartX = panelFrontX + 4;

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

  return {
    svgW, svgH, groundY, surfaceY, deckY, deckHpx,
    postX, postWidth: 10, postTopY, postBottomY, embeddedBottomY,
    beamTopY, beamHeight, beamWidth,
    panelTopY, panelBottomY, panelHeight, panelFrontX,
    houseX, roofY, tailStartX, tailW: TAIL_W,
    footingX, footingWidth,
    scale, isDeck, isGroundMount,
    houseAttachment, groundAttachment, deckHeight, postHeight, projection, endCut, showRafterTail,
  };
}
