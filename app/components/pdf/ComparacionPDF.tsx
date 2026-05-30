import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ComparacionPdfPayload } from "@/lib/pdf/comparacionPdfData";

const C = {
  bg: "#fdfbf7",
  stone950: "#1c1917",
  stone600: "#57534e",
  stone200: "#e7e5e4",
  salmon: "#c4614a",
  green: "#166534",
  red: "#b91c1c",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.stone950,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: C.stone200,
    paddingBottom: 10,
    marginBottom: 16,
  },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 9, color: C.stone600 },
  row3: { flexDirection: "row", gap: 10, marginBottom: 16 },
  col: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.stone200,
    borderRadius: 6,
    padding: 10,
  },
  colMid: {
    flex: 1,
    backgroundColor: "#292524",
    borderRadius: 6,
    padding: 10,
  },
  label: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.stone600,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  score: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  midScore: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#f5f0eb", textAlign: "center" },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 6,
    color: C.salmon,
  },
  listItem: { fontSize: 8, marginBottom: 3, lineHeight: 1.35 },
  colTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 4 },
});

function ListaHallazgos({
  titulo,
  items,
}: {
  titulo: string;
  items: { titulo?: string }[];
}) {
  if (items.length === 0) {
    return (
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.colTitle}>{titulo}</Text>
        <Text style={styles.listItem}>—</Text>
      </View>
    );
  }
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.colTitle}>{titulo}</Text>
      {items.slice(0, 8).map((item, i) => (
        <Text key={i} style={styles.listItem}>
          • {item.titulo || "Sin título"}
        </Text>
      ))}
      {items.length > 8 && (
        <Text style={styles.listItem}>… y {items.length - 8} más</Text>
      )}
    </View>
  );
}

export function ComparacionPDF({ data }: { data: ComparacionPdfPayload }) {
  const deltaColor = data.deltaScore >= 0 ? C.green : C.red;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Comparación de auditorías</Text>
          <Text style={styles.subtitle}>
            {data.meta.nombre_cuenta} · {data.meta.agencia_nombre} ·{" "}
            {data.meta.fecha_generacion}
          </Text>
        </View>

        <View style={styles.row3}>
          <View style={styles.col}>
            <Text style={styles.label}>Antes ({data.auditA.fecha})</Text>
            <Text style={styles.score}>{data.auditA.score} pts</Text>
            <Text style={{ marginTop: 6, fontSize: 8 }}>
              Desperdicio: ${data.auditA.desperdicio.toLocaleString()}
            </Text>
          </View>
          <View style={styles.colMid}>
            <Text style={[styles.label, { color: "#a8a29e", textAlign: "center" }]}>
              Impacto
            </Text>
            <Text style={{ ...styles.midScore, color: deltaColor }}>
              {data.deltaScore > 0 ? "+" : ""}
              {data.deltaScore} pts
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 8,
                color: "#d6d3d1",
                textAlign: "center",
              }}
            >
              Presupuesto:{" "}
              {data.deltaWaste >= 0
                ? `+$${data.deltaWaste.toLocaleString()} ahorro`
                : `-$${Math.abs(data.deltaWaste).toLocaleString()}`}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Después ({data.auditB.fecha})</Text>
            <Text style={styles.score}>{data.auditB.score} pts</Text>
            <Text style={{ marginTop: 6, fontSize: 8 }}>
              Desperdicio: ${data.auditB.desperdicio.toLocaleString()}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Fugas críticas</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <ListaHallazgos titulo="Tapadas" items={data.fugas.aplicadas} />
          </View>
          <View style={{ flex: 1 }}>
            <ListaHallazgos titulo="Persistentes" items={data.fugas.persistentes} />
          </View>
          <View style={{ flex: 1 }}>
            <ListaHallazgos titulo="Nuevas" items={data.fugas.nuevas} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Oportunidades de mejora</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <ListaHallazgos titulo="Resueltas" items={data.mejoras.aplicadas} />
          </View>
          <View style={{ flex: 1 }}>
            <ListaHallazgos titulo="Pendientes" items={data.mejoras.persistentes} />
          </View>
          <View style={{ flex: 1 }}>
            <ListaHallazgos titulo="Nuevas" items={data.mejoras.nuevas} />
          </View>
        </View>

        <Text style={{ marginTop: 20, fontSize: 7, color: C.stone600 }}>
          Informe generado con Mora Analytics. Los hallazgos reflejan cada fecha de auditoría.
        </Text>
      </Page>
    </Document>
  );
}
