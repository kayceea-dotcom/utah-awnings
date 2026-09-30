import { Svg, Rect, Line, Polygon, Text, G, View, StyleSheet } from "@react-pdf/renderer";
import { computeCoverDiagramGeometry, type CoverDiagramGeometryInput } from "./coverDiagramGeometry";
import type { WallConfig } from "./pricing/types";

// Small triangular arrowhead for a dimension line, pointing outward (away
// from the measured span) at whichever end it's drawn on. `dir` is -1 for
// the left/top end, +1 for the right/bottom end. Kept in sync with the
// on-screen version in components/quote/CoverDiagram.tsx.
function hArrowPoints(x: number, y: number, dir: -1 | 1): string {
  return (x + dir * 6) + "," + y + " " + x + "," + (y - 3) + " " + x + "," + (y + 3);
}
function vArrowPoints(x: number, y: number, dir: -1 | 1): string {
  return x + "," + (y + dir * 6) + " " + (x - 3) + "," + y + " " + (x + 3) + "," + y;
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, marginTop: 2, marginBottom: 2 },
  label: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, padding: 5, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  svgBox: { alignItems: "center", padding: 4 },
  empty: { fontSize: 9, color: "#999999", padding: 12, textAlign: "center" },
});

const bold = { fontFamily: "Helvetica-Bold" };

// PDF equivalent of components/quote/CoverDiagram.tsx, drawn from the same
// shared geometry so the printed contract's diagram matches what the
// customer actually saw. @react-pdf's SVG support has no <pattern> fill, so
// the hatched house wall becomes a flat gray fill here - everything else
// (lines, rects, text, rotated labels) maps directly to real SVG primitives.
export default function CoverDiagramPdf({ input, walls = [], maxWidth = 220, maxHeight = 170 }: { input: CoverDiagramGeometryInput; walls?: WallConfig[]; maxWidth?: number; maxHeight?: number }) {
  const geo = computeCoverDiagramGeometry(input);

  if (!geo) return null;

  const {
    svgW, svgH, ox, oy, HOUSE_H,
    hasRun2, isHouseJog, totalW,
    coverW1, coverH1, coverW2, coverH2,
    run1TopY, run2TopY, run1FrontY, run2FrontY,
    beamY1, beamY2, showBeam1, showBeam2, postRowY1, postRowY2, scale,
    postPositions, postPositions2, multiSpanBeams,
    tailCount, tailCount2, frontEdgeY, frontEdgeY2, tailTipY, tailTipY2, backTailTipY,
    downspoutPositions, beamType1, beamType2, width1, width2, projection1,
    showRafterTails, isLattice, rafterXs, tubeYs,
    isFreestanding, rearBeamY, rearPostPositions,
  } = geo;
  const projection2 = input.projection2 ?? 0;

  // Scale the whole diagram down to fit a comfortable box on the printed
  // page - the on-screen version can run wide/tall for big covers, but the
  // contract needs everything through the signature to fit on one page, so
  // both dimensions are capped (whichever is more restrictive wins).
  const pdfScale = Math.min(maxWidth / svgW, maxHeight / svgH, 1);
  const displayW = svgW * pdfScale;
  const displayH = svgH * pdfScale;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Cover Diagram - Top View</Text>
      <View style={styles.svgBox}>
        <Svg viewBox={"0 0 " + svgW + " " + svgH} width={displayW} height={displayH}>
          {/* House wall - freestanding has none, a rear beam + posts are drawn below instead */}
          {!isFreestanding && (
            isHouseJog ? (
              <G>
                <Rect x={ox - 4} y={run1TopY - HOUSE_H} width={coverW1 + (hasRun2 ? 4 : 8)} height={HOUSE_H}
                  fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
                <Rect x={ox + coverW1} y={run2TopY - HOUSE_H} width={coverW2 + 8} height={HOUSE_H}
                  fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
              </G>
            ) : (
              <Rect x={ox - 4} y={oy - HOUSE_H} width={totalW + 8} height={HOUSE_H}
                fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
            )
          )}
          <Text x={ox + totalW / 2} y={oy - HOUSE_H / 2 + 4} textAnchor="middle" fill="#475569" style={{ ...bold, fontSize: 9 }}>
            {input.mountStyle === "roof_mount" ? "REAR BEAM (SKYLIFT)" : isFreestanding ? "REAR BEAM" : "HOUSE"}
          </Text>

          {/* Cover rectangle run 1 - lattice pergola gets an outline only, rafters/tubes convey the cover */}
          <Rect x={ox} y={run1TopY} width={coverW1} height={coverH1} fill={isLattice ? "transparent" : "#eff6ff"} stroke="#3b82f6" strokeWidth={1.5} />

          {/* Cover rectangle run 2 */}
          {hasRun2 && (
            <Rect x={ox + coverW1} y={run2TopY} width={coverW2} height={coverH2} fill="#f0fdf4" stroke="#22c55e" strokeWidth={1.5} />
          )}

          {/* Hanger dashed line - skipped when freestanding, the rear beam below takes its place */}
          {!isFreestanding && (
            isHouseJog ? (
              <G>
                <Line x1={ox} y1={run1TopY} x2={ox + coverW1} y2={run1TopY} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,3" />
                <Line x1={ox + coverW1} y1={run2TopY} x2={ox + coverW1 + coverW2} y2={run2TopY} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,3" />
              </G>
            ) : (
              <Line x1={ox} y1={oy} x2={ox + totalW} y2={oy} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,3" />
            )
          )}

          {/* Rear beam + its own posts (freestanding only) */}
          {isFreestanding && (
            <G>
              <Line x1={ox} y1={rearBeamY} x2={ox + totalW} y2={rearBeamY} stroke="#1e40af" strokeWidth={3} />
              {rearPostPositions.map((px, i) => {
                const numberSoFar = postPositions.length + postPositions2.length
                  + multiSpanBeams.reduce((s, b) => s + b.postXs.length, 0) + i + 1;
                return (
                  <G key={"rear-post-" + i}>
                    <Rect x={px - 5} y={rearBeamY - 5} width={10} height={10} fill="#1e293b" rx={1} />
                    <Text x={px} y={rearBeamY + 4} textAnchor="middle" fill="white" style={{ ...bold, fontSize: 7 }}>{String(numberSoFar)}</Text>
                  </G>
                );
              })}
            </G>
          )}

          {/* Beam line run 1 - a house jog's beam is one continuous run flush across
              the FULL combined width (matching the Jog Type dropdown's own "1 beam"
              label) rather than two separate per-run segments - Beam Type #2 doesn't
              apply to it, so it's drawn here instead of as its own "run 2" line below. */}
          {showBeam1 && (
            beamType1 === "double_3x8" ? (
              <G>
                <Line x1={ox} y1={beamY1 - 3} x2={ox + (isHouseJog ? totalW : coverW1)} y2={beamY1 - 3} stroke="#1e40af" strokeWidth={2} />
                <Line x1={ox} y1={beamY1 + 3} x2={ox + (isHouseJog ? totalW : coverW1)} y2={beamY1 + 3} stroke="#1e40af" strokeWidth={2} />
              </G>
            ) : (
              <Line x1={ox} y1={beamY1} x2={ox + (isHouseJog ? totalW : coverW1)} y2={beamY1} stroke="#1e40af" strokeWidth={3} />
            )
          )}

          {/* Beam line run 2 - not drawn on a house jog, whose one continuous beam is
              already the full-width line above. */}
          {hasRun2 && showBeam2 && !isHouseJog && (
            beamType2 === "double_3x8" ? (
              <G>
                <Line x1={ox + coverW1} y1={beamY2 - 3} x2={ox + coverW1 + coverW2} y2={beamY2 - 3} stroke="#15803d" strokeWidth={2} />
                <Line x1={ox + coverW1} y1={beamY2 + 3} x2={ox + coverW1 + coverW2} y2={beamY2 + 3} stroke="#15803d" strokeWidth={2} />
              </G>
            ) : (
              <Line x1={ox + coverW1} y1={beamY2} x2={ox + coverW1 + coverW2} y2={beamY2} stroke="#15803d" strokeWidth={3} />
            )
          )}

          {/* Multi-span beams */}
          {multiSpanBeams.map((b, i) => (
            <Line key={"ms-beam-" + i} x1={ox} y1={b.y} x2={ox + coverW1} y2={b.y} stroke="#7c3aed" strokeWidth={3} strokeDasharray="8,3" />
          ))}

          {/* Side plates run 1 - freestanding extends the back end too, mirroring the front */}
          <Line x1={ox} y1={backTailTipY} x2={ox} y2={tailTipY} stroke="#1e40af" strokeWidth={2.5} />
          <Line x1={ox + coverW1} y1={backTailTipY} x2={ox + coverW1} y2={tailTipY} stroke="#1e40af" strokeWidth={2.5} />

          {/* Rafter tails run 1 - lattice rafters are drawn full-length instead */}
          {!isLattice && showRafterTails && Array.from({ length: tailCount }).map((_, i) => {
            const rx = ox + (width1 / (tailCount + 1)) * (i + 1) * scale;
            return <Line key={i} x1={rx} y1={frontEdgeY} x2={rx} y2={tailTipY} stroke="#1e40af" strokeWidth={2} />;
          })}

          {/* Rear rafter tails - freestanding only, mirrors the front's stubs past the rear edge */}
          {isFreestanding && !isLattice && showRafterTails && Array.from({ length: tailCount }).map((_, i) => {
            const rx = ox + (width1 / (tailCount + 1)) * (i + 1) * scale;
            return <Line key={"rear-tail-" + i} x1={rx} y1={run1TopY} x2={rx} y2={backTailTipY} stroke="#1e40af" strokeWidth={2} />;
          })}

          {/* Pergola rafters - full length, house wall to 1ft-past-beam tip */}
          {isLattice && rafterXs.map((rx, i) => (
            <Line key={"rafter-" + i} x1={rx} y1={run1TopY} x2={rx} y2={frontEdgeY} stroke="#1e40af" strokeWidth={2} />
          ))}

          {/* Lattice tubes - cross the rafters at their real spacing, parallel to the house */}
          {isLattice && tubeYs.map((ty, i) => (
            <Line key={"tube-" + i} x1={ox} y1={ty} x2={ox + coverW1} y2={ty} stroke="#93c5fd" strokeWidth={1} />
          ))}

          {/* Side plate run 2 */}
          {hasRun2 && (
            <Line x1={ox + coverW1 + coverW2} y1={run2TopY} x2={ox + coverW1 + coverW2} y2={tailTipY2} stroke="#15803d" strokeWidth={2.5} />
          )}

          {/* Rafter tails run 2 */}
          {hasRun2 && showRafterTails && Array.from({ length: tailCount2 }).map((_, i) => {
            const rx = ox + coverW1 + (width2 / (tailCount2 + 1)) * (i + 1) * scale;
            return <Line key={"r2-" + i} x1={rx} y1={frontEdgeY2} x2={rx} y2={tailTipY2} stroke="#15803d" strokeWidth={2} />;
          })}

          {/* Posts run 1 */}
          {postPositions.map((px, i) => (
            <G key={i}>
              <Rect x={px - 5} y={postRowY1 - 5} width={10} height={10} fill="#1e293b" rx={1} />
              <Text x={px} y={postRowY1 + 4} textAnchor="middle" fill="white" style={{ ...bold, fontSize: 7 }}>{String(i + 1)}</Text>
            </G>
          ))}

          {/* Posts run 2 */}
          {postPositions2.map((px, i) => (
            <G key={"r2-post-" + i}>
              <Rect x={px - 5} y={postRowY2 - 5} width={10} height={10} fill="#1e293b" rx={1} />
              <Text x={px} y={postRowY2 + 4} textAnchor="middle" fill="white" style={{ ...bold, fontSize: 7 }}>{String(postPositions.length + i + 1)}</Text>
            </G>
          ))}

          {/* Posts on multi-span beams */}
          {(() => {
            let numberSoFar = postPositions.length + postPositions2.length;
            return multiSpanBeams.map((b, bi) =>
              b.postXs.map((px, i) => {
                numberSoFar += 1;
                return (
                  <G key={"ms-post-" + bi + "-" + i}>
                    <Rect x={px - 5} y={b.y - 5} width={10} height={10} fill="#7c3aed" rx={1} />
                    <Text x={px} y={b.y + 4} textAnchor="middle" fill="white" style={{ ...bold, fontSize: 7 }}>{String(numberSoFar)}</Text>
                  </G>
                );
              })
            );
          })()}

          {/* Downspouts */}
          {downspoutPositions.map((p, i) => (
            <Rect key={i} x={p.x - 4} y={p.y - 4} width={8} height={8} fill="#0ea5e9" rx={1} />
          ))}

          {/* Width dimension - double-headed arrow + WIDTH label so the
              customer signing the contract can tell which measurement is
              which. Kept in sync with the on-screen version. */}
          <Line x1={ox} y1={oy - HOUSE_H - 8} x2={ox + coverW1} y2={oy - HOUSE_H - 8} stroke="#64748b" strokeWidth={1} />
          <Polygon points={hArrowPoints(ox, oy - HOUSE_H - 8, -1)} fill="#64748b" />
          <Polygon points={hArrowPoints(ox + coverW1, oy - HOUSE_H - 8, 1)} fill="#64748b" />
          <Text x={ox + coverW1 / 2} y={oy - HOUSE_H - 24} textAnchor="middle" fill="#64748b" style={{ ...bold, fontSize: 8 }}>
            WIDTH
          </Text>
          <Text x={ox + coverW1 / 2} y={oy - HOUSE_H - 12} textAnchor="middle" fill="#1e293b" style={{ ...bold, fontSize: 16 }}>
            {width1}&apos;
          </Text>

          {/* Projection dimension (rotated label) - double-headed arrow + DEPTH label */}
          <Line x1={ox + coverW1 + 10} y1={run1TopY} x2={ox + coverW1 + 10} y2={run1FrontY} stroke="#CC2229" strokeWidth={1.5} />
          <Polygon points={vArrowPoints(ox + coverW1 + 10, run1TopY, -1)} fill="#CC2229" />
          <Polygon points={vArrowPoints(ox + coverW1 + 10, run1FrontY, 1)} fill="#CC2229" />
          <Text x={ox + coverW1 + 38} y={(run1TopY + run1FrontY) / 2 + 4} textAnchor="middle" fill="#CC2229"
            style={{ ...bold, fontSize: 8 }}
            transform={"rotate(90," + (ox + coverW1 + 38) + "," + (run1TopY + run1FrontY) / 2 + ")"}>
            DEPTH
          </Text>
          <Text x={ox + coverW1 + 22} y={(run1TopY + run1FrontY) / 2 + 4} textAnchor="middle" fill="#CC2229"
            style={{ ...bold, fontSize: 16 }}
            transform={"rotate(90," + (ox + coverW1 + 22) + "," + (run1TopY + run1FrontY) / 2 + ")"}>
            {projection1}&apos;
          </Text>

          {/* Width dimension - run 2 */}
          {hasRun2 && (
            <G>
              <Line x1={ox + coverW1} y1={oy - HOUSE_H - 8} x2={ox + coverW1 + coverW2} y2={oy - HOUSE_H - 8} stroke="#64748b" strokeWidth={1} />
              <Polygon points={hArrowPoints(ox + coverW1, oy - HOUSE_H - 8, -1)} fill="#64748b" />
              <Polygon points={hArrowPoints(ox + coverW1 + coverW2, oy - HOUSE_H - 8, 1)} fill="#64748b" />
              <Text x={ox + coverW1 + coverW2 / 2} y={oy - HOUSE_H - 24} textAnchor="middle" fill="#64748b" style={{ ...bold, fontSize: 8 }}>
                WIDTH
              </Text>
              <Text x={ox + coverW1 + coverW2 / 2} y={oy - HOUSE_H - 12} textAnchor="middle" fill="#1e293b" style={{ ...bold, fontSize: 16 }}>
                {width2}&apos;
              </Text>
            </G>
          )}

          {/* Projection dimension (rotated label) - run 2 */}
          {hasRun2 && (
            <G>
              <Line x1={ox + coverW1 + coverW2 + 10} y1={run2TopY} x2={ox + coverW1 + coverW2 + 10} y2={run2FrontY} stroke="#CC2229" strokeWidth={1.5} />
              <Polygon points={vArrowPoints(ox + coverW1 + coverW2 + 10, run2TopY, -1)} fill="#CC2229" />
              <Polygon points={vArrowPoints(ox + coverW1 + coverW2 + 10, run2FrontY, 1)} fill="#CC2229" />
              <Text x={ox + coverW1 + coverW2 + 38} y={(run2TopY + run2FrontY) / 2 + 4} textAnchor="middle" fill="#CC2229"
                style={{ ...bold, fontSize: 8 }}
                transform={"rotate(90," + (ox + coverW1 + coverW2 + 38) + "," + (run2TopY + run2FrontY) / 2 + ")"}>
                DEPTH
              </Text>
              <Text x={ox + coverW1 + coverW2 + 22} y={(run2TopY + run2FrontY) / 2 + 4} textAnchor="middle" fill="#CC2229"
                style={{ ...bold, fontSize: 16 }}
                transform={"rotate(90," + (ox + coverW1 + coverW2 + 22) + "," + (run2TopY + run2FrontY) / 2 + ")"}>
                {projection2}&apos;
              </Text>
            </G>
          )}

          {/* Sq ft label */}
          <Text x={ox + coverW1 / 2} y={(run1TopY + run1FrontY) / 2 + 4} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 9 }}>
            {width1 * projection1} sq ft
          </Text>

          {/* Sq ft label - run 2 */}
          {hasRun2 && (
            <Text x={ox + coverW1 + coverW2 / 2} y={(run2TopY + run2FrontY) / 2 + 4} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 9 }}>
              {width2 * projection2} sq ft
            </Text>
          )}

          {/* Walls - schematic only (not to scale with the wall's own length/
              height), just enough to show where each one sits. Kept in sync
              with the on-screen version in components/quote/CoverDiagram.tsx. */}
          {walls.map((wall, i) => {
            const groupKey = wall.position === "side" ? wall.position + (wall.side || "left") : wall.position;
            const sameBefore = walls.slice(0, i).filter((w) =>
              (w.position === "side" ? w.position + (w.side || "left") : w.position) === groupKey).length;
            const offset = sameBefore * 5;
            const wallLabel = "WALL " + (i + 1) + " • " + wall.length + "' x " + wall.height + "'H";
            if (wall.position === "back") {
              const y = run1TopY - 3 - offset;
              return (
                <G key={"wall-" + i}>
                  <Line x1={ox} y1={y} x2={ox + coverW1} y2={y} stroke="#9ca3af" strokeWidth={4} strokeLinecap="round" />
                  <Polygon points={hArrowPoints(ox, y, -1)} fill="#6b7280" />
                  <Polygon points={hArrowPoints(ox + coverW1, y, 1)} fill="#6b7280" />
                  <Text x={ox + coverW1 / 2} y={run1TopY + 10 + offset} textAnchor="middle" fill="#6b7280" style={{ ...bold, fontSize: 7 }}>
                    {wallLabel}
                  </Text>
                </G>
              );
            }
            if (wall.position === "front") {
              const y = run1FrontY + 3 + offset;
              return (
                <G key={"wall-" + i}>
                  <Line x1={ox} y1={y} x2={ox + coverW1} y2={y} stroke="#9ca3af" strokeWidth={4} strokeLinecap="round" />
                  <Polygon points={hArrowPoints(ox, y, -1)} fill="#6b7280" />
                  <Polygon points={hArrowPoints(ox + coverW1, y, 1)} fill="#6b7280" />
                  <Text x={ox + coverW1 / 2} y={run1FrontY - 6 - offset} textAnchor="middle" fill="#6b7280" style={{ ...bold, fontSize: 7 }}>
                    {wallLabel}
                  </Text>
                </G>
              );
            }
            const isRight = wall.side === "right";
            const x = isRight ? ox + coverW1 + 3 + offset : ox - 3 - offset;
            const labelX = isRight ? x - 10 - offset : x + 10 + offset;
            const midY = (run1TopY + run1FrontY) / 2;
            return (
              <G key={"wall-" + i}>
                <Line x1={x} y1={run1TopY} x2={x} y2={run1FrontY} stroke="#9ca3af" strokeWidth={4} strokeLinecap="round" />
                <Polygon points={vArrowPoints(x, run1TopY, -1)} fill="#6b7280" />
                <Polygon points={vArrowPoints(x, run1FrontY, 1)} fill="#6b7280" />
                <Text x={labelX} y={midY} textAnchor="middle" fill="#6b7280"
                  style={{ ...bold, fontSize: 7 }}
                  transform={"rotate(90," + labelX + "," + midY + ")"}>
                  {wallLabel}
                </Text>
              </G>
            );
          })}

          {/* Legend */}
          <Rect x={ox} y={svgH - 16} width={8} height={8} fill="#1e293b" rx={1} />
          <Text x={ox + 12} y={svgH - 8} fill="#475569" style={{ fontSize: 9 }}>Post</Text>
          <Rect x={ox + 44} y={svgH - 16} width={8} height={8} fill="#0ea5e9" rx={1} />
          <Text x={ox + 56} y={svgH - 8} fill="#475569" style={{ fontSize: 9 }}>Downspout</Text>
          <Line x1={ox + 110} y1={svgH - 12} x2={ox + 122} y2={svgH - 12} stroke="#1e40af" strokeWidth={3} />
          <Text x={ox + 126} y={svgH - 8} fill="#475569" style={{ fontSize: 9 }}>Beam</Text>
          {multiSpanBeams.length > 0 && (
            <G>
              <Line x1={ox + 162} y1={svgH - 12} x2={ox + 174} y2={svgH - 12} stroke="#7c3aed" strokeWidth={3} strokeDasharray="8,3" />
              <Text x={ox + 178} y={svgH - 8} fill="#475569" style={{ fontSize: 9 }}>Multi-Span Beam</Text>
            </G>
          )}
          {walls.length > 0 && (
            <G>
              <Line x1={ox + (multiSpanBeams.length > 0 ? 280 : 162)} y1={svgH - 12} x2={ox + (multiSpanBeams.length > 0 ? 292 : 174)} y2={svgH - 12}
                stroke="#9ca3af" strokeWidth={4} strokeLinecap="round" />
              <Text x={ox + (multiSpanBeams.length > 0 ? 296 : 178)} y={svgH - 8} fill="#475569" style={{ fontSize: 9 }}>Wall</Text>
            </G>
          )}
        </Svg>
      </View>
    </View>
  );
}
