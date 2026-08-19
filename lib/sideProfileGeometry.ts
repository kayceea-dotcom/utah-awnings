export interface SideProfileGeometryInput {
  projection: number;
  postHeight: number;
  deckHeight?: number;
  houseAttachment?: string;
  groundAttachment?: string;
  beamType?: string;
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

// All the coordinate math behind the side (elevation) profile diagram - deck
// height, footing/embed depth, post height, beam thickness, roofline and
// rafter-tail placement. Kept separate from drawing code (SideProfileDiagram.tsx
// for the browser, sideProfile.pdf.tsx for the printable contract) so both
// draw from exactly the same numbers.
export function computeSideProfileGeometry(input: SideProfileGeometryInput): SideProfileGeometry | null {
  const {
    projection, postHeight,
    deckHeight = 0,
    houseAttachment = "stucco",
    groundAttachment = "concrete",
    beamType = "3x8",
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

  // 3x8/i-beam read visually thicker than a 3x3
  const beamHeight = beamType === "3x8" || beamType === "double_3x8" ? 10 : beamType.includes("i_beam") ? 8 : 7;

  const topMargin = 40;
  const embedPx = isGroundMount ? 2 * scale : 0;
  const svgH = topMargin + postHpx + beamHeight + deckHpx + GROUND_MARGIN + embedPx + 24;
  const svgW = PAD * 2 + projPx + TAIL_W + 20;

  const groundY = svgH - GROUND_MARGIN - 20 - embedPx;
  const deckY = isDeck ? groundY - deckHpx : null;
  const surfaceY = isDeck ? (deckY as number) : groundY;

  const houseX = PAD;
  const postX = PAD + projPx;

  const beamTopY = surfaceY - postHpx - beamHeight;
  const postTopY = surfaceY - postHpx;
  const postBottomY = surfaceY;
  const embeddedBottomY = isGroundMount ? surfaceY + embedPx : null;

  const roofY = beamTopY;
  const tailStartX = postX + 6;

  const footingWidth = isGroundMount ? 14 : 26;
  const footingX = postX - footingWidth / 2;

  return {
    svgW, svgH, groundY, surfaceY, deckY, deckHpx,
    postX, postWidth: 10, postTopY, postBottomY, embeddedBottomY,
    beamTopY, beamHeight,
    houseX, roofY, tailStartX, tailW: TAIL_W,
    footingX, footingWidth,
    scale, isDeck, isGroundMount,
    houseAttachment, groundAttachment, deckHeight, postHeight, projection, endCut, showRafterTail,
  };
}
