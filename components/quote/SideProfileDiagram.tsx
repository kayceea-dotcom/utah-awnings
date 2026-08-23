"use client";

import { computeSideProfileGeometry } from "@/lib/sideProfileGeometry";
import { endCutProfilePath } from "@/lib/endCutProfiles";

interface SideProfileDiagramProps {
  projection: number;
  postHeight: number;
  deckHeight?: number;
  houseAttachment?: string;
  groundAttachment?: string;
  beamType?: string;
  wrapType?: string;
  hasPanel?: boolean;
  endCut?: string;
  showRafterTail?: boolean;
  isLattice?: boolean;
  latticeType?: string;
  latticeSpacing?: string;
  className?: string;
}

const HOUSE_ATTACHMENT_LABELS: Record<string, string> = {
  stucco: "STUCCO WALL",
  siding: "SIDING WALL",
  eave: "EAVE MOUNT",
  angled_eave: "ANGLED EAVE",
};

const GROUND_ATTACHMENT_LABELS: Record<string, string> = {
  concrete: "CONCRETE FOOTING",
  deck: "DECK MOUNT",
  ground_mount: "GROUND MOUNT (EMBEDDED)",
};

export default function SideProfileDiagram({
  projection, postHeight,
  deckHeight = 0,
  houseAttachment = "stucco",
  groundAttachment = "concrete",
  beamType = "3x8",
  wrapType = "none",
  hasPanel = true,
  endCut = "beveled",
  showRafterTail = true,
  isLattice = false,
  latticeType = "2x2",
  latticeSpacing = "1x",
  className = "",
}: SideProfileDiagramProps) {
  const geo = computeSideProfileGeometry({
    projection, postHeight, deckHeight, houseAttachment, groundAttachment, beamType, wrapType, hasPanel, endCut, showRafterTail,
    isLattice, latticeType, latticeSpacing,
  });

  if (!geo) {
    return (
      <div className={"flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 " + className}
           style={{ minHeight: 140 }}>
        <p className="text-gray-400 text-sm text-center px-4">Enter dimensions to see side profile</p>
      </div>
    );
  }

  const {
    svgW, svgH, groundY, deckY, deckHpx, scale,
    postX, postWidth, postTopY, postBottomY, embeddedBottomY,
    beamTopY, beamHeight, beamWidth,
    panelTopY, panelHeight, panelFrontX,
    houseX, roofY, tailStartX, tailW,
    footingX, footingWidth,
    isDeck, isGroundMount, tubeXs, tubeSize,
    isEaveMount, eaveSoffit, eaveFascia, eaveRoofLine, wallStubTopY,
  } = geo;

  const tailPath = endCutProfilePath(endCut);

  return (
    <div className={"bg-white rounded-xl border border-gray-200 overflow-hidden " + className}>
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Side Profile</p>
      </div>
      <div className="flex items-center justify-center p-3 overflow-x-auto">
        <svg viewBox={"0 0 " + svgW + " " + svgH} width={svgW} height={svgH}
          style={{ maxWidth: "100%", height: "auto" }}>
          <defs>
            <pattern id="sp-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="1" />
            </pattern>
          </defs>

          {/* House attachment - a flat wall for stucco/siding, or a real
              eave assembly for an eave/angled-eave mount: a soffit board
              under the 2ft overhang, a fascia board capping its front (the
              6in face the awning attaches to), and a roof edge line off
              the fascia's top at a true 45deg. The wall stub stops at the
              bottom of the eave - it isn't backed by wall above that, same
              as a real house - but still runs to the ground below it. */}
          {isEaveMount ? (
            <>
              <rect x={houseX - 10} y={wallStubTopY} width={10} height={groundY - wallStubTopY} fill="url(#sp-hatch)" stroke="#64748b" strokeWidth="1.5" />
              <line x1={eaveRoofLine.x1} y1={eaveRoofLine.y1} x2={eaveRoofLine.x2} y2={eaveRoofLine.y2}
                stroke="#78716c" strokeWidth="5" strokeLinecap="square" />
              <rect x={eaveSoffit.x} y={eaveSoffit.y} width={eaveSoffit.width} height={eaveSoffit.height}
                fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
              <rect x={eaveFascia.x} y={eaveFascia.y} width={eaveFascia.width} height={eaveFascia.height}
                fill="#fefce8" stroke="#78350f" strokeWidth="1.5" />
            </>
          ) : (
            <rect x={houseX - 10} y={10} width={10} height={groundY - 10} fill="url(#sp-hatch)" stroke="#64748b" strokeWidth="1.5" />
          )}
          <text x={houseX - 5} y={roofY + 42} textAnchor="middle" fontSize="7" fill="#475569" fontWeight="600">
            {HOUSE_ATTACHMENT_LABELS[houseAttachment] || houseAttachment.toUpperCase()}
          </text>

          {/* Ground line */}
          <line x1={houseX - 20} y1={groundY} x2={svgW - 10} y2={groundY} stroke="#64748b" strokeWidth="1.5" />
          <rect x={houseX - 20} y={groundY} width={svgW - 10 - (houseX - 20)} height={8} fill="url(#sp-hatch)" opacity={0.5} />

          {/* Deck platform - a 12in skirt/rim board at the surface (what you'd
              actually see looking at the deck's edge), with a support post
              coming down from its front end to the ground, rather than
              drawing the whole deck height as one solid block. The deck's
              edge/post line up with the patio cover's own post - that's
              normally where the cover actually attaches - with the deck
              framing running just a couple inches past it. */}
          {isDeck && deckY !== null && (() => {
            const deckSkirtPx = Math.min(scale, deckHpx);
            const skirtBottomY = deckY + deckSkirtPx;
            const deckInset = (2 / 12) * scale;
            const deckEdgeX = postX + deckInset;
            const deckPostX = postX;
            const deckPostW = 6;
            const deckStartX = houseX;
            return (
              <>
                <rect x={deckStartX} y={deckY} width={deckEdgeX - deckStartX} height={Math.max(deckSkirtPx, 4)}
                  fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
                {skirtBottomY < groundY && (
                  <rect x={deckPostX - deckPostW / 2} y={skirtBottomY} width={deckPostW} height={groundY - skirtBottomY}
                    fill="#92400e" stroke="#78350f" strokeWidth="1" />
                )}
                {/* Deck height dimension - still measures the real (full)
                    deck height, only the drawing above is simplified */}
                <line x1={houseX - 30} y1={deckY} x2={houseX - 30} y2={groundY} stroke="#d97706" strokeWidth="1" />
                <line x1={houseX - 34} y1={deckY} x2={houseX - 26} y2={deckY} stroke="#d97706" strokeWidth="1" />
                <line x1={houseX - 34} y1={groundY} x2={houseX - 26} y2={groundY} stroke="#d97706" strokeWidth="1" />
                <text x={houseX - 30} y={(deckY + groundY) / 2 + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill="#d97706"
                  transform={"rotate(-90," + (houseX - 30) + "," + (deckY + groundY) / 2 + ")"}>
                  {deckHeight}&apos; deck
                </text>
              </>
            );
          })()}

          {/* Footing (concrete/deck) or embedded post (ground mount) */}
          {isGroundMount ? (
            <>
              <rect x={postX - footingWidth / 2} y={postBottomY} width={footingWidth} height={(embeddedBottomY ?? postBottomY) - postBottomY}
                fill="#e2e8f0" stroke="#64748b" strokeWidth="1" strokeDasharray="3,2" />
            </>
          ) : (
            <rect x={footingX} y={groundY - 3} width={footingWidth} height={10} fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
          )}

          {/* Post */}
          <rect x={postX - postWidth / 2} y={postTopY} width={postWidth} height={postBottomY - postTopY}
            fill="#1e293b" stroke="#0f172a" strokeWidth="1" />

          {/* Post height dimension */}
          <line x1={postX + 22} y1={postTopY} x2={postX + 22} y2={postBottomY} stroke="#CC2229" strokeWidth="1.5" />
          <line x1={postX + 18} y1={postTopY} x2={postX + 26} y2={postTopY} stroke="#CC2229" strokeWidth="1.5" />
          <line x1={postX + 18} y1={postBottomY} x2={postX + 26} y2={postBottomY} stroke="#CC2229" strokeWidth="1.5" />
          <text x={postX + 34} y={(postTopY + postBottomY) / 2 + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#CC2229"
            transform={"rotate(90," + (postX + 34) + "," + (postTopY + postBottomY) / 2 + ")"}>
            {postHeight}&apos;
          </text>

          {/* Beam - drawn end-on (real cross-section), not as a flat slab along the projection */}
          <rect x={postX - beamWidth / 2} y={beamTopY} width={beamWidth} height={beamHeight} fill="#1e40af" stroke="#1e3a8a" strokeWidth="1" />

          {/* Panel / wrap edge - sits on top of the beam and overhangs past its front face (18in default).
              A pergola's "panel" is its own 2x6 rafter (real 6in height, 1ft overhang) - same rect, different meaning. */}
          <rect x={houseX} y={panelTopY} width={panelFrontX - houseX} height={panelHeight} fill="#93c5fd" stroke="#3b82f6" strokeWidth="1.5" />

          {/* Lattice tubes - 2x2 (or 2x3) cross-sections spaced along the rafter's full length */}
          {isLattice && tubeXs.map((tx, i) => (
            <rect key={"tube-" + i} x={tx - tubeSize / 2} y={panelTopY - tubeSize} width={tubeSize} height={tubeSize}
              fill="#60a5fa" stroke="#1e40af" strokeWidth="0.75" />
          ))}

          {/* Rafter tail profile - spans the full panel + beam front face.
              Not shown for a lattice rafter - it isn't wrapped/cut like a
              panel edge, the tubes above already read as its real end. */}
          {!isLattice && showRafterTail && (
            <g transform={"translate(" + tailStartX + "," + panelTopY + ") scale(" + (tailW / 44) + "," + ((panelHeight + beamHeight) / 24) + ")"}>
              <path d={tailPath} fill="#3b82f6" stroke="#1e3a8a" strokeWidth="1" />
            </g>
          )}

          {/* Attachment / ground labels */}
          <text x={svgW / 2} y={svgH - 6} textAnchor="middle" fontSize="7" fill="#94a3b8">
            {GROUND_ATTACHMENT_LABELS[groundAttachment] || groundAttachment.toUpperCase()}
          </text>
        </svg>
      </div>
    </div>
  );
}
