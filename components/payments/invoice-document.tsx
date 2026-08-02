import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const INK = "#12151b";
const MUTED = "#6b7280";
const AMBER = "#e8a33d";
const BORDER = "#e5e5e0";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { fontSize: 18, fontWeight: 700 },
  brandAccent: { color: AMBER },
  docTitle: { fontSize: 14, fontWeight: 700, textAlign: "right" },
  docMeta: { fontSize: 9, color: MUTED, textAlign: "right", marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 20 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  label: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 10.5 },
  table: { marginTop: 8, borderTopWidth: 1, borderTopColor: BORDER },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 6,
  },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  colDesc: { flex: 1 },
  colRight: { width: 90, textAlign: "right" },
  tableHeaderText: { fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 },
  totalsBlock: { marginTop: 16, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", width: 200, justifyContent: "space-between", marginTop: 4 },
  totalLabel: { color: MUTED },
  grandTotalRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 11, fontWeight: 700 },
  statusBadge: {
    marginTop: 24,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  footer: { position: "absolute", bottom: 40, left: 48, right: 48, fontSize: 8, color: MUTED, textAlign: "center" },
});

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#fbe8c8", fg: "#7a4b06" },
  paid: { bg: "#dcf1dd", fg: "#1f6a24" },
  failed: { bg: "#fbdad6", fg: "#8a221a" },
  refunded: { bg: "#e5e5e0", fg: "#404040" },
};

type InvoiceProps = {
  documentLabel: string;
  invoiceNumber: string;
  issuedAt: Date;
  customerName: string;
  customerEmail: string;
  car: { make: string; model: string; year: number };
  startDate: string;
  endDate: string;
  days: number;
  pricePerDay: string;
  totalPrice: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "card" | "cash" | null;
  transactionRef: string | null;
  paidAt: Date | null;
};

export function InvoiceDocument({
  documentLabel,
  invoiceNumber,
  issuedAt,
  customerName,
  customerEmail,
  car,
  startDate,
  endDate,
  days,
  pricePerDay,
  totalPrice,
  paymentStatus,
  paymentMethod,
  transactionRef,
  paidAt,
}: InvoiceProps) {
  const statusColor = STATUS_COLORS[paymentStatus];

  return (
    <Document title={`${documentLabel} ${invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>
            Rental<Text style={styles.brandAccent}>Cars</Text>
          </Text>
          <View>
            <Text style={styles.docTitle}>{documentLabel}</Text>
            <Text style={styles.docMeta}>{invoiceNumber}</Text>
            <Text style={styles.docMeta}>
              {issuedAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.label}>Billed to</Text>
            <Text style={styles.value}>{customerName}</Text>
            <Text style={styles.value}>{customerEmail}</Text>
          </View>
          <View>
            <Text style={styles.label}>Rental period</Text>
            <Text style={styles.value}>
              {startDate} &rarr; {endDate}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDesc, styles.tableHeaderText]}>Description</Text>
            <Text style={[styles.colRight, styles.tableHeaderText]}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>
              {car.make} {car.model} ({car.year}) &mdash; {days} day{days > 1 ? "s" : ""} @ $
              {pricePerDay}/day
            </Text>
            <Text style={styles.colRight}>${totalPrice}</Text>
          </View>
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text>${totalPrice}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${totalPrice}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={{ color: statusColor.fg }}>{paymentStatus}</Text>
        </View>

        {paymentMethod && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Payment method</Text>
            <Text style={styles.value}>{paymentMethod === "card" ? "Card" : "Cash on pickup"}</Text>
          </View>
        )}

        {transactionRef && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Transaction reference</Text>
            <Text style={styles.value}>{transactionRef}</Text>
          </View>
        )}

        {paidAt && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Paid on</Text>
            <Text style={styles.value}>
              {paidAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          RentalCars &middot; Thank you for choosing us for your rental.
        </Text>
      </Page>
    </Document>
  );
}
