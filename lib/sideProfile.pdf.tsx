import { Svg, Rect, Line, Text, Path, G, View, StyleSheet } from "@react-pdf/renderer";
import { computeSideProfileGeometry, type SideProfileGeometryInput } from "./sideProfileGeometry";
import { endCutProfilePath } from "./endCutProfiles";

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, marginTop: 2, marginBottom: 2 },
  label: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, padding: 5, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  svgBox: { alignItems: "center", padding: 4 },
});

const bold = { fontFamily: "Helvetica-Bold" };

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

// PDF equivalent of components/quote/SideProfileDiagram.tsx, drawn from the
// same shared geometry (lib/sideProfileGeometry.ts) so the printed contract's
// side view matches what the rep/customer saw on screen.
export default function SideProfilePdf({ input, maxWidth = 220, maxHeight = 150 }: { input: SideProfileGeometryInput; maxWidth?: number; maxHeight?: number }) {
  const geo = computeSideProfileGeometry(input);
  if (!geo) return null;

  const {
    svgW, svgH, groundY, deckY, deckHpx, scale,
    postX, postWidth, postTopY, postBottomY, embeddedBottomY,
    beamTopY, beamHeight, beamWidth,
    panelTopY, panelHeight, panelFrontX, panelBackX,
    houseX, roofY, tailStartX, tailW,
    footingX, footingWidth,
    isDeck, isGroundMount, houseAttachment, groundAttachment, deckHeight, postHeight, showRafterTail,
    isLattice, tubeXs, tubeSize, isFreestanding, rear, rearEndCut,
    isEaveMount, eaveSoffit, eaveFascia, eaveRoofLine, wallStubTopY, eaveWallX,
  } = geo;

  const MAX_PDF_W = maxWidth;
  const MAX_PDF_H = maxHeight;
  const pdfScale = Math.min(MAX_PDF_W / svgW, MAX_PDF_H / svgH, 1);
  const displayW = svgW * pdfScale;
  const displayH = svgH * pdfScale;

  const tailPath = endCutProfilePath(geo.endCut);
  const rearTailPath = endCutProfilePath(rearEndCut);
  const tailScaleX = tailW / 44;
  const tailScaleY = panelHeight / 24;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Side Profile</Text>
      <View style={styles.svgBox}>
        <Svg viewBox={"0 0 " + svgW + " " + svgH} width={displayW} height={displayH}>
          {/* House attachment - a flat wall for stucco/siding, or a real
              eave assembly for an eave/angled-eave mount: a soffit board
              under the 2ft overhang, a fascia board capping its front (the
              6in face the awning attaches to), and a roof edge line off
              the fascia's top at a true 45deg */}
          {isFreestanding && rear ? (
            <G>
              {isGroundMount ? (
                <Rect x={rear.postX - rear.footingWidth / 2} y={rear.postBottomY} width={rear.footingWidth}
                  height={(rear.embeddedBottomY ?? rear.postBottomY) - rear.postBottomY}
                  fill="#e2e8f0" stroke="#64748b" strokeWidth={1} strokeDasharray="3,2" />
              ) : (
                <Rect x={rear.footingX} y={groundY - 3} width={rear.footingWidth} height={10} fill="#94a3b8" stroke="#64748b" strokeWidth={1} />
              )}
              <Rect x={rear.postX - postWidth / 2} y={rear.postTopY} width={postWidth} height={rear.postBottomY - rear.postTopY} fill="#1e293b" stroke="#0f172a" strokeWidth={1} />
              <Line x1={rear.postX - 22} y1={rear.postTopY} x2={rear.postX - 22} y2={rear.postBottomY} stroke="#CC2229" strokeWidth={1.5} />
              <Line x1={rear.postX - 26} y1={rear.postTopY} x2={rear.postX - 18} y2={rear.postTopY} stroke="#CC2229" strokeWidth={1.5} />
              <Line x1={rear.postX - 26} y1={rear.postBottomY} x2={rear.postX - 18} y2={rear.postBottomY} stroke="#CC2229" strokeWidth={1.5} />
              <Text x={rear.postX - 34} y={(rear.postTopY + rear.postBottomY) / 2 + 4} textAnchor="middle" fill="#CC2229"
                style={{ ...bold, fontSize: 10 }}
                transform={"rotate(-90," + (rear.postX - 34) + "," + (rear.postTopY + rear.postBottomY) / 2 + ")"}>
                {rear.postHeight}&apos;
              </Text>
              <Rect x={rear.postX - rear.beamWidth / 2} y={rear.beamTopY} width={rear.beamWidth} height={rear.beamHeight} fill="#1e40af" stroke="#1e3a8a" strokeWidth={1} />
            </G>
          ) : isEaveMount ? (
            <G>
              <Rect x={eaveWallX - 10} y={wallStubTopY} width={10} height={groundY - wallStubTopY} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
              <Line x1={eaveRoofLine.x1} y1={eaveRoofLine.y1} x2={eaveRoofLine.x2} y2={eaveRoofLine.y2}
                stroke="#78716c" strokeWidth={5} strokeLinecap="square" />
              <Rect x={eaveSoffit.x} y={eaveSoffit.y} width={eaveSoffit.width} height={eaveSoffit.height}
                fill="#fef3c7" stroke="#d97706" strokeWidth={1} />
              <Rect x={eaveFascia.x} y={eaveFascia.y} width={eaveFascia.width} height={eaveFascia.height}
                fill="#fefce8" stroke="#78350f" strokeWidth={1.5} />
            </G>
          ) : (
            <Rect x={houseX - 10} y={10} width={10} height={groundY - 10} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
          )}
          <Text x={houseX - 5} y={roofY + 42} textAnchor="middle" fill="#475569" style={{ ...bold, fontSize: 7 }}>
            {isFreestanding ? "FREESTANDING" : HOUSE_ATTACHMENT_LABELS[houseAttachment] || houseAttachment.toUpperCase()}
          </Text>

          {/* Ground line - starts past whichever sits further back, the
              wall or (for an eave mount) its overhanging eave - clamped so
              a large overhang can't push it past the diagram's left edge */}
          <Line x1={Math.max(0, eaveWallX - 20)} y1={groundY} x2={svgW - 10} y2={groundY} stroke="#64748b" strokeWidth={1.5} />
          <Rect x={Math.max(0, eaveWallX - 20)} y={groundY} width={svgW - 10 - Math.max(0, eaveWallX - 20)} height={8} fill="#e2e8f0" />

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
            // The deck always runs back to the actual wall - for an eave
            // mount that's set back behind the overhang (eaveWallX), not
            // the fascia/awning attachment point (houseX).
            const deckStartX = eaveWallX;
            const deckDimX = Math.min(houseX - 30, eaveWallX - 10);
            return (
              <G>
                <Rect x={deckStartX} y={deckY} width={deckEdgeX - deckStartX} height={Math.max(deckSkirtPx, 4)} fill="#fef3c7" stroke="#d97706" strokeWidth={1} />
                {skirtBottomY < groundY && (
                  <Rect x={deckPostX - deckPostW / 2} y={skirtBottomY} width={deckPostW} height={groundY - skirtBottomY}
                    fill="#92400e" stroke="#78350f" strokeWidth={1} />
                )}
                <Line x1={deckDimX} y1={deckY} x2={deckDimX} y2={groundY} stroke="#d97706" strokeWidth={1} />
                <Line x1={deckDimX - 4} y1={deckY} x2={deckDimX + 4} y2={deckY} stroke="#d97706" strokeWidth={1} />
                <Line x1={deckDimX - 4} y1={groundY} x2={deckDimX + 4} y2={groundY} stroke="#d97706" strokeWidth={1} />
                <Text x={deckDimX} y={(deckY + groundY) / 2 + 3} textAnchor="middle" fill="#d97706" style={{ ...bold, fontSize: 7 }}
                  transform={"rotate(-90," + deckDimX + "," + (deckY + groundY) / 2 + ")"}>
                  {deckHeight}&apos; deck
                </Text>
              </G>
            );
          })()}

          {/* Footing / embedded post */}
          {isGroundMount ? (
            <Rect x={postX - footingWidth / 2} y={postBottomY} width={footingWidth} height={(embeddedBottomY ?? postBottomY) - postBottomY}
              fill="#e2e8f0" stroke="#64748b" strokeWidth={1} strokeDasharray="3,2" />
          ) : (
            <Rect x={footingX} y={groundY - 3} width={footingWidth} height={10} fill="#94a3b8" stroke="#64748b" strokeWidth={1} />
          )}

          {/* Post */}
          <Rect x={postX - postWidth / 2} y={postTopY} width={postWidth} height={postBottomY - postTopY} fill="#1e293b" stroke="#0f172a" strokeWidth={1} />

          {/* Post height dimension */}
          <Line x1={postX + 22} y1={postTopY} x2={postX + 22} y2={postBottomY} stroke="#CC2229" strokeWidth={1.5} />
          <Line x1={postX + 18} y1={postTopY} x2={postX + 26} y2={postTopY} stroke="#CC2229" strokeWidth={1.5} />
          <Line x1={postX + 18} y1={postBottomY} x2={postX + 26} y2={postBottomY} stroke="#CC2229" strokeWidth={1.5} />
          <Text x={postX + 34} y={(postTopY + postBottomY) / 2 + 4} textAnchor="middle" fill="#CC2229"
            style={{ ...bold, fontSize: 10 }}
            transform={"rotate(90," + (postX + 34) + "," + (postTopY + postBottomY) / 2 + ")"}>
            {postHeight}&apos;
          </Text>

          {/* Beam - drawn end-on (real cross-section), not as a flat slab along the projection */}
          <Rect x={postX - beamWidth / 2} y={beamTopY} width={beamWidth} height={beamHeight} fill="#1e40af" stroke="#1e3a8a" strokeWidth={1} />

          {/* Panel / wrap edge - sits on top of the beam and overhangs past its front face (18in default).
              A pergola's "panel" is its own 2x6 rafter (real 6in height, 1ft overhang) - same rect, different meaning. */}
          <Rect x={panelBackX} y={panelTopY} width={panelFrontX - panelBackX} height={panelHeight} fill="#93c5fd" stroke="#3b82f6" strokeWidth={1.5} />

          {/* Lattice tubes - 2x2 (or 2x3) cross-sections spaced along the rafter's full length */}
          {isLattice && tubeXs.map((tx, i) => (
            <Rect key={"tube-" + i} x={tx - tubeSize / 2} y={panelTopY - tubeSize} width={tubeSize} height={tubeSize}
              fill="#60a5fa" stroke="#1e40af" strokeWidth={0.75} />
          ))}

          {/* Rafter tail profile - spans the full panel + beam front face. Not
              shown for a lattice rafter - the tubes above already read as its real end. */}
          {!isLattice && showRafterTail && (
            <G transform={"translate(" + tailStartX + "," + panelTopY + ") scale(" + tailScaleX + "," + tailScaleY + ")"}>
              <Path d={tailPath} fill="#3b82f6" stroke="#1e3a8a" strokeWidth={1} />
            </G>
          )}

          {/* Rear rafter tail - freestanding only, a horizontally mirrored copy
              of the front tail anchored at the panel's own back edge, using the
              rear beam's own end-cut style. */}
          {isFreestanding && !isLattice && showRafterTail && (
            <G transform={"translate(" + panelBackX + "," + panelTopY + ") scale(" + (-tailScaleX) + "," + tailScaleY + ")"}>
              <Path d={rearTailPath} fill="#3b82f6" stroke="#1e3a8a" strokeWidth={1} />
            </G>
          )}

          <Text x={svgW / 2} y={svgH - 6} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 7 }}>
            {GROUND_ATTACHMENT_LABELS[groundAttachment] || groundAttachment.toUpperCase()}
          </Text>
        </Svg>
      </View>
    </View>
  );
}
