"use client";

import type { BeamConfig } from "@/lib/pricing/types";
import { computeCoverDiagramGeometry } from "@/lib/coverDiagramGeometry";

interface CoverDiagramProps {
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
  isLattice?: boolean;
  latticeType?: string;
  latticeSpacing?: string;
  mountStyle?: string;
  rearPosts?: number;
  className?: string;
}

export default function CoverDiagram({
  projection1, width1,
  projection2 = 0, width2 = 0,
  posts1 = 0,
  posts2 = 0,
  downspouts = 1,
  downspoutSide = "right",
  showRafterTails = true,
  jogType = "ground",
  beams = [],
  beamType1 = "3x8",
  beamType2 = "3x8",
  isLattice = false,
  latticeType = "2x2",
  latticeSpacing = "1x",
  mountStyle = "attached",
  rearPosts = 0,
  className = "",
}: CoverDiagramProps) {
  const geo = computeCoverDiagramGeometry({
    projection1, width1, projection2, width2, posts1, posts2,
    downspouts, downspoutSide, showRafterTails, jogType, beams, beamType1, beamType2,
    isLattice, latticeType, latticeSpacing, mountStyle, rearPosts,
  });

  if (!geo) {
    return (
      <div className={"flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 " + className}
           style={{ minHeight: 180 }}>
        <p className="text-gray-400 text-sm text-center px-4">Enter dimensions to see diagram</p>
      </div>
    );
  }

  const {
    svgW, svgH, ox, oy, HOUSE_H,
    hasRun2, isHouseJog, totalW,
    coverW1, coverH1, coverW2, coverH2,
    run1TopY, run2TopY, run1FrontY,
    beamY1, beamY2,
    postPositions, postPositions2, multiSpanBeams,
    tailCount, tailCount2, frontEdgeY, frontEdgeY2, tailTipY, tailTipY2, backTailTipY,
    downspoutPositions, rafterXs, tubeYs,
    isFreestanding, rearBeamY, rearPostPositions,
  } = geo;

  return (
    <div className={"bg-white rounded-xl border border-gray-200 overflow-hidden " + className}>
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cover Diagram — Top View</p>
      </div>
      <div className="flex items-center justify-center p-3 overflow-x-auto">
        <svg viewBox={"0 0 " + svgW + " " + svgH} width={svgW} height={svgH}
          style={{ maxWidth: "100%", height: "auto" }}>
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="1" />
            </pattern>
          </defs>

          {/* House wall at top — one continuous piece on a ground jog (or single run),
              or stepped to follow each run's own depth on a house jog. Freestanding has
              no house wall at all - a rear beam + its own posts are drawn below instead. */}
          {!isFreestanding && (
            isHouseJog ? (
              <>
                <rect x={ox - 4} y={run1TopY - HOUSE_H} width={coverW1 + (hasRun2 ? 4 : 8)} height={HOUSE_H}
                  fill="url(#hatch)" stroke="#64748b" strokeWidth="1.5" />
                <rect x={ox + coverW1} y={run2TopY - HOUSE_H} width={coverW2 + 8} height={HOUSE_H}
                  fill="url(#hatch)" stroke="#64748b" strokeWidth="1.5" />
              </>
            ) : (
              <rect x={ox - 4} y={oy - HOUSE_H} width={totalW + 8} height={HOUSE_H}
                fill="url(#hatch)" stroke="#64748b" strokeWidth="1.5" />
            )
          )}
          <text x={ox + totalW / 2} y={oy - HOUSE_H / 2 + 4}
            textAnchor="middle" fontSize="9" fill="#475569" fontWeight="600">{isFreestanding ? "REAR BEAM" : "HOUSE"}</text>

          {/* Cover rectangle run 1 - a lattice pergola has nothing solid to
              fill (open structure), so it's just an outline; the rafters +
              tubes drawn below convey the actual cover */}
          <rect x={ox} y={run1TopY} width={coverW1} height={coverH1}
            fill={isLattice ? "none" : "#eff6ff"} stroke="#3b82f6" strokeWidth="1.5" />

          {/* Cover rectangle run 2 */}
          {hasRun2 && (
            <rect x={ox + coverW1} y={run2TopY} width={coverW2} height={coverH2}
              fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
          )}

          {/* Hanger dashed line along house wall — one continuous piece on a ground jog,
              or split in 2 (following the wall's own jog) on a house jog. Skipped when
              freestanding — the rear beam line below takes its place. */}
          {!isFreestanding && (
            isHouseJog ? (
              <>
                <line x1={ox} y1={run1TopY} x2={ox + coverW1} y2={run1TopY}
                  stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" />
                <line x1={ox + coverW1} y1={run2TopY} x2={ox + coverW1 + coverW2} y2={run2TopY}
                  stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" />
              </>
            ) : (
              <line x1={ox} y1={oy} x2={ox + totalW} y2={oy}
                stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" />
            )
          )}

          {/* Rear beam + its own posts (freestanding only) — spans the full combined
              width as one straight run, numbered continuing from every other post group. */}
          {isFreestanding && (
            <>
              <line x1={ox} y1={rearBeamY} x2={ox + totalW} y2={rearBeamY} stroke="#1e40af" strokeWidth="3" />
              {rearPostPositions.map((px, i) => {
                const numberSoFar = postPositions.length + postPositions2.length
                  + multiSpanBeams.reduce((s, b) => s + b.postXs.length, 0) + i + 1;
                return (
                  <g key={"rear-post-" + i}>
                    <rect x={px - 5} y={rearBeamY - 5} width={10} height={10} fill="#1e293b" rx="1" />
                    <text x={px} y={rearBeamY + 4} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">{numberSoFar}</text>
                  </g>
                );
              })}
            </>
          )}

          {/* Beam line run 1 - horizontal, 1.5ft from front edge; flush with run 2 on a house jog.
              A double beam mounts front + back of the posts (for extra span), shown as 2 lines
              straddling the post instead of the single beam sitting on top of it. */}
          {geo.beamType1 === "double_3x8" ? (
            <>
              <line x1={ox} y1={beamY1 - 3} x2={ox + coverW1} y2={beamY1 - 3} stroke="#1e40af" strokeWidth="2" />
              <line x1={ox} y1={beamY1 + 3} x2={ox + coverW1} y2={beamY1 + 3} stroke="#1e40af" strokeWidth="2" />
            </>
          ) : (
            <line x1={ox} y1={beamY1} x2={ox + coverW1} y2={beamY1}
              stroke="#1e40af" strokeWidth="3" />
          )}

          {/* Beam line run 2 */}
          {hasRun2 && (
            geo.beamType2 === "double_3x8" ? (
              <>
                <line x1={ox + coverW1} y1={beamY2 - 3} x2={ox + coverW1 + coverW2} y2={beamY2 - 3} stroke="#15803d" strokeWidth="2" />
                <line x1={ox + coverW1} y1={beamY2 + 3} x2={ox + coverW1 + coverW2} y2={beamY2 + 3} stroke="#15803d" strokeWidth="2" />
              </>
            ) : (
              <line x1={ox + coverW1} y1={beamY2}
                    x2={ox + coverW1 + coverW2} y2={beamY2}
                stroke="#15803d" strokeWidth="3" />
            )
          )}

          {/* Multi-span beams (Additional / Multi-Span Beams) - run 1 only */}
          {multiSpanBeams.map((b, i) => (
            <line key={"ms-beam-" + i} x1={ox} y1={b.y} x2={ox + coverW1} y2={b.y}
              stroke="#7c3aed" strokeWidth="3" strokeDasharray="8,3" />
          ))}

          {/* Side plates - full height + tail (run 1). Freestanding extends the
              back end past backTailTipY too, mirroring the front - it's now a
              real finished edge, not a house wall to sit flush against. */}
          <line x1={ox} y1={backTailTipY} x2={ox} y2={tailTipY}
            stroke="#1e40af" strokeWidth="2.5" />
          <line x1={ox + coverW1} y1={backTailTipY} x2={ox + coverW1} y2={tailTipY}
            stroke="#1e40af" strokeWidth="2.5" />

          {/* Rafter tails - short stubs below front edge (run 1) - lattice
              rafters are drawn full-length below instead */}
          {!isLattice && showRafterTails && Array.from({ length: tailCount }).map((_, i) => {
            const rx = ox + (width1 / (tailCount + 1)) * (i + 1) * geo.scale;
            return (
              <line key={i} x1={rx} y1={frontEdgeY} x2={rx} y2={tailTipY}
                stroke="#1e40af" strokeWidth="2" />
            );
          })}

          {/* Rear rafter tails - freestanding only, mirrors the front's stubs
              past the rear edge */}
          {isFreestanding && !isLattice && showRafterTails && Array.from({ length: tailCount }).map((_, i) => {
            const rx = ox + (width1 / (tailCount + 1)) * (i + 1) * geo.scale;
            return (
              <line key={"rear-tail-" + i} x1={rx} y1={run1TopY} x2={rx} y2={backTailTipY}
                stroke="#1e40af" strokeWidth="2" />
            );
          })}

          {/* Pergola rafters - full length, house wall to 1ft-past-beam tip */}
          {isLattice && rafterXs.map((rx, i) => (
            <line key={"rafter-" + i} x1={rx} y1={run1TopY} x2={rx} y2={frontEdgeY}
              stroke="#1e40af" strokeWidth="2" />
          ))}

          {/* Lattice tubes - cross the rafters at their real spacing, parallel to the house */}
          {isLattice && tubeYs.map((ty, i) => (
            <line key={"tube-" + i} x1={ox} y1={ty} x2={ox + coverW1} y2={ty}
              stroke="#93c5fd" strokeWidth="1" />
          ))}

          {/* Side plate - outer edge + tail (run 2) */}
          {hasRun2 && (
            <line x1={ox + coverW1 + coverW2} y1={run2TopY} x2={ox + coverW1 + coverW2} y2={tailTipY2}
              stroke="#15803d" strokeWidth="2.5" />
          )}

          {/* Rafter tails - short stubs below front edge (run 2) */}
          {hasRun2 && showRafterTails && Array.from({ length: tailCount2 }).map((_, i) => {
            const rx = ox + coverW1 + (width2 / (tailCount2 + 1)) * (i + 1) * geo.scale;
            return (
              <line key={"r2-" + i} x1={rx} y1={frontEdgeY2} x2={rx} y2={tailTipY2}
                stroke="#15803d" strokeWidth="2" />
            );
          })}

          {/* Posts on beam (run 1) */}
          {postPositions.map((px, i) => (
            <g key={i}>
              <rect x={px - 5} y={beamY1 - 5} width={10} height={10}
                fill="#1e293b" rx="1" />
              <text x={px} y={beamY1 + 4} textAnchor="middle"
                fontSize="7" fill="white" fontWeight="bold">{i + 1}</text>
            </g>
          ))}

          {/* Posts on beam (run 2) - numbering continues from run 1's posts */}
          {postPositions2.map((px, i) => (
            <g key={"r2-post-" + i}>
              <rect x={px - 5} y={beamY2 - 5} width={10} height={10}
                fill="#1e293b" rx="1" />
              <text x={px} y={beamY2 + 4} textAnchor="middle"
                fontSize="7" fill="white" fontWeight="bold">{postPositions.length + i + 1}</text>
            </g>
          ))}

          {/* Posts on multi-span beams - numbering continues from run 1 + run 2's posts */}
          {(() => {
            let numberSoFar = postPositions.length + postPositions2.length;
            return multiSpanBeams.map((b, bi) =>
              b.postXs.map((px, i) => {
                numberSoFar += 1;
                return (
                  <g key={"ms-post-" + bi + "-" + i}>
                    <rect x={px - 5} y={b.y - 5} width={10} height={10}
                      fill="#7c3aed" rx="1" />
                    <text x={px} y={b.y + 4} textAnchor="middle"
                      fontSize="7" fill="white" fontWeight="bold">{numberSoFar}</text>
                  </g>
                );
              })
            );
          })()}

          {/* Downspouts */}
          {downspoutPositions.map((p, i) => (
            <rect key={i} x={p.x - 4} y={p.y - 4} width={8} height={8}
              fill="#0ea5e9" rx="1" />
          ))}

          {/* Width dimension (top) */}
          <line x1={ox} y1={oy - HOUSE_H - 8} x2={ox + coverW1} y2={oy - HOUSE_H - 8}
            stroke="#64748b" strokeWidth="1" />
          <line x1={ox} y1={oy - HOUSE_H - 12} x2={ox} y2={oy - HOUSE_H - 4}
            stroke="#64748b" strokeWidth="1" />
          <line x1={ox + coverW1} y1={oy - HOUSE_H - 12} x2={ox + coverW1} y2={oy - HOUSE_H - 4}
            stroke="#64748b" strokeWidth="1" />
          <text x={ox + coverW1 / 2} y={oy - HOUSE_H - 12}
            textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
            {width1}{"'"}
          </text>

          {/* Projection dimension (right side, red) */}
          <line x1={ox + coverW1 + 10} y1={run1TopY} x2={ox + coverW1 + 10} y2={run1FrontY}
            stroke="#CC2229" strokeWidth="1.5" />
          <line x1={ox + coverW1 + 6} y1={run1TopY} x2={ox + coverW1 + 14} y2={run1TopY}
            stroke="#CC2229" strokeWidth="1.5" />
          <line x1={ox + coverW1 + 6} y1={run1FrontY} x2={ox + coverW1 + 14} y2={run1FrontY}
            stroke="#CC2229" strokeWidth="1.5" />
          <text x={ox + coverW1 + 22} y={(run1TopY + run1FrontY) / 2 + 4}
            textAnchor="middle" fontSize="13" fontWeight="700" fill="#CC2229"
            transform={"rotate(90," + (ox + coverW1 + 22) + "," + (run1TopY + run1FrontY) / 2 + ")"}>
            {projection1}{"'"}
          </text>

          {/* Sq ft label */}
          <text x={ox + coverW1 / 2} y={(run1TopY + run1FrontY) / 2 + 4}
            textAnchor="middle" fontSize="9" fill="#94a3b8">
            {width1 * projection1} sq ft
          </text>

          {/* Legend */}
          <rect x={ox} y={svgH - 16} width={8} height={8} fill="#1e293b" rx="1" />
          <text x={ox + 12} y={svgH - 8} fontSize="9" fill="#475569">Post</text>
          <rect x={ox + 44} y={svgH - 16} width={8} height={8} fill="#0ea5e9" rx="1" />
          <text x={ox + 56} y={svgH - 8} fontSize="9" fill="#475569">Downspout</text>
          <line x1={ox + 110} y1={svgH - 12} x2={ox + 122} y2={svgH - 12}
            stroke="#1e40af" strokeWidth="3" />
          <text x={ox + 126} y={svgH - 8} fontSize="9" fill="#475569">Beam</text>
          {multiSpanBeams.length > 0 && (
            <>
              <line x1={ox + 162} y1={svgH - 12} x2={ox + 174} y2={svgH - 12}
                stroke="#7c3aed" strokeWidth="3" strokeDasharray="8,3" />
              <text x={ox + 178} y={svgH - 8} fontSize="9" fill="#475569">Multi-Span Beam</text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
