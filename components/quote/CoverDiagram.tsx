"use client";

interface Post {
  x: number;
  y: number;
  label?: string;
}

interface CoverDiagramProps {
  projection1: number;
  width1: number;
  projection2?: number;
  width2?: number;
  posts1?: number;
  posts2?: number;
  downspouts?: number;
  className?: string;
}

export default function CoverDiagram({
  projection1, width1,
  projection2 = 0, width2 = 0,
  posts1 = 0, posts2 = 0,
  downspouts = 1,
  className = "",
}: CoverDiagramProps) {
  if (!projection1 || !width1) {
    return (
      <div className={"flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 " + className}
           style={{ minHeight: 200 }}>
        <p className="text-gray-400 text-sm">Enter dimensions to see diagram</p>
      </div>
    );
  }

  // ── Layout constants ──
  const PAD = 48;
  const HOUSE_H = 24;
  const LABEL_H = 24;

  const hasRun2 = projection2 > 0 && width2 > 0;
  const totalWidth = hasRun2 ? width1 + width2 : width1;
  const maxProjection = Math.max(projection1, hasRun2 ? projection2 : 0);

  // Scale to fit in ~400px wide, ~320px tall canvas
  const availW = 380;
  const availH = 260;
  const scaleX = availW / totalWidth;
  const scaleY = availH / maxProjection;
  const scale = Math.min(scaleX, scaleY, 16); // max 16px per foot

  const coverW1 = width1 * scale;
  const coverH1 = projection1 * scale;
  const coverW2 = hasRun2 ? width2 * scale : 0;
  const coverH2 = hasRun2 ? projection2 * scale : 0;
  const totalW = totalWidth * scale;

  const svgW = totalW + PAD * 2 + 40;
  const svgH = Math.max(coverH1, coverH2) + PAD * 2 + HOUSE_H + LABEL_H * 2;

  const originX = PAD + 20;
  const originY = PAD + HOUSE_H;

  // ── Post positions ──
  const postRadius = 5;
  const postList: Post[] = [];

  if (posts1 > 0) {
    // Distribute posts1 evenly along width1, at front edge
    for (let i = 0; i < posts1; i++) {
      const px = originX + (width1 / (posts1 + 1)) * (i + 1) * scale;
      const py = originY + coverH1;
      postList.push({ x: px, y: py, label: String(i + 1) });
    }
  }

  if (hasRun2 && posts2 > 0) {
    for (let i = 0; i < posts2; i++) {
      const px = originX + coverW1 + (width2 / (posts2 + 1)) * (i + 1) * scale;
      const py = originY + coverH2;
      postList.push({ x: px, y: py });
    }
  }

  // ── Downspout positions ──
  const downspoutList: { x: number; y: number }[] = [];
  if (downspouts > 0) {
    for (let i = 0; i < downspouts; i++) {
      const px = originX + (totalWidth / (downspouts + 1)) * (i + 1) * scale;
      downspoutList.push({ x: px, y: originY });
    }
  }

  const hatchSize = 6;

  return (
    <div className={"bg-white rounded-xl border border-gray-200 overflow-hidden " + className}>
      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Cover Diagram — Top View</p>
      </div>
      <div className="flex items-center justify-center p-2 overflow-x-auto">
        <svg
          viewBox={"0 0 " + svgW + " " + svgH}
          width={svgW}
          height={svgH}
          style={{ maxWidth: "100%", height: "auto" }}
        >
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width={hatchSize} height={hatchSize} patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2={hatchSize} stroke="#94a3b8" strokeWidth="1" />
            </pattern>
          </defs>

          {/* House wall */}
          <rect
            x={originX - 8}
            y={originY - HOUSE_H}
            width={totalW + 16}
            height={HOUSE_H}
            fill="url(#hatch)"
            stroke="#64748b"
            strokeWidth="2"
          />
          <text x={originX + totalW / 2} y={originY - HOUSE_H / 2 + 4}
            textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">HOUSE</text>

          {/* Run 1 — main cover */}
          <rect
            x={originX}
            y={originY}
            width={coverW1}
            height={coverH1}
            fill="#eff6ff"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />

          {/* Run 2 */}
          {hasRun2 && (
            <rect
              x={originX + coverW1}
              y={originY}
              width={coverW2}
              height={coverH2}
              fill="#f0fdf4"
              stroke="#22c55e"
              strokeWidth="1.5"
            />
          )}

          {/* Overhang area (shaded) */}
          <rect
            x={originX}
            y={originY + coverH1 - 1.5 * scale}
            width={coverW1}
            height={1.5 * scale}
            fill="#dbeafe"
            opacity={0.5}
          />

          {/* Beam line (1.5ft from front = beam position) */}
          <line
            x1={originX} y1={originY + coverH1 - 1.5 * scale}
            x2={originX + coverW1} y2={originY + coverH1 - 1.5 * scale}
            stroke="#1e40af" strokeWidth="3"
          />

          {/* Rafter tails - short lines extending past beam */}
          {Array.from({ length: Math.round(width1 / 2) }).map((_, i) => {
            const rx = originX + (width1 / (Math.round(width1 / 2) + 1)) * (i + 1) * scale;
            return (
              <line key={i}
                x1={rx} y1={originY + coverH1 - 1.5 * scale}
                x2={rx} y2={originY + coverH1}
                stroke="#1e40af" strokeWidth="1.5"
                strokeDasharray="3,2"
              />
            );
          })}

          {/* Beam line run 2 */}
          {hasRun2 && (
            <>
              <rect
                x={originX + coverW1}
                y={originY + coverH2 - 1.5 * scale}
                width={coverW2}
                height={1.5 * scale}
                fill="#dcfce7"
                opacity={0.5}
              />
              <line
                x1={originX + coverW1} y1={originY + coverH2 - 1.5 * scale}
                x2={originX + coverW1 + coverW2} y2={originY + coverH2 - 1.5 * scale}
                stroke="#15803d" strokeWidth="3"
              />
            </>
          )}

          {/* Hanger line along house */}
          <line
            x1={originX} y1={originY}
            x2={originX + totalW} y2={originY}
            stroke="#94a3b8" strokeWidth="2"
            strokeDasharray="6,3"
          />

          {/* Posts */}
          {postList.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={postRadius} fill="#1e293b" />
              <text x={p.x} y={p.y - postRadius - 3} textAnchor="middle" fontSize="8" fill="#475569">P</text>
            </g>
          ))}

          {/* Downspouts */}
          {downspoutList.map((d, i) => (
            <g key={i}>
              <rect x={d.x - 4} y={d.y - 8} width={8} height={8} fill="#0ea5e9" rx="1" />
              <text x={d.x} y={d.y + 10} textAnchor="middle" fontSize="7" fill="#0ea5e9">DS</text>
            </g>
          ))}

          {/* ── Dimension labels ── */}

          {/* Width 1 label (top) */}
          <line x1={originX} y1={originY - 10} x2={originX + coverW1} y2={originY - 10} stroke="#64748b" strokeWidth="1" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
          <text x={originX + coverW1 / 2} y={originY - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">
            {width1}{"'"}
          </text>

          {/* Width 2 label (top) */}
          {hasRun2 && (
            <>
              <line x1={originX + coverW1} y1={originY - 10} x2={originX + coverW1 + coverW2} y2={originY - 10} stroke="#64748b" strokeWidth="1" />
              <text x={originX + coverW1 + coverW2 / 2} y={originY - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="#15803d">
                {width2}{"'"}
              </text>
            </>
          )}

          {/* Projection 1 label (right side) */}
          <line x1={originX + coverW1 + 10} y1={originY} x2={originX + coverW1 + 10} y2={originY + coverH1} stroke="#64748b" strokeWidth="1" />
          <text
            x={originX + coverW1 + 22}
            y={originY + coverH1 / 2 + 4}
            fontSize="11" fontWeight="700" fill="#1e293b"
          >
            {projection1}{"'"}
          </text>

          {/* Projection 2 label */}
          {hasRun2 && (
            <>
              <line x1={originX + totalW + 10} y1={originY} x2={originX + totalW + 10} y2={originY + coverH2} stroke="#64748b" strokeWidth="1" />
              <text
                x={originX + totalW + 22}
                y={originY + coverH2 / 2 + 4}
                fontSize="11" fontWeight="700" fill="#15803d"
              >
                {projection2}{"'"}
              </text>
            </>
          )}

          {/* Compass / North indicator */}
          <text x={svgW - 20} y={svgH - 10} fontSize="9" fill="#94a3b8" textAnchor="middle">N</text>
          <line x1={svgW - 20} y1={svgH - 22} x2={svgW - 20} y2={svgH - 14} stroke="#94a3b8" strokeWidth="1.5" />

          {/* Legend */}
          <circle cx={originX} cy={svgH - 12} r={4} fill="#1e293b" />
          <text x={originX + 8} y={svgH - 8} fontSize="9" fill="#475569">Post</text>
          <rect x={originX + 36} y={svgH - 16} width={8} height={8} fill="#0ea5e9" rx="1" />
          <text x={originX + 48} y={svgH - 8} fontSize="9" fill="#475569">Downspout</text>
          <line x1={originX + 100} y1={svgH - 12} x2={originX + 112} y2={svgH - 12} stroke="#1e40af" strokeWidth="3" />
          <text x={originX + 116} y={svgH - 8} fontSize="9" fill="#475569">Beam</text>
        </svg>
      </div>
    </div>
  );
}
