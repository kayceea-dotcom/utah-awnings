"use client";

import type { BeamConfig } from "@/lib/pricing/types";

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
  className?: string;
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
  className = "",
}: CoverDiagramProps) {
  if (!projection1 || !width1) {
    return (
      <div className={"flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 " + className}
           style={{ minHeight: 180 }}>
        <p className="text-gray-400 text-sm text-center px-4">Enter dimensions to see diagram</p>
      </div>
    );
  }

  // Orientation: house wall at TOP, cover extends DOWNWARD
  // X = width (left to right), Y = projection (top to bottom)

  const PAD = 40;
  const HOUSE_H = 20;
  const TAIL_LEN = 12;

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

  // Beam Y = 1.5ft from BOTTOM (front) of cover
  const beamY1 = run1FrontY - 1.5 * scale;
  const beamY2 = run2FrontY - 1.5 * scale;

  // Post X positions along beam - 1.5ft from each end, evenly spaced
  const postPositions = spacedPostXs(posts1, width1, ox, coverW1);

  // Post X positions for run 2, same spacing rule within run 2's own width
  const postPositions2 = hasRun2 ? spacedPostXs(posts2, width2, ox + coverW1, coverW2) : [];

  // Multi-span beams (Additional / Multi-Span Beams) - run 1 only. Y position is
  // measured from the house wall (0 = at the house), clamped inside the cover so
  // an out-of-range value doesn't draw off the diagram. Posts space across the
  // same width1 run using the same 1.5ft-inset rule as the primary beam.
  const multiSpanBeams = beams.map((b) => {
    const y = run1TopY + Math.max(0, Math.min(b.positionFromHouse, projection1)) * scale;
    return { y, postXs: spacedPostXs(b.posts, width1, ox, coverW1) };
  });

  // Rafter tail count (run 1)
  const tailCount = Math.round(width1 / 2);
  // Front edge Y (run 1)
  const frontEdgeY = run1FrontY;
  // Tail tip Y (1ft below front edge) — only extends past the front edge when
  // rafter tails are actually present; otherwise the cover is a clean rectangle.
  const tailTipY = showRafterTails ? frontEdgeY + TAIL_LEN : frontEdgeY;

  // Rafter tail count (run 2)
  const tailCount2 = hasRun2 ? Math.round(width2 / 2) : 0;
  const frontEdgeY2 = run2FrontY;
  const tailTipY2 = showRafterTails ? frontEdgeY2 + TAIL_LEN : frontEdgeY2;

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
              or stepped to follow each run's own depth on a house jog */}
          {isHouseJog ? (
            <>
              <rect x={ox - 4} y={run1TopY - HOUSE_H} width={coverW1 + (hasRun2 ? 4 : 8)} height={HOUSE_H}
                fill="url(#hatch)" stroke="#64748b" strokeWidth="1.5" />
              <rect x={ox + coverW1} y={run2TopY - HOUSE_H} width={coverW2 + 8} height={HOUSE_H}
                fill="url(#hatch)" stroke="#64748b" strokeWidth="1.5" />
            </>
          ) : (
            <rect x={ox - 4} y={oy - HOUSE_H} width={totalW + 8} height={HOUSE_H}
              fill="url(#hatch)" stroke="#64748b" strokeWidth="1.5" />
          )}
          <text x={ox + totalW / 2} y={oy - HOUSE_H / 2 + 4}
            textAnchor="middle" fontSize="9" fill="#475569" fontWeight="600">HOUSE</text>

          {/* Cover rectangle run 1 */}
          <rect x={ox} y={run1TopY} width={coverW1} height={coverH1}
            fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />

          {/* Cover rectangle run 2 */}
          {hasRun2 && (
            <rect x={ox + coverW1} y={run2TopY} width={coverW2} height={coverH2}
              fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
          )}

          {/* Hanger dashed line along house wall — one continuous piece on a ground jog,
              or split in 2 (following the wall's own jog) on a house jog */}
          {isHouseJog ? (
            <>
              <line x1={ox} y1={run1TopY} x2={ox + coverW1} y2={run1TopY}
                stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" />
              <line x1={ox + coverW1} y1={run2TopY} x2={ox + coverW1 + coverW2} y2={run2TopY}
                stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" />
            </>
          ) : (
            <line x1={ox} y1={oy} x2={ox + totalW} y2={oy}
              stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" />
          )}

          {/* Beam line run 1 - horizontal, 1.5ft from front edge; flush with run 2 on a house jog */}
          <line x1={ox} y1={beamY1} x2={ox + coverW1} y2={beamY1}
            stroke="#1e40af" strokeWidth="3" />

          {/* Beam line run 2 */}
          {hasRun2 && (
            <line x1={ox + coverW1} y1={beamY2}
                  x2={ox + coverW1 + coverW2} y2={beamY2}
              stroke="#15803d" strokeWidth="3" />
          )}

          {/* Multi-span beams (Additional / Multi-Span Beams) - run 1 only */}
          {multiSpanBeams.map((b, i) => (
            <line key={"ms-beam-" + i} x1={ox} y1={b.y} x2={ox + coverW1} y2={b.y}
              stroke="#7c3aed" strokeWidth="3" strokeDasharray="8,3" />
          ))}

          {/* Side plates - full height + tail (run 1) */}
          <line x1={ox} y1={run1TopY} x2={ox} y2={tailTipY}
            stroke="#1e40af" strokeWidth="2.5" />
          <line x1={ox + coverW1} y1={run1TopY} x2={ox + coverW1} y2={tailTipY}
            stroke="#1e40af" strokeWidth="2.5" />

          {/* Rafter tails - short stubs below front edge (run 1) */}
          {showRafterTails && Array.from({ length: tailCount }).map((_, i) => {
            const rx = ox + (width1 / (tailCount + 1)) * (i + 1) * scale;
            return (
              <line key={i} x1={rx} y1={frontEdgeY} x2={rx} y2={tailTipY}
                stroke="#1e40af" strokeWidth="2" />
            );
          })}

          {/* Side plate - outer edge + tail (run 2) */}
          {hasRun2 && (
            <line x1={ox + coverW1 + coverW2} y1={run2TopY} x2={ox + coverW1 + coverW2} y2={tailTipY2}
              stroke="#15803d" strokeWidth="2.5" />
          )}

          {/* Rafter tails - short stubs below front edge (run 2) */}
          {hasRun2 && showRafterTails && Array.from({ length: tailCount2 }).map((_, i) => {
            const rx = ox + coverW1 + (width2 / (tailCount2 + 1)) * (i + 1) * scale;
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

          {/* Downspouts — hang just in front of (past) the corner post, at the true
              front edge rather than the post's own beam-line position. 1 downspout
              sits on whichever side is picked; 2 or more sit on both far left and
              far right (extras beyond 2 aren't placed - rare in practice). */}
          {(() => {
            const leftPos = { x: postPositions.length > 0 ? postPositions[0] : ox, y: frontEdgeY };
            const rightPos = hasRun2
              ? { x: postPositions2.length > 0 ? postPositions2[postPositions2.length - 1] : ox + coverW1 + coverW2, y: frontEdgeY2 }
              : { x: postPositions.length > 0 ? postPositions[postPositions.length - 1] : ox + coverW1, y: frontEdgeY };
            const positions =
              downspouts === 1 ? [downspoutSide === "left" ? leftPos : rightPos] :
              downspouts >= 2  ? [leftPos, rightPos] : [];
            return positions.map((p, i) => (
              <rect key={i} x={p.x - 4} y={p.y - 4} width={8} height={8}
                fill="#0ea5e9" rx="1" />
            ));
          })()}

          {/* Width dimension (top) */}
          <line x1={ox} y1={oy - HOUSE_H - 8} x2={ox + coverW1} y2={oy - HOUSE_H - 8}
            stroke="#64748b" strokeWidth="1" />
          <line x1={ox} y1={oy - HOUSE_H - 12} x2={ox} y2={oy - HOUSE_H - 4}
            stroke="#64748b" strokeWidth="1" />
          <line x1={ox + coverW1} y1={oy - HOUSE_H - 12} x2={ox + coverW1} y2={oy - HOUSE_H - 4}
            stroke="#64748b" strokeWidth="1" />
          <text x={ox + coverW1 / 2} y={oy - HOUSE_H - 12}
            textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">
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
            textAnchor="middle" fontSize="11" fontWeight="700" fill="#CC2229"
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
