import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { OrderSheetData } from "./orderSheet";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: "#CC2229", paddingBottom: 12, marginBottom: 16 },
  companyName: { fontSize: 18, color: "#CC2229", fontFamily: "Helvetica-Bold", marginBottom: 3 },
  companyLine: { fontSize: 9, color: "#666666" },
  orderTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right" },
  orderDate: { fontSize: 9, color: "#666666", textAlign: "right", marginTop: 3 },
  specTable: { marginBottom: 16 },
  specRow: { flexDirection: "row", marginBottom: 4 },
  specCell: { width: "50%", fontSize: 10 },
  specLabel: { fontFamily: "Helvetica-Bold" },
  itemsTable: { marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  itemsHeaderRow: { flexDirection: "row", backgroundColor: "#CC2229" },
  itemsHeaderCell: { padding: 6, fontSize: 9, color: "#ffffff", fontFamily: "Helvetica-Bold" },
  itemsRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  itemsCell: { padding: 6, fontSize: 9 },
  colName: { width: "46%" },
  colQty: { width: "14%", textAlign: "center" },
  colLength: { width: "18%", textAlign: "center" },
  colColor: { width: "22%" },
  footer: { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10, fontSize: 9, color: "#666666" },
});

export default function OrderSheetPdf({ data }: { data: OrderSheetData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>Utah Awnings</Text>
            <Text style={styles.companyLine}>1950 W Parkway Blvd, West Valley City, UT 84119</Text>
            <Text style={styles.companyLine}>174 Old Hwy 91 #27, Hurricane, UT 84737</Text>
            <Text style={styles.companyLine}>801-979-5423</Text>
          </View>
          <View>
            <Text style={styles.orderTitle}>MATERIAL ORDER</Text>
            <Text style={styles.orderDate}>Date: {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.specTable}>
          <View style={styles.specRow}>
            <Text style={styles.specCell}><Text style={styles.specLabel}>PO Number: </Text>{data.poNumber}</Text>
            <Text style={styles.specCell}><Text style={styles.specLabel}>Job Name: </Text>{data.jobName}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specCell}><Text style={styles.specLabel}>Salesman: </Text>{data.salesman}</Text>
            <Text style={styles.specCell}><Text style={styles.specLabel}>Customer: </Text>{data.customerName}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specCell}><Text style={styles.specLabel}>Install Address: </Text>{data.installAddress}</Text>
            <Text style={styles.specCell}><Text style={styles.specLabel}>Est. Install Date: </Text>{data.installDate}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specCell}><Text style={styles.specLabel}>Product Type: </Text>{data.productType}</Text>
            <Text style={styles.specCell}><Text style={styles.specLabel}>Salesman Phone: </Text>{data.salesmanPhone}</Text>
          </View>
        </View>

        <View style={styles.itemsTable}>
          <View style={styles.itemsHeaderRow}>
            <Text style={[styles.itemsHeaderCell, styles.colName]}>Item Description</Text>
            <Text style={[styles.itemsHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.itemsHeaderCell, styles.colLength]}>Length (ft)</Text>
            <Text style={[styles.itemsHeaderCell, styles.colColor]}>Color / Spec</Text>
          </View>
          {data.items.map((item, i) => (
            <View style={styles.itemsRow} key={i}>
              <Text style={[styles.itemsCell, styles.colName]}>{item.name}</Text>
              <Text style={[styles.itemsCell, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.itemsCell, styles.colLength]}>{item.length || "-"}</Text>
              <Text style={[styles.itemsCell, styles.colColor]}>{item.color}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text><Text style={styles.specLabel}>Notes: </Text>{data.notes}</Text>
          <Text style={{ marginTop: 6 }}>Please confirm receipt and estimated lead time. Contact salesman with any questions.</Text>
        </View>
      </Page>
    </Document>
  );
}
