import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ContractData } from "./contract";
import CoverDiagramPdf from "./coverDiagram.pdf";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: "#CC2229", paddingBottom: 8, marginBottom: 10 },
  companyName: { fontSize: 18, color: "#CC2229", fontFamily: "Helvetica-Bold", marginBottom: 3 },
  companyLine: { fontSize: 9, color: "#666666" },
  logo: { height: 32, maxWidth: 160, marginBottom: 6, objectFit: "contain" },
  docTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right" },
  docDate: { fontSize: 9, color: "#666666", textAlign: "right", marginTop: 3 },
  sectionLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#999999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, marginTop: 8 },
  infoTable: {},
  infoRow: { flexDirection: "row", marginBottom: 2 },
  infoCell: { width: "50%", fontSize: 10 },
  infoLabel: { fontFamily: "Helvetica-Bold" },
  totalsBox: { marginTop: 4, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 6 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  totalsLabel: { fontSize: 10, color: "#666666" },
  totalsValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: "#1a1a1a" },
  grandTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#CC2229" },
  termItem: { flexDirection: "row", marginBottom: 6 },
  termNumber: { width: 16, fontSize: 8, fontFamily: "Helvetica-Bold", color: "#999999" },
  termText: { flex: 1, fontSize: 8, lineHeight: 1.4, color: "#444444" },
  signedBox: { marginTop: 8, borderWidth: 1, borderColor: "#bbf7d0", backgroundColor: "#f0fdf4", borderRadius: 4, padding: 8 },
  signedLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#15803d", marginBottom: 3 },
  signedMeta: { fontSize: 9, color: "#166534", marginBottom: 6 },
  signatureImg: { height: 44, maxWidth: 200, objectFit: "contain" },
  unsignedBox: { marginTop: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, padding: 8 },
  unsignedText: { fontSize: 9, color: "#999999", fontStyle: "italic" },
});

export default function ContractPdf({ data }: { data: ContractData }) {
  const isSigned = data.status === "signed" || data.status === "accepted" || data.status === "pending_payment" || data.status === "ordered";

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {data.logoUrl ? (
              <Image src={data.logoUrl} style={styles.logo} />
            ) : (
              <Text style={styles.companyName}>{data.companyName}</Text>
            )}
            {data.companyAddress1 ? <Text style={styles.companyLine}>{data.companyAddress1}</Text> : null}
            {data.companyAddress2 ? <Text style={styles.companyLine}>{data.companyAddress2}</Text> : null}
            {data.companyPhone ? <Text style={styles.companyLine}>{data.companyPhone}</Text> : null}
          </View>
          <View>
            <Text style={styles.docTitle}>CONTRACT & INVOICE</Text>
            <Text style={styles.docDate}>Date: {data.contractDate}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Customer</Text>
        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Name: </Text>{data.customerName}</Text>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Phone: </Text>{data.customerPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Address: </Text>{data.customerAddress}</Text>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Email: </Text>{data.customerEmail}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>City: </Text>{data.customerCity}</Text>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Zip: </Text>{data.customerZip}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Job Details</Text>
        <View style={styles.infoTable}>
          <View style={styles.infoRow}>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Job Name: </Text>{data.jobName}</Text>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Style: </Text>{data.productType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Panel Type: </Text>{data.panelType}</Text>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Panel Color: </Text>{data.panelColor}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Beam: </Text>{data.beamLabel}</Text>
            {data.gutterFasciaColor ? (
              <Text style={styles.infoCell}><Text style={styles.infoLabel}>Gutter/Fascia Color: </Text>{data.gutterFasciaColor}</Text>
            ) : <Text style={styles.infoCell} />}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Wrap: </Text>{data.wrap}</Text>
            {data.postsBeamColor ? (
              <Text style={styles.infoCell}><Text style={styles.infoLabel}>Posts/Beam Color: </Text>{data.postsBeamColor}</Text>
            ) : <Text style={styles.infoCell} />}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>End Cut: </Text>{data.endCut}</Text>
            <Text style={styles.infoCell}><Text style={styles.infoLabel}>Est. Install Date: </Text>{data.installDate}</Text>
          </View>
          {data.fanBeam ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoCell}><Text style={styles.infoLabel}>Fan Beam: </Text>{data.fanBeam}</Text>
            </View>
          ) : null}
          {data.notes ? (
            <View style={styles.infoRow}>
              <Text style={{ fontSize: 10 }}><Text style={styles.infoLabel}>Notes: </Text>{data.notes}</Text>
            </View>
          ) : null}
        </View>

        {data.diagramInput ? <CoverDiagramPdf input={data.diagramInput} /> : null}

        <Text style={styles.sectionLabel}>Contract Summary</Text>
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Down Payment ({data.depositPct}%)</Text>
            <Text style={styles.totalsValue}>{fmt(data.depositAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Balance Due Upon Completion</Text>
            <Text style={styles.totalsValue}>{fmt(data.balanceDue)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Investment</Text>
            <Text style={styles.grandTotalValue}>{fmt(data.totalJobSale)}</Text>
          </View>
        </View>

        {isSigned ? (
          <View style={styles.signedBox} wrap={false}>
            <Text style={styles.signedLabel}>Customer Signed</Text>
            <Text style={styles.signedMeta}>
              Signed on {data.signedAt ? new Date(data.signedAt).toLocaleString() : "-"}
              {data.paymentMethod ? " - Payment: " + data.paymentMethod.replace("_", " ") : ""}
            </Text>
            {data.signatureData ? <Image src={data.signatureData} style={styles.signatureImg} /> : null}
          </View>
        ) : (
          <View style={styles.unsignedBox} wrap={false}>
            <Text style={styles.unsignedText}>Not yet signed by the customer.</Text>
          </View>
        )}
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionLabel}>Terms & Conditions</Text>
        {data.terms.map((term, i) => (
          <View style={styles.termItem} key={i} wrap={false}>
            <Text style={styles.termNumber}>{i + 1}.</Text>
            <Text style={styles.termText}>{term}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
