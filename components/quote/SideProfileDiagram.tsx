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
  className = "",
}: SideProfileDiagramProps) {
  const geo = computeSideProfileGeometry({
    projection, postHeight, deckHeight, houseAttachment, groundAttachment, beamType, wrapType, hasPanel, endCut, showRafterTail,
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
    isDeck, isGroundMount,
  } = geo;

  const tailPath = endCutProfilePath(endCut);
  const isEaveMount = houseAttachment === "eave" || houseAttachment === "angled_eave";
  const roofBackX = houseAttachment === "angled_eave" ? houseX - 16 : houseX - 30;
  const wallStubTopY = roofY - 4;

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

          {/* House attachment - a flat wall for stucco/siding, or a sloped
              roofline over a short wall stub for an eave/angled-eave mount */}
          {isEaveMount ? (
            <>
              <polygon points={roofBackX + ",6 " + (houseX - 4) + "," + wallStubTopY + " " + roofBackX + "," + wallStubTopY}
                fill="#a8a29e" stroke="#57534e" strokeWidth="1.5" />
              <rect x={houseX - 10} y={wallStubTopY} width={10} height={(roofY + 20) - wallStubTopY} fill="url(#sp-hatch)" stroke="#64748b" strokeWidth="1.5" />
              {/* Eave header/fascia board - caps the roofline where it meets
                  the wall, right where the awning's hanger actually attaches */}
              <rect x={houseX - 12} y={wallStubTopY - 7} width={14} height={9} fill="#92400e" stroke="#78350f" strokeWidth="1" />
            </>
          ) : (
            <rect x={houseX - 10} y={10} width={10} height={roofY - 10 + 20} fill="url(#sp-hatch)" stroke="#64748b" strokeWidth="1.5" />
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
              drawing the whole deck height as one solid block */}
          {isDeck && deckY !== null && (() => {
            const deckSkirtPx = Math.min(scale, deckHpx);
            const skirtBottomY = deckY + deckSkirtPx;
            const deckPostX = svgW - 26;
            const deckPostW = 6;
            return (
              <>
                <rect x={houseX - 20} y={deckY} width={svgW - 10 - (houseX - 20)} height={Math.max(deckSkirtPx, 4)}
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

          {/* Panel / wrap edge - sits on top of the beam and overhangs past its front face (18in default) */}
          <rect x={houseX} y={panelTopY} width={panelFrontX - houseX} height={panelHeight} fill="#93c5fd" stroke="#3b82f6" strokeWidth="1.5" />

          {/* Rafter tail profile - spans the full panel + beam front face */}
          {showRafterTail && (
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
