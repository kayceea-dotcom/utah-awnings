import { Svg, Rect, Line, Text, Path, Polygon, G, View, StyleSheet } from "@react-pdf/renderer";
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
    svgW, svgH, groundY, deckY, deckHpx,
    postX, postWidth, postTopY, postBottomY, embeddedBottomY,
    beamTopY, beamHeight, beamWidth,
    panelTopY, panelHeight, panelFrontX,
    houseX, roofY, tailStartX, tailW,
    footingX, footingWidth,
    isDeck, isGroundMount, houseAttachment, groundAttachment, deckHeight, postHeight, showRafterTail,
  } = geo;

  const MAX_PDF_W = maxWidth;
  const MAX_PDF_H = maxHeight;
  const pdfScale = Math.min(MAX_PDF_W / svgW, MAX_PDF_H / svgH, 1);
  const displayW = svgW * pdfScale;
  const displayH = svgH * pdfScale;

  const tailPath = endCutProfilePath(geo.endCut);
  const tailScaleX = tailW / 44;
  const tailScaleY = (panelHeight + beamHeight) / 24;
  const isEaveMount = houseAttachment === "eave" || houseAttachment === "angled_eave";
  const roofBackX = houseAttachment === "angled_eave" ? houseX - 16 : houseX - 30;
  const wallStubTopY = roofY - 4;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Side Profile</Text>
      <View style={styles.svgBox}>
        <Svg viewBox={"0 0 " + svgW + " " + svgH} width={displayW} height={displayH}>
          {/* House attachment - a flat wall for stucco/siding, or a sloped
              roofline over a short wall stub for an eave/angled-eave mount */}
          {isEaveMount ? (
            <G>
              <Polygon points={roofBackX + ",6 " + (houseX - 4) + "," + wallStubTopY + " " + roofBackX + "," + wallStubTopY}
                fill="#a8a29e" stroke="#57534e" strokeWidth={1.5} />
              <Rect x={houseX - 10} y={wallStubTopY} width={10} height={(roofY + 20) - wallStubTopY} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
              {/* Eave header/fascia board - caps the roofline where it meets
                  the wall, right where the awning's hanger actually attaches */}
              <Rect x={houseX - 12} y={wallStubTopY - 7} width={14} height={9} fill="#92400e" stroke="#78350f" strokeWidth={1} />
            </G>
          ) : (
            <Rect x={houseX - 10} y={10} width={10} height={roofY - 10 + 20} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.5} />
          )}
          <Text x={houseX - 5} y={roofY + 42} textAnchor="middle" fill="#475569" style={{ ...bold, fontSize: 7 }}>
            {HOUSE_ATTACHMENT_LABELS[houseAttachment] || houseAttachment.toUpperCase()}
          </Text>

          {/* Ground line */}
          <Line x1={houseX - 20} y1={groundY} x2={svgW - 10} y2={groundY} stroke="#64748b" strokeWidth={1.5} />
          <Rect x={houseX - 20} y={groundY} width={svgW - 10 - (houseX - 20)} height={8} fill="#e2e8f0" />

          {/* Deck platform */}
          {isDeck && deckY !== null && (
            <G>
              <Rect x={houseX - 20} y={deckY} width={svgW - 10 - (houseX - 20)} height={Math.max(deckHpx, 4)} fill="#fef3c7" stroke="#d97706" strokeWidth={1} />
              <Line x1={houseX - 30} y1={deckY} x2={houseX - 30} y2={groundY} stroke="#d97706" strokeWidth={1} />
              <Line x1={houseX - 34} y1={deckY} x2={houseX - 26} y2={deckY} stroke="#d97706" strokeWidth={1} />
              <Line x1={houseX - 34} y1={groundY} x2={houseX - 26} y2={groundY} stroke="#d97706" strokeWidth={1} />
              <Text x={houseX - 30} y={(deckY + groundY) / 2 + 3} textAnchor="middle" fill="#d97706" style={{ ...bold, fontSize: 7 }}
                transform={"rotate(-90," + (houseX - 30) + "," + (deckY + groundY) / 2 + ")"}>
                {deckHeight}&apos; deck
              </Text>
            </G>
          )}

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

          {/* Panel / wrap edge - sits on top of the beam and overhangs past its front face (18in default) */}
          <Rect x={houseX} y={panelTopY} width={panelFrontX - houseX} height={panelHeight} fill="#93c5fd" stroke="#3b82f6" strokeWidth={1.5} />

          {/* Rafter tail profile - spans the full panel + beam front face */}
          {showRafterTail && (
            <G transform={"translate(" + tailStartX + "," + panelTopY + ") scale(" + tailScaleX + "," + tailScaleY + ")"}>
              <Path d={tailPath} fill="#3b82f6" stroke="#1e3a8a" strokeWidth={1} />
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
