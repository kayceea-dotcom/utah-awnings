"use client";

interface CoverDiagramProps {
  projection1: number;
  width1: number;
  projection2?: number;
  width2?: number;
  posts1?: number;
  downspouts?: number;
  showRafterTails?: boolean;
  className?: string;
}

export default function CoverDiagram({
  projection1, width1,
  projection2 = 0, width2 = 0,
  posts1 = 0,
  downspouts = 1,
  showRafterTails = true,
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

  // Beam Y = 1.5ft from BOTTOM (front) of cover
  const beamY1 = oy + coverH1 - 1.5 * scale;

  // Post X positions along beam - 1.5ft from each end, evenly spaced
  const postPositions: number[] = [];
  if (posts1 > 0) {
    if (posts1 === 1) {
      postPositions.push(ox + coverW1 / 2);
    } else {
      for (let i = 0; i < posts1; i++) {
        const pct = i === 0 ? 1.5 / width1
          : i === posts1 - 1 ? (width1 - 1.5) / width1
          : (1.5 + (width1 - 3) * i / (posts1 - 1)) / width1;
        postPositions.push(ox + pct * coverW1);
      }
    }
  }

  // Rafter tail count
  const tailCount = Math.round(width1 / 2);
  // Front edge Y
  const frontEdgeY = oy + coverH1;
  // Tail tip Y (1ft below front edge)
  const tailTipY = frontEdgeY + TAIL_LEN;

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

          {/* House wall at top */}
          <rect x={ox - 4} y={oy - HOUSE_H} width={totalW + 8} height={HOUSE_H}
            fill="url(#hatch)" stroke="#64748b" strokeWidth="1.5" />
          <text x={ox + totalW / 2} y={oy - HOUSE_H / 2 + 4}
            textAnchor="middle" fontSize="9" fill="#475569" fontWeight="600">HOUSE</text>

          {/* Cover rectangle run 1 */}
          <rect x={ox} y={oy} width={coverW1} height={coverH1}
            fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />

          {/* Cover rectangle run 2 */}
          {hasRun2 && (
            <rect x={ox + coverW1} y={oy} width={coverW2} height={coverH2}
              fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
          )}

          {/* Hanger dashed line along house wall (top edge) */}
          <line x1={ox} y1={oy} x2={ox + totalW} y2={oy}
            stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5,3" />

          {/* Beam line run 1 - horizontal, 1.5ft from bottom */}
          <line x1={ox} y1={beamY1} x2={ox + coverW1} y2={beamY1}
            stroke="#1e40af" strokeWidth="3" />

          {/* Beam line run 2 */}
          {hasRun2 && (
            <line x1={ox + coverW1} y1={oy + coverH2 - 1.5 * scale}
                  x2={ox + coverW1 + coverW2} y2={oy + coverH2 - 1.5 * scale}
              stroke="#15803d" strokeWidth="3" />
          )}

          {/* Side plates - full height + tail */}
          <line x1={ox} y1={oy} x2={ox} y2={tailTipY}
            stroke="#1e40af" strokeWidth="2.5" />
          <line x1={ox + coverW1} y1={oy} x2={ox + coverW1} y2={tailTipY}
            stroke="#1e40af" strokeWidth="2.5" />

          {/* Rafter tails - short stubs below front edge */}
          {showRafterTails && Array.from({ length: tailCount }).map((_, i) => {
            const rx = ox + (width1 / (tailCount + 1)) * (i + 1) * scale;
            return (
              <line key={i} x1={rx} y1={frontEdgeY} x2={rx} y2={tailTipY}
                stroke="#1e40af" strokeWidth="2" />
            );
          })}

          {/* Posts on beam */}
          {postPositions.map((px, i) => (
            <g key={i}>
              <rect x={px - 5} y={beamY1 - 5} width={10} height={10}
                fill="#1e293b" rx="1" />
              <text x={px} y={beamY1 + 4} textAnchor="middle"
                fontSize="7" fill="white" fontWeight="bold">{i + 1}</text>
            </g>
          ))}

          {/* Downspouts on top gutter */}
          {downspouts > 0 && Array.from({ length: downspouts }).map((_, i) => {
            const dx = ox + (totalW / (downspouts + 1)) * (i + 1);
            return (
              <rect key={i} x={dx - 4} y={oy - 8} width={8} height={8}
                fill="#0ea5e9" rx="1" />
            );
          })}

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
          <line x1={ox + coverW1 + 10} y1={oy} x2={ox + coverW1 + 10} y2={oy + coverH1}
            stroke="#CC2229" strokeWidth="1.5" />
          <line x1={ox + coverW1 + 6} y1={oy} x2={ox + coverW1 + 14} y2={oy}
            stroke="#CC2229" strokeWidth="1.5" />
          <line x1={ox + coverW1 + 6} y1={oy + coverH1} x2={ox + coverW1 + 14} y2={oy + coverH1}
            stroke="#CC2229" strokeWidth="1.5" />
          <text x={ox + coverW1 + 22} y={oy + coverH1 / 2 + 4}
            textAnchor="middle" fontSize="11" fontWeight="700" fill="#CC2229"
            transform={"rotate(90," + (ox + coverW1 + 22) + "," + (oy + coverH1 / 2) + ")"}>
            {projection1}{"'"}
          </text>

          {/* Sq ft label */}
          <text x={ox + coverW1 / 2} y={oy + coverH1 / 2 + 4}
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
        </svg>
      </div>
    </div>
  );
}
