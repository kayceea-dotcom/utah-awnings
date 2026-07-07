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
  posts1 = 0, posts2: _posts2 = 0,
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

  // ── Orientation: House on LEFT, cover extends RIGHT ──
  // X axis = projection (depth of cover, left to right)
  // Y axis = width (along house, top to bottom)

  const PAD = 40;
  const TAIL_LEN = 14;   // rafter tail pixel length sticking left past house wall
  const DIM_SPACE = 28;  // space for dimension labels

  const hasRun2 = projection2 > 0 && width2 > 0;
  const totalWidth = hasRun2 ? width1 + width2 : width1;

  // Scale to fit nicely
  const availH = 260;
  const availW = 300;
  const scaleY = availH / totalWidth;
  const scaleX = availW / Math.max(projection1, projection2 || 0);
  const scale = Math.min(scaleX, scaleY, 14);

  const coverH1 = width1 * scale;
  const coverW1 = projection1 * scale;
  const coverH2 = hasRun2 ? width2 * scale : 0;
  const coverW2 = hasRun2 ? projection2 * scale : 0;
  const totalH = totalWidth * scale;

  const svgW = coverW1 + PAD * 2 + DIM_SPACE + TAIL_LEN;
  const svgH = totalH + PAD * 2 + DIM_SPACE;

  // Origin = top-left of cover (house wall top)
  const ox = PAD + TAIL_LEN;  // left edge = house wall
  const oy = PAD;

  // Beam X position = projection - 1.5ft from front (right side)
  const beamX1 = ox + coverW1 - 1.5 * scale;
  const beamX2 = hasRun2 ? ox + coverW2 - 1.5 * scale : beamX1;

  // Rafter tail count = width / 2
  const tailCount1 = Math.round(width1 / 2);

  // Post positions along beam
  const postPositions1: number[] = [];
  if (posts1 > 0) {
    if (posts1 === 1) {
      postPositions1.push(oy + coverH1 / 2);
    } else {
      for (let i = 0; i < posts1; i++) {
        const offset = i === 0 ? 1.5
          : i === posts1 - 1 ? width1 - 1.5
          : 1.5 + (width1 - 3) * i / (posts1 - 1);
        postPositions1.push(oy + offset * scale);
      }
    }
  }

  return (
    <div className={"bg-white rounded-xl border border-gray-200 overflow-hidden " + className}>
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cover Diagram — Top View</p>
      </div>
      <div className="flex items-center justify-center p-3 overflow-x-auto">
        <svg
          viewBox={"0 0 " + svgW + " " + svgH}
          width={svgW}
          height={svgH}
          style={{ maxWidth: "100%", height: "auto" }}
        >
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#94a3b8" strokeWidth="1" />
            </pattern>
          </defs>

          {/* ── House wall (left edge, hatched) ── */}
          <rect x={ox - 12} y={oy - 4} width={12} height={totalH + 8}
            fill="url(#hatch)" stroke="#64748b" strokeWidth="1.5" />

          {/* ── Run 1 cover rectangle ── */}
          <rect x={ox} y={oy} width={coverW1} height={coverH1}
            fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />

          {/* ── Run 2 cover rectangle ── */}
          {hasRun2 && (
            <rect x={ox} y={oy + coverH1} width={coverW2} height={coverH2}
              fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
          )}

          {/* ── Hanger dashed line along house wall ── */}
          <line x1={ox} y1={oy} x2={ox} y2={oy + totalH}
            stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6,3" />

          {/* ── Beam line run 1 (vertical line near right/front) ── */}
          <line x1={beamX1} y1={oy} x2={beamX1} y2={oy + coverH1}
            stroke="#1e40af" strokeWidth="3" />

          {/* ── Beam line run 2 ── */}
          {hasRun2 && (
            <line x1={beamX2} y1={oy + coverH1} x2={beamX2} y2={oy + coverH1 + coverH2}
              stroke="#15803d" strokeWidth="3" />
          )}

          {/* ── Top plate (horizontal line at top of run 1) ── */}
          <line x1={ox} y1={oy} x2={ox + coverW1} y2={oy}
            stroke="#1e40af" strokeWidth="2" />

          {/* ── Bottom plate (horizontal line at bottom of run 1) ── */}
          <line x1={ox} y1={oy + coverH1} x2={ox + coverW1} y2={oy + coverH1}
            stroke="#1e40af" strokeWidth="2" />

          {/* ── Rafter tails (sticking LEFT past house wall) ── */}
          {showRafterTails && Array.from({ length: tailCount1 }).map((_, i) => {
            const ty = oy + (width1 / (tailCount1 + 1)) * (i + 1) * scale;
            return (
              <g key={i}>
                {/* Tail line from house wall extending left */}
                <line x1={ox - 12} y1={ty} x2={ox - 12 - TAIL_LEN} y2={ty}
                  stroke="#1e40af" strokeWidth="2" />
                {/* Cap at tip */}
                <line x1={ox - 12 - TAIL_LEN} y1={ty - 5} x2={ox - 12 - TAIL_LEN} y2={ty + 5}
                  stroke="#1e40af" strokeWidth="2.5" />
              </g>
            );
          })}

          {/* ── Posts (squares on beam line) ── */}
          {postPositions1.map((py, i) => (
            <g key={i}>
              <rect x={beamX1 - 5} y={py - 5} width={10} height={10}
                fill="#1e293b" rx="1" />
              <text x={beamX1} y={py + 4} textAnchor="middle"
                fontSize="7" fill="white" fontWeight="bold">{i + 1}</text>
            </g>
          ))}

          {/* ── Downspout marker at top of gutter (house wall, top) ── */}
          {downspouts > 0 && Array.from({ length: downspouts }).map((_, i) => {
            const dy = oy + (totalWidth / (downspouts + 1)) * (i + 1) * scale;
            return (
              <g key={i}>
                <rect x={ox - 12} y={dy - 5} width={8} height={8}
                  fill="#0ea5e9" rx="1" />
              </g>
            );
          })}

          {/* ── Dimension: Width (left side, vertical) ── */}
          <line x1={ox - 12 - TAIL_LEN - 8} y1={oy}
                x2={ox - 12 - TAIL_LEN - 8} y2={oy + coverH1}
            stroke="#64748b" strokeWidth="1" />
          <line x1={ox - 12 - TAIL_LEN - 12} y1={oy}
                x2={ox - 12 - TAIL_LEN - 4} y2={oy}
            stroke="#64748b" strokeWidth="1" />
          <line x1={ox - 12 - TAIL_LEN - 12} y1={oy + coverH1}
                x2={ox - 12 - TAIL_LEN - 4} y2={oy + coverH1}
            stroke="#64748b" strokeWidth="1" />
          <text
            x={ox - 12 - TAIL_LEN - 14}
            y={oy + coverH1 / 2 + 4}
            textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b"
            transform={"rotate(-90," + (ox - 12 - TAIL_LEN - 14) + "," + (oy + coverH1 / 2 + 4) + ")"}
          >{width1}{"'"}</text>

          {/* ── Dimension: Projection (top, horizontal, pink like sketch) ── */}
          <line x1={ox + coverW1 + 8} y1={oy}
                x2={ox + coverW1 + 8} y2={oy + coverH1}
            stroke="#CC2229" strokeWidth="1.5" />
          <line x1={ox + coverW1 + 4} y1={oy}
                x2={ox + coverW1 + 12} y2={oy}
            stroke="#CC2229" strokeWidth="1.5" />
          <line x1={ox + coverW1 + 4} y1={oy + coverH1}
                x2={ox + coverW1 + 12} y2={oy + coverH1}
            stroke="#CC2229" strokeWidth="1.5" />
          <text x={ox + coverW1 + 18} y={oy + coverH1 / 2 + 4}
            textAnchor="middle" fontSize="11" fontWeight="700" fill="#CC2229"
            transform={"rotate(90," + (ox + coverW1 + 18) + "," + (oy + coverH1 / 2) + ")"}
          >{projection1}{"'"}</text>

          {/* ── Labels ── */}
          <text x={ox + coverW1 / 2} y={oy + coverH1 / 2 + 4}
            textAnchor="middle" fontSize="9" fill="#94a3b8">
            {width1 * projection1} sq ft
          </text>

          {/* ── Legend ── */}
          <rect x={ox} y={svgH - 16} width={8} height={8} fill="#1e293b" rx="1" />
          <text x={ox + 12} y={svgH - 8} fontSize="9" fill="#475569">Post</text>
          <rect x={ox + 44} y={svgH - 16} width={8} height={8} fill="#0ea5e9" rx="1" />
          <text x={ox + 56} y={svgH - 8} fontSize="9" fill="#475569">Downspout</text>
          <line x1={ox + 108} y1={svgH - 12} x2={ox + 120} y2={svgH - 12}
            stroke="#1e40af" strokeWidth="3" />
          <text x={ox + 124} y={svgH - 8} fontSize="9" fill="#475569">Beam</text>
        </svg>
      </div>
    </div>
  );
}
