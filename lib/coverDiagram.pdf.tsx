import { Svg, Rect, Line, Text, G, View, StyleSheet } from "@react-pdf/renderer";
import { computeCoverDiagramGeometry, type CoverDiagramGeometryInput } from "./coverDiagramGeometry";

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
export default function CoverDiagramPdf({ input }: { input: CoverDiagramGeometryInput }) {
  const geo = computeCoverDiagramGeometry(input);

  if (!geo) return null;

  const {
    svgW, svgH, ox, oy, HOUSE_H,
    hasRun2, isHouseJog, totalW,
    coverW1, coverH1, coverW2, coverH2,
    run1TopY, run2TopY, run1FrontY,
    beamY1, beamY2, scale,
    postPositions, postPositions2, multiSpanBeams,
    tailCount, tailCount2, frontEdgeY, frontEdgeY2, tailTipY, tailTipY2,
    downspoutPositions, beamType1, beamType2, width1, width2, projection1,
    showRafterTails,
  } = geo;

  // Scale the whole diagram down to fit a comfortable box on the printed
  // page - the on-screen version can run wide/tall for big covers, but the
  // contract needs everything through the signature to fit on one page, so
  // both dimensions are capped (whichever is more restrictive wins).
  const MAX_PDF_W = 220;
  const MAX_PDF_H = 170;
  const pdfScale = Math.min(MAX_PDF_W / svgW, MAX_PDF_H / svgH, 1);
  const displayW = svgW * pdfScale;
  const displayH = svgH * pdfScale;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Cover Diagram - Top View</Text>
      <View style={styles.svgBox}>
        <Svg viewBox={"0 0 " + svgW + " " + svgH} width={displayW} height={displayH}>
          {/* House wall */}
          {isHouseJog ? (
            <G>
              <Rect x={ox - 4} y={run1TopY - HOUSE_H} width={coverW1 + (hasRun2 ? 4 : 8)} height={HOUSE_H}
                fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
              <Rect x={ox + coverW1} y={run2TopY - HOUSE_H} width={coverW2 + 8} height={HOUSE_H}
                fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
            </G>
          ) : (
            <Rect x={ox - 4} y={oy - HOUSE_H} width={totalW + 8} height={HOUSE_H}
              fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
          )}
          <Text x={ox + totalW / 2} y={oy - HOUSE_H / 2 + 4} textAnchor="middle" fill="#475569" style={{ ...bold, fontSize: 9 }}>HOUSE</Text>

          {/* Cover rectangle run 1 */}
          <Rect x={ox} y={run1TopY} width={coverW1} height={coverH1} fill="#eff6ff" stroke="#3b82f6" strokeWidth={1.5} />

          {/* Cover rectangle run 2 */}
          {hasRun2 && (
            <Rect x={ox + coverW1} y={run2TopY} width={coverW2} height={coverH2} fill="#f0fdf4" stroke="#22c55e" strokeWidth={1.5} />
          )}

          {/* Hanger dashed line */}
          {isHouseJog ? (
            <G>
              <Line x1={ox} y1={run1TopY} x2={ox + coverW1} y2={run1TopY} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,3" />
              <Line x1={ox + coverW1} y1={run2TopY} x2={ox + coverW1 + coverW2} y2={run2TopY} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,3" />
            </G>
          ) : (
            <Line x1={ox} y1={oy} x2={ox + totalW} y2={oy} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,3" />
          )}

          {/* Beam line run 1 */}
          {beamType1 === "double_3x8" ? (
            <G>
              <Line x1={ox} y1={beamY1 - 3} x2={ox + coverW1} y2={beamY1 - 3} stroke="#1e40af" strokeWidth={2} />
              <Line x1={ox} y1={beamY1 + 3} x2={ox + coverW1} y2={beamY1 + 3} stroke="#1e40af" strokeWidth={2} />
            </G>
          ) : (
            <Line x1={ox} y1={beamY1} x2={ox + coverW1} y2={beamY1} stroke="#1e40af" strokeWidth={3} />
          )}

          {/* Beam line run 2 */}
          {hasRun2 && (
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

          {/* Side plates run 1 */}
          <Line x1={ox} y1={run1TopY} x2={ox} y2={tailTipY} stroke="#1e40af" strokeWidth={2.5} />
          <Line x1={ox + coverW1} y1={run1TopY} x2={ox + coverW1} y2={tailTipY} stroke="#1e40af" strokeWidth={2.5} />

          {/* Rafter tails run 1 */}
          {showRafterTails && Array.from({ length: tailCount }).map((_, i) => {
            const rx = ox + (width1 / (tailCount + 1)) * (i + 1) * scale;
            return <Line key={i} x1={rx} y1={frontEdgeY} x2={rx} y2={tailTipY} stroke="#1e40af" strokeWidth={2} />;
          })}

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
              <Rect x={px - 5} y={beamY1 - 5} width={10} height={10} fill="#1e293b" rx={1} />
              <Text x={px} y={beamY1 + 4} textAnchor="middle" fill="white" style={{ ...bold, fontSize: 7 }}>{String(i + 1)}</Text>
            </G>
          ))}

          {/* Posts run 2 */}
          {postPositions2.map((px, i) => (
            <G key={"r2-post-" + i}>
              <Rect x={px - 5} y={beamY2 - 5} width={10} height={10} fill="#1e293b" rx={1} />
              <Text x={px} y={beamY2 + 4} textAnchor="middle" fill="white" style={{ ...bold, fontSize: 7 }}>{String(postPositions.length + i + 1)}</Text>
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

          {/* Width dimension */}
          <Line x1={ox} y1={oy - HOUSE_H - 8} x2={ox + coverW1} y2={oy - HOUSE_H - 8} stroke="#64748b" strokeWidth={1} />
          <Line x1={ox} y1={oy - HOUSE_H - 12} x2={ox} y2={oy - HOUSE_H - 4} stroke="#64748b" strokeWidth={1} />
          <Line x1={ox + coverW1} y1={oy - HOUSE_H - 12} x2={ox + coverW1} y2={oy - HOUSE_H - 4} stroke="#64748b" strokeWidth={1} />
          <Text x={ox + coverW1 / 2} y={oy - HOUSE_H - 12} textAnchor="middle" fill="#1e293b" style={{ ...bold, fontSize: 11 }}>
            {width1}&apos;
          </Text>

          {/* Projection dimension (rotated label) */}
          <Line x1={ox + coverW1 + 10} y1={run1TopY} x2={ox + coverW1 + 10} y2={run1FrontY} stroke="#CC2229" strokeWidth={1.5} />
          <Line x1={ox + coverW1 + 6} y1={run1TopY} x2={ox + coverW1 + 14} y2={run1TopY} stroke="#CC2229" strokeWidth={1.5} />
          <Line x1={ox + coverW1 + 6} y1={run1FrontY} x2={ox + coverW1 + 14} y2={run1FrontY} stroke="#CC2229" strokeWidth={1.5} />
          <Text x={ox + coverW1 + 22} y={(run1TopY + run1FrontY) / 2 + 4} textAnchor="middle" fill="#CC2229"
            style={{ ...bold, fontSize: 11 }}
            transform={"rotate(90," + (ox + coverW1 + 22) + "," + (run1TopY + run1FrontY) / 2 + ")"}>
            {projection1}&apos;
          </Text>

          {/* Sq ft label */}
          <Text x={ox + coverW1 / 2} y={(run1TopY + run1FrontY) / 2 + 4} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 9 }}>
            {width1 * projection1} sq ft
          </Text>

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
        </Svg>
      </View>
    </View>
  );
}
