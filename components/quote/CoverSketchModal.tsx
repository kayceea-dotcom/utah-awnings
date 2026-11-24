"use client";

import { useMemo, useRef, useState } from "react";
import { X, Plus, Minus, ArrowLeftRight, ArrowUpDown, Undo2 } from "lucide-react";
import {
  analyzeShape, shapeFromRuns, moveVertex, setEdgeLength, addStep, removeStep, normalizeShape,
  boundsOf, edgeLength, fmtFt, toggleJog, swapRuns, runRects, areaSqFt, snap,
  type Pt, type SketchRuns,
} from "@/lib/coverSketch";

const VBW = 340;
const VBH = 330;
const M = 36;        // room around the drawing for edge labels
const HOUSE_H = 14;  // thickness of the house-wall bar
const RED = "#CC2229";

// Draw the cover instead of typing its dimensions. This only ever produces the
// same numbers the form takes (two runs + jog type) - the form and the pricing
// engine stay exactly as they are.
export default function CoverSketchModal({ initial, onApply, onClose, applyNote }: {
  initial: SketchRuns;
  onApply: (runs: SketchRuns) => void;
  onClose: () => void;
  /** Shown above the buttons when applying will also change other fields. */
  applyNote?: (runs: SketchRuns) => string | null;
}) {
  // Start from what the quote already has, or a typical 20 x 12 to sketch on.
  const start = useMemo<Pt[]>(
    () => shapeFromRuns(initial.width1 > 0 && initial.projection1 > 0
      ? initial
      : { width1: 20, projection1: 12, width2: 0, projection2: 0, jog: "none" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [shape, setShape] = useState<Pt[]>(start);
  // The view only re-fits when a drag ends - re-scaling mid-drag would make
  // the corner slide out from under the finger.
  const [fit, setFit] = useState<Pt[]>(start);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [selEdge, setSelEdge] = useState<number | null>(null);
  const [editVal, setEditVal] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  const analysis = useMemo(() => analyzeShape(shape), [shape]);

  const fb = boundsOf(fit);
  const vw = Math.max(fb.w * 1.4, 30);
  const vh = Math.max(fb.h * 1.5, 20);
  const scale = Math.min((VBW - 2 * M) / vw, (VBH - 2 * M - HOUSE_H) / vh);
  const ox = M;
  const oy = M + HOUSE_H;
  const px = (x: number) => ox + x * scale;
  const py = (y: number) => oy + y * scale;

  function settle(next: Pt[]) {
    const n = normalizeShape(next);
    setShape(n);
    setFit(n);
  }

  function pointerFeet(e: React.PointerEvent): { x: number; y: number } | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * VBW;
    const sy = ((e.clientY - r.top) / r.height) * VBH;
    return {
      x: Math.min(Math.max((sx - ox) / scale, 0), vw),
      y: Math.min(Math.max((sy - oy) / scale, 0), vh),
    };
  }

  function onMove(e: React.PointerEvent) {
    if (dragIdx === null) return;
    const f = pointerFeet(e);
    if (!f) return;
    const next = moveVertex(shape, dragIdx, f.x, f.y);
    if (next) setShape(next);
  }

  function endDrag() {
    if (dragIdx === null) return;
    setDragIdx(null);
    settle(shape);
  }

  function selectEdge(i: number) {
    setSelEdge(i);
    setEditVal(fmtFt(edgeLength(shape, i)));
  }

  function onEditLength(v: string) {
    setEditVal(v);
    if (selEdge === null) return;
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return;
    const next = setEdgeLength(shape, selEdge, n);
    if (next) settle(next);
  }

  function applyRuns(r: SketchRuns) {
    settle(shapeFromRuns(r));
    setSelEdge(null);
  }

  const runs = analysis.ok ? analysis.runs : null;
  const rects = runs ? runRects(runs) : [];
  const note = runs && applyNote ? applyNote(runs) : null;

  const edges = shape.map((a, i) => {
    const b = shape[(i + 1) % shape.length];
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);
    // Clockwise outline: edges heading right are the house side, heading left the front.
    const kind: "house" | "front" | "side" = dx > 0 ? "house" : dx < 0 ? "front" : "side";
    const nx = dy > 0 ? 1 : dy < 0 ? -1 : 0; // outward normal
    const ny = dx > 0 ? -1 : dx < 0 ? 1 : 0;
    return { i, a, b, kind, nx, ny, len: edgeLength(shape, i) };
  });

  // Edge-length pills sit just outside their edge; where two would land on top
  // of each other (the corner of a step) the later one slides further out.
  const labelBoxes: { mx: number; my: number; label: string; w: number }[] = [];
  edges.forEach((e) => {
    // House edges carry the wall bar above them, so their label sits above that.
    let mx = px((e.a.x + e.b.x) / 2) + e.nx * 20;
    let my = py((e.a.y + e.b.y) / 2) + e.ny * (e.kind === "house" ? HOUSE_H + 16 : 18);
    const label = fmtFt(e.len) + "'";
    const w = 12 + label.length * 7;
    for (let tries = 0; tries < 4; tries++) {
      const hit = labelBoxes.some((o) => Math.abs(o.mx - mx) < (o.w + w) / 2 + 2 && Math.abs(o.my - my) < 24);
      if (!hit) break;
      // Slide along the edge's own direction so the pill stays beside it.
      if (e.nx !== 0) my += 26; else mx += 34;
    }
    labelBoxes.push({ mx, my, label, w });
  });

  const houseLabelEdge =edges.filter((e) => e.kind === "house").sort((p, q) => q.len - p.len)[0];

  const gridStep = 5;
  const gridLines: number[] = [];
  for (let g = gridStep; g < vw; g += gridStep) gridLines.push(g);
  const gridLinesY: number[] = [];
  for (let g = gridStep; g < vh; g += gridStep) gridLinesY.push(g);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-stretch sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl flex flex-col max-h-full overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <p className="font-bold text-gray-900">Draw the cover</p>
            <p className="text-xs text-gray-500">Drag the dots. The top edge is the house wall.</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-500" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VBW} ${VBH}`}
            className="w-full rounded-xl bg-gray-50 border border-gray-200 select-none"
            style={{ touchAction: "none" }}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {gridLines.map((g) => (
              <line key={"gx" + g} x1={px(g)} y1={oy} x2={px(g)} y2={py(vh)} stroke="#e5e7eb" strokeWidth={1} />
            ))}
            {gridLinesY.map((g) => (
              <line key={"gy" + g} x1={ox} y1={py(g)} x2={px(vw)} y2={py(g)} stroke="#e5e7eb" strokeWidth={1} />
            ))}

            {/* House wall - a bar along every edge that touches the house, so a
                stepped house wall is drawn stepped too */}
            {edges.filter((e) => e.kind === "house").map((e) => (
              <rect key={"hw" + e.i} x={px(e.a.x) - 5} y={py(e.a.y) - HOUSE_H} width={(e.b.x - e.a.x) * scale + 10}
                height={HOUSE_H} fill="#d1d5db" rx={2} />
            ))}
            {houseLabelEdge && (
              <text x={px(houseLabelEdge.a.x) + 6} y={py(houseLabelEdge.a.y) - HOUSE_H / 2 + 3}
                fontSize={8} fontWeight={700} fill="#4b5563" letterSpacing={1.5}>HOUSE</text>
            )}

            {/* Cover */}
            <polygon points={shape.map((p) => `${px(p.x)},${py(p.y)}`).join(" ")}
              fill="rgba(204,34,41,0.10)" stroke="none" />

            {/* Where the two runs meet */}
            {rects.length === 2 && (() => {
              const top = Math.max(rects[0].y, rects[1].y);
              const bottom = Math.min(rects[0].y + rects[0].h, rects[1].y + rects[1].h);
              return <line x1={px(rects[0].w)} y1={py(top)} x2={px(rects[0].w)} y2={py(bottom)}
                stroke={RED} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.6} />;
            })()}
            {rects.length === 2 && rects.map((r, k) => (
              <g key={"run" + k}>
                <circle cx={px(r.x + r.w / 2)} cy={py(r.y + r.h / 2)} r={11} fill="white" stroke={RED} strokeWidth={1.5} />
                <text x={px(r.x + r.w / 2)} y={py(r.y + r.h / 2) + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill={RED}>{k + 1}</text>
              </g>
            ))}

            {/* Edges */}
            {edges.map((e) => (
              <line key={"e" + e.i} x1={px(e.a.x)} y1={py(e.a.y)} x2={px(e.b.x)} y2={py(e.b.y)}
                stroke={e.kind === "house" ? "#6b7280" : RED}
                strokeWidth={selEdge === e.i ? 5 : e.kind === "house" ? 4 : 3} strokeLinecap="round" />
            ))}

            {/* Edge lengths - tap one to type an exact number */}
            {edges.map((e) => {
              const { mx, my, label, w } = labelBoxes[e.i];
              return (
                <g key={"l" + e.i} onClick={() => selectEdge(e.i)} style={{ cursor: "pointer" }}>
                  <rect x={mx - w / 2} y={my - 11} width={w} height={22} rx={11}
                    fill={selEdge === e.i ? RED : "white"} stroke={selEdge === e.i ? RED : "#d1d5db"} />
                  <text x={mx} y={my + 4} textAnchor="middle" fontSize={11} fontWeight={600}
                    fill={selEdge === e.i ? "white" : "#111827"}>{label}</text>
                </g>
              );
            })}

            {/* Corner handles */}
            {shape.map((p, i) => (
              <g key={"h" + i}>
                <circle cx={px(p.x)} cy={py(p.y)} r={9} fill="white" stroke={RED} strokeWidth={3} />
                <circle cx={px(p.x)} cy={py(p.y)} r={22} fill="transparent" style={{ cursor: "grab", touchAction: "none" }}
                  onPointerDown={(e) => {
                    (e.currentTarget as Element).setPointerCapture(e.pointerId);
                    setDragIdx(i);
                    setSelEdge(null);
                  }} />
              </g>
            ))}
          </svg>

          {selEdge !== null && selEdge < shape.length && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <span className="text-sm text-gray-600 flex-1">Exact length of this edge</span>
              <input type="number" inputMode="decimal" step={0.5} min={1} value={editVal}
                onChange={(e) => onEditLength(e.target.value)}
                className="input w-24 text-right" />
              <span className="text-sm text-gray-500">ft</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {runs && runs.jog === "none" && (
              <button className="btn-secondary text-xs px-3 py-2" onClick={() => { settle(addStep(shape)); setSelEdge(null); }}>
                <Plus size={13} /> Add a step
              </button>
            )}
            {runs && runs.jog !== "none" && (
              <>
                <button className="btn-secondary text-xs px-3 py-2" onClick={() => { settle(removeStep(shape)); setSelEdge(null); }}>
                  <Minus size={13} /> Remove step
                </button>
                <button className="btn-secondary text-xs px-3 py-2" onClick={() => applyRuns(toggleJog(runs))}>
                  <ArrowUpDown size={13} /> Step on {runs.jog === "ground" ? "house wall" : "front"} instead
                </button>
                <button className="btn-secondary text-xs px-3 py-2" onClick={() => applyRuns(swapRuns(runs))}>
                  <ArrowLeftRight size={13} /> Swap sides
                </button>
              </>
            )}
            <button className="btn-secondary text-xs px-3 py-2" onClick={() => { settle(start); setSelEdge(null); }}>
              <Undo2 size={13} /> Undo changes
            </button>
          </div>

          {runs ? (
            <div className="text-sm text-gray-700 space-y-0.5">
              {rects.map((r, k) => (
                <p key={k}><span className="font-semibold">Run {k + 1}:</span> {fmtFt(r.w)}&apos; wide x {fmtFt(r.h)}&apos; deep</p>
              ))}
              <p className="text-gray-500">
                {runs.jog === "ground" ? "The front steps; the house wall stays straight. " : runs.jog === "house" ? "The house wall steps; the front stays straight. " : ""}
                {snap(areaSqFt(runs))} sq ft total
              </p>
            </div>
          ) : (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {analysis.ok ? "" : analysis.reason}
            </p>
          )}

          {note && (
            <p className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">{note}</p>
          )}
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-gray-200">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" disabled={!runs}
            onClick={() => { if (runs) { onApply(runs); onClose(); } }}>
            Use this shape
          </button>
        </div>
      </div>
    </div>
  );
}
