// components/pdf/ReportePDF.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatMonto, localeForUi } from "@/lib/formatoMoneda";

// ─── Paleta Mora ────────────────────────────────────────────────────────────
const C = {
  bg: "#fdfbf7",
  white: "#ffffff",
  stone950: "#1c1917",
  stone800: "#292524",
  stone600: "#57534e",
  stone400: "#a8a29e",
  stone200: "#e7e5e4",
  salmon: "#c4614a",
  salmonLight: "#fde8e4",
  red: "#b91c1c",
  redLight: "#fee2e2",
  yellow: "#b45309",
  yellowLight: "#fef3c7",
  green: "#166534",
  greenLight: "#dcfce7",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingHorizontal: 36,
    paddingVertical: 32,
    fontFamily: "Helvetica",
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: C.stone200,
    paddingBottom: 10,
    marginBottom: 20,
  },
  agencyInitial: {
    backgroundColor: C.salmon,
    color: C.white,
    width: 28,
    height: 28,
    borderRadius: 6,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 7,
    marginRight: 8,
  },
  agencyName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.stone950,
  },
  headerRight: {
    fontSize: 7.5,
    color: C.stone600,
    textAlign: "right",
    lineHeight: 1.6,
  },

  // ── Títulos ──
  sectionTag: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.salmon,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.stone950,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 9,
    color: C.stone600,
    marginBottom: 18,
    lineHeight: 1.5,
  },

  // ── Conclusión ejecutiva ──
  conclusionBox: {
    backgroundColor: C.stone800,
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
  },
  conclusionText: {
    fontSize: 9,
    color: "#d6d3d1",
    lineHeight: 1.6,
    fontStyle: "italic",
  },

  // ── Health Score ──
  scoreRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  scoreCircleWrap: {
    width: "28%",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.stone200,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: "#fca5a5",
    backgroundColor: C.redLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  scoreNumber: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: C.red,
  },
  scoreLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.red,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scoreDesc: {
    width: "72%",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.stone200,
    padding: 14,
    justifyContent: "center",
  },
  scoreDescTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.stone950,
    marginBottom: 6,
  },
  scoreDescText: {
    fontSize: 9,
    color: C.stone600,
    lineHeight: 1.6,
  },

  // ── Tabla financiera ──
  table: {
    borderWidth: 1,
    borderColor: C.stone200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.stone800,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: C.stone200,
    backgroundColor: C.white,
  },
  tableRowAlt: {
    backgroundColor: "#f8f7f5",
  },
  tableCell: {
    fontSize: 9,
    color: C.stone950,
  },
  tableCellMuted: {
    fontSize: 8.5,
    color: C.stone600,
  },
  tableCellHighlight: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.salmon,
  },

  // ── Hallazgo card ──
  findingCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 13,
    marginBottom: 12,
  },
  findingBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  findingTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.stone950,
    marginBottom: 6,
  },
  findingDivider: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  findingBlock: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
  },
  findingBlockLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  findingBlockText: {
    fontSize: 8.5,
    lineHeight: 1.5,
    color: C.stone800,
  },

  // ── Página 3: tabla campañas ──
  campTable: {
    borderWidth: 1,
    borderColor: C.stone200,
    borderRadius: 8,
    overflow: "hidden",
  },
  campHeader: {
    flexDirection: "row",
    backgroundColor: C.stone800,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  campHeaderCell: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  campRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.stone200,
    backgroundColor: C.white,
    alignItems: "center",
  },
  campRowAlt: { backgroundColor: "#f8f7f5" },
  campCell: { fontSize: 8.5, color: C.stone950 },

  // ── Veredicto badge ──
  badge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.stone200,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: C.stone400,
  },

  watermarkWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  watermarkText: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: C.salmon,
    opacity: 0.14,
    letterSpacing: 2,
  },
  watermarkSub: {
    fontSize: 10,
    color: C.stone600,
    opacity: 0.2,
    marginTop: 8,
  },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null, meta?: AuditMeta) {
  if (n == null) return "—";
  return formatMonto(n, meta?.currency_code ?? "USD", meta?.idioma_ui ?? "es");
}

function getScoreColor(score: number) {
  if (score < 40) return { border: "#fca5a5", bg: C.redLight, text: C.red };
  if (score < 70) return { border: "#fcd34d", bg: C.yellowLight, text: C.yellow };
  return { border: "#86efac", bg: C.greenLight, text: C.green };
}

function getCampaignVeredicto(camp: Campana & { clics?: number }): { label: string; bg: string; text: string } {
  const gasto = camp.gasto ?? 0;
  const clics = camp.clics ?? 0;
  const conv = camp.conversiones ?? 0;
  if (gasto <= 0 && clics <= 0 && conv <= 0) {
    return { label: "Sin datos", bg: "#f5f5f4", text: "#78716c" };
  }
  const cpa = camp.cpa_actual ?? 0;
  const qs = camp.quality_score ?? 10;
  if (cpa === 9999 && gasto <= 0) {
    return { label: "Sin datos", bg: "#f5f5f4", text: "#78716c" };
  }
  if (qs <= 3 || cpa > 100) return { label: "Fuga Crítica", bg: C.redLight, text: C.red };
  if (cpa > 50) return { label: "Drenaje", bg: C.yellowLight, text: C.yellow };
  if (camp.conversiones >= 10 && cpa < 40) return { label: "Salud Óptima", bg: C.greenLight, text: C.green };
  return { label: "Estable", bg: "#e0f2fe", text: "#0369a1" };
}

// ─── Header reutilizable ────────────────────────────────────────────────────

function Header({
  agencyName,
  logoUrl,
  accountName,
  date,
  website,
}: {
  agencyName: string;
  logoUrl?: string;
  accountName: string;
  date: string;
  website?: string;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {logoUrl ? (
          <Image src={logoUrl} style={{ height: 28, maxWidth: 120, objectFit: "contain", marginRight: 8 }} />
        ) : (
          <>
            <Text style={styles.agencyInitial}>{agencyName.charAt(0).toUpperCase()}</Text>
            <Text style={styles.agencyName}>{agencyName}</Text>
          </>
        )}
      </View>
      <Text style={styles.headerRight}>
        {"Cuenta: " + accountName + "\n"}
        {"Fecha: " + date}
        {website ? `\n${website}` : ""}
      </Text>
    </View>
  );
}

function TrialWatermark() {
  return (
    <View style={styles.watermarkWrap} fixed>
      <Text style={styles.watermarkText}>EVALUACIÓN MORA</Text>
      <Text style={styles.watermarkSub}>Activá Watchdog para exportar sin marca</Text>
    </View>
  );
}

function Footer({
  page,
  total,
  legalText,
}: {
  page: number;
  total: number;
  legalText?: string;
}) {
  const left =
    legalText?.trim() ||
    "Generado con Mora · Diagnóstico de ineficiencias en Google Ads";
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>{left}</Text>
      <Text style={styles.footerText}>
        Página {page} de {total}
      </Text>
    </View>
  );
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface ReporteData {
  health_score: number;
  gasto_total_cuenta: number;
  conversiones_totales: number;
  cpa_promedio_cuenta: number;
  resumen: {
    gasto_desperdiciado: number;
    porcentaje_desperdiciado: number;
  };
  n_gramas?: {
    ahorro_estimado: number;
    cantidad_palabras: number;
    palabras: string[];
  };
  cuenta_sin_cambios_urgentes?: boolean;
  diagnostico_salud?: {
    cuenta?: {
      nivel?: string;
      cuenta_sin_cambios_urgentes?: boolean;
      razones?: string[];
    };
  };
  hallazgos: {
    graves_rojo: Hallazgo[];
    debiles_amarillo: Hallazgo[];
    bien_verde?: Hallazgo[];
  };
  campanas: Campana[];
}

interface Hallazgo {
  titulo: string;
  descripcion: string;
  descripcion_tecnica?: string;
  descripcion_simple?: string;
}

interface Campana {
  id: string;
  nombre: string;
  estado: string;
  gasto: number;
  presupuesto: number;
  conversiones: number;
  cpa_actual: number | null;
  quality_score?: number;
}

export interface AuditMeta {
  nombre_cuenta: string;
  created_at: string;
  agencia_nombre?: string;
  agencia_logo?: string;
  agencia_web?: string;
  agencia_pie?: string;
  currency_code?: string;
  idioma_ui?: string;
  /** Evaluación gratuita: marca de agua Mora */
  watermark?: boolean;
}

// ─── Página 1: Situación Financiera ─────────────────────────────────────────

function Page1({
  reporte,
  meta,
}: {
  reporte: ReporteData;
  meta: AuditMeta;
}) {
  const scoreColors = getScoreColor(reporte.health_score);
  const date = new Date(meta.created_at).toLocaleDateString(
    localeForUi(meta.idioma_ui)
  );
  const agencyName = meta.agencia_nombre || "Mora";

  const metricas = [
    {
      label: "Inversión Mensual Procesada",
      value: fmt(reporte.gasto_total_cuenta, meta),
      note: "Muestra estadísticamente relevante para auditoría.",
      highlight: false,
    },
    {
      label: "Conversiones Finales Atribuidas",
      value: String(reporte.conversiones_totales ?? "—"),
      note: "Volumen respecto al tráfico pagado.",
      highlight: false,
    },
    {
      label: "Costo por Adquisición (CPA Promedio)",
      value: fmt(reporte.cpa_promedio_cuenta, meta),
      note: "Inflado artificialmente por fugas de subasta.",
      highlight: false,
    },
    {
      label: "Capital Mensual Neto Desperdiciado",
      value: fmt(reporte.resumen?.gasto_desperdiciado, meta),
      note: `Equivale al ${reporte.resumen?.porcentaje_desperdiciado ?? "—"}% del presupuesto drenado.`,
      highlight: true,
    },
  ];

  return (
    <Page size="A4" style={styles.page}>
      <Header
        agencyName={agencyName}
        logoUrl={meta.agencia_logo}
        accountName={meta.nombre_cuenta}
        date={date}
        website={meta.agencia_web}
      />

      <Text style={styles.sectionTag}>Auditoría Estructural · Análisis de Situación Financiera</Text>
      <Text style={styles.pageTitle}>Diagnóstico Macroeconómico</Text>
      <Text style={styles.pageSubtitle}>
        Diagnóstico automatizado mediante lógica determinista. Este documento establece las ineficiencias de
        distribución presupuestaria previo a cualquier optimización técnica activa.
      </Text>

      {/* Health Score */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreCircleWrap}>
          <View style={[styles.scoreCircle, { borderColor: scoreColors.border, backgroundColor: scoreColors.bg }]}>
            <Text style={[styles.scoreNumber, { color: scoreColors.text }]}>{reporte.health_score}</Text>
          </View>
          <Text style={[styles.scoreLabel, { color: scoreColors.text }]}>Salud Base</Text>
        </View>
        <View style={styles.scoreDesc}>
          <Text style={styles.scoreDescTitle}>Marco de Situación Inicial (Margen de Mejora Disponible)</Text>
          <Text style={styles.scoreDescText}>
            Este indicador no califica la calidad de sus productos ni la viabilidad de su negocio, sino el
            volumen de dinero controlable que Google está desviando en este momento. Un score bajo confirma que
            existen ineficiencias severas que, al corregirse, liberarán capital de forma inmediata.
          </Text>
        </View>
      </View>

      {reporte.cuenta_sin_cambios_urgentes && (
        <View
          style={[
            styles.findingCard,
            { borderColor: "#a7f3d0", backgroundColor: "#ecfdf5", marginBottom: 14 },
          ]}
        >
          <Text style={[styles.findingBadge, { color: C.green }]}>Estado de la cuenta</Text>
          <Text style={styles.findingTitle}>
            No se detectaron cambios urgentes obligatorios en esta auditoría
          </Text>
          {(reporte.diagnostico_salud?.cuenta?.razones ?? []).slice(0, 4).map((r, i) => (
            <Text key={i} style={[styles.findingBlockText, { marginTop: 4 }]}>
              · {r}
            </Text>
          ))}
        </View>
      )}

      {/* Conclusión ejecutiva */}
      <View style={styles.conclusionBox}>
        <Text style={[styles.sectionTag, { color: "#d6d3d1", marginBottom: 6 }]}>Conclusión Ejecutiva</Text>
        <Text style={styles.conclusionText}>
          {reporte.cuenta_sin_cambios_urgentes
            ? "La cuenta muestra un rendimiento estable según los umbrales de Mora. No hay correcciones urgentes; el foco puede estar en monitoreo y crecimiento opcional."
            : '"La cuenta se encuentra retenida en un estado de bajo rendimiento debido a causas raíz estructurales. El dinero no está fallando en la conversión final, sino desangrándose en las fases previas de atracción y penalizaciones de tarifa de Google."'}
        </Text>
      </View>

      {/* Tabla de métricas */}
      <Text style={[styles.sectionTag, { marginBottom: 8 }]}>Métricas de Control de Presupuesto</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Indicador Financiero</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "right" }]}>Métrica Cruda</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2.5, paddingLeft: 10 }]}>Estado del Capital</Text>
        </View>
        {metricas.map((m, i) => (
          <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
            <Text style={[m.highlight ? styles.tableCellHighlight : styles.tableCell, { flex: 3 }]}>
              {m.label}
            </Text>
            <Text
              style={[
                m.highlight ? styles.tableCellHighlight : styles.tableCell,
                { flex: 1.2, textAlign: "right", fontFamily: "Courier" },
              ]}
            >
              {m.value}
            </Text>
            <Text style={[styles.tableCellMuted, { flex: 2.5, paddingLeft: 10 }]}>{m.note}</Text>
          </View>
        ))}
      </View>

      <Footer
        page={1}
        total={3}
        legalText={
          meta.watermark
            ? "Evaluación Mora · Documento con marca de agua"
            : meta.agencia_pie
        }
      />
      {meta.watermark ? <TrialWatermark /> : null}
    </Page>
  );
}

// ─── Página 2: Causas Raíz ───────────────────────────────────────────────────

function Page2({ reporte, meta }: { reporte: ReporteData; meta: AuditMeta }) {
  const date = new Date(meta.created_at).toLocaleDateString(
    localeForUi(meta.idioma_ui)
  );
  const agencyName = meta.agencia_nombre || "Mora";
  const graves = reporte.hallazgos?.graves_rojo ?? [];
  const debiles = reporte.hallazgos?.debiles_amarillo ?? [];
  const verdes = reporte.hallazgos?.bien_verde ?? [];

  return (
    <Page size="A4" style={styles.page}>
      <Header
        agencyName={agencyName}
        logoUrl={meta.agencia_logo}
        accountName={meta.nombre_cuenta}
        date={date}
        website={meta.agencia_web}
      />

      <Text style={styles.sectionTag}>Sección: Diagnóstico de Causas Raíz</Text>
      <Text style={styles.pageTitle}>Análisis de Fugas Estructurales</Text>
      <Text style={styles.pageSubtitle}>
        Aislamiento de los motivos técnicos y de negocio que provocan la caída del rendimiento del presupuesto.
      </Text>

      {/* N-gramas si existe */}
      {reporte.n_gramas && (
        <View
          style={[
            styles.findingCard,
            { borderColor: "#fde2e2", backgroundColor: "#fdf2f2", marginBottom: 14 },
          ]}
        >
          <Text style={[styles.findingBadge, { color: C.red }]}>
            Causa #1 · Drenaje Activo por Tráfico Irrelevante · Fuga estimada: {fmt(reporte.n_gramas.ahorro_estimado, meta)} / mes
          </Text>
          <Text style={styles.findingTitle}>
            {reporte.n_gramas.cantidad_palabras} términos detectados acumulando gasto con conversión cero
          </Text>
          <View style={styles.findingDivider}>
            <View style={[styles.findingBlock, { backgroundColor: "#fff5f5" }]}>
              <Text style={[styles.findingBlockLabel, { color: C.red }]}>Implicancia Analítica (Técnico)</Text>
              <Text style={styles.findingBlockText}>
                Términos broadmatch basura: {reporte.n_gramas.palabras.slice(0, 6).join(", ")}
                {reporte.n_gramas.palabras.length > 6 ? ` y ${reporte.n_gramas.palabras.length - 6} más.` : "."}
              </Text>
            </View>
            <View style={[styles.findingBlock, { backgroundColor: "#fef8f7" }]}>
              <Text style={[styles.findingBlockLabel, { color: C.salmon }]}>Lectura de Negocio (Simple)</Text>
              <Text style={styles.findingBlockText}>
                Google está cobrando por clics de usuarios que buscan alternativas gratuitas o manuales.
                Esto desvía el dinero hacia un público sin intenciones de compra.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Hallazgos graves */}
      {graves.map((h, i) => (
        <View
          key={i}
          style={[styles.findingCard, { borderColor: "#fde2e2", backgroundColor: "#fdf2f2" }]}
        >
          <Text style={[styles.findingBadge, { color: C.red }]}>Fuga Crítica</Text>
          <Text style={styles.findingTitle}>{h.titulo}</Text>
          <View style={styles.findingDivider}>
            <View style={[styles.findingBlock, { backgroundColor: "#fff5f5" }]}>
              <Text style={[styles.findingBlockLabel, { color: C.red }]}>Implicancia Analítica (Técnico)</Text>
              <Text style={styles.findingBlockText}>{h.descripcion_tecnica || h.descripcion}</Text>
            </View>
            <View style={[styles.findingBlock, { backgroundColor: "#fef8f7" }]}>
              <Text style={[styles.findingBlockLabel, { color: C.salmon }]}>Lectura de Negocio (Simple)</Text>
              <Text style={styles.findingBlockText}>{h.descripcion_simple || h.descripcion}</Text>
            </View>
          </View>
        </View>
      ))}

      {verdes.map((h, i) => (
        <View
          key={`v-${i}`}
          style={[styles.findingCard, { borderColor: "#a7f3d0", backgroundColor: "#ecfdf5", marginBottom: 14 }]}
        >
          <Text style={[styles.findingBadge, { color: C.green }]}>
            {h.titulo?.toLowerCase().includes("excelente")
              ? "En excelente estado"
              : "En buen estado"}
          </Text>
          <Text style={styles.findingTitle}>{h.titulo}</Text>
          <Text style={styles.findingBlockText}>
            {h.descripcion_simple || h.descripcion_tecnica || h.descripcion}
          </Text>
        </View>
      ))}

      {/* Hallazgos débiles */}
      {debiles.map((h, i) => (
        <View
          key={i}
          style={[styles.findingCard, { borderColor: "#fef3c7", backgroundColor: "#fffdf0" }]}
        >
          <Text style={[styles.findingBadge, { color: C.yellow }]}>Penalización Financiera</Text>
          <Text style={styles.findingTitle}>{h.titulo}</Text>
          <View style={styles.findingDivider}>
            <View style={[styles.findingBlock, { backgroundColor: "#fffbea" }]}>
              <Text style={[styles.findingBlockLabel, { color: C.yellow }]}>Implicancia Analítica (Técnico)</Text>
              <Text style={styles.findingBlockText}>{h.descripcion_tecnica || h.descripcion}</Text>
            </View>
            <View style={[styles.findingBlock, { backgroundColor: "#fffef5" }]}>
              <Text style={[styles.findingBlockLabel, { color: "#a16207" }]}>Lectura de Negocio (Simple)</Text>
              <Text style={styles.findingBlockText}>{h.descripcion_simple || h.descripcion}</Text>
            </View>
          </View>
        </View>
      ))}

      <Footer
        page={2}
        total={3}
        legalText={
          meta.watermark
            ? "Evaluación Mora · Documento con marca de agua"
            : meta.agencia_pie
        }
      />
      {meta.watermark ? <TrialWatermark /> : null}
    </Page>
  );
}

// ─── Página 3: Auditoría por Línea de Inversión ──────────────────────────────

function Page3({ reporte, meta }: { reporte: ReporteData; meta: AuditMeta }) {
  const date = new Date(meta.created_at).toLocaleDateString(
    localeForUi(meta.idioma_ui)
  );
  const agencyName = meta.agencia_nombre || "Mora";
  const campanas = reporte.campanas ?? [];

  return (
    <Page size="A4" style={styles.page}>
      <Header
        agencyName={agencyName}
        logoUrl={meta.agencia_logo}
        accountName={meta.nombre_cuenta}
        date={date}
        website={meta.agencia_web}
      />

      <Text style={styles.sectionTag}>Sección: Auditoría por Línea de Inversión</Text>
      <Text style={styles.pageTitle}>Situación por Línea de Inversión</Text>
      <Text style={styles.pageSubtitle}>
        Evaluación matemática del ecosistema de campañas activo. El orden prioriza los focos de ineficiencia
        comercial de forma estricta.
      </Text>

      <View style={styles.campTable}>
        {/* Header */}
        <View style={styles.campHeader}>
          <Text style={[styles.campHeaderCell, { flex: 3 }]}>Línea de Inversión (Campaña)</Text>
          <Text style={[styles.campHeaderCell, { flex: 1.5 }]}>Veredicto</Text>
          <Text style={[styles.campHeaderCell, { flex: 1, textAlign: "right" }]}>Gasto</Text>
          <Text style={[styles.campHeaderCell, { flex: 0.8, textAlign: "center" }]}>Conv.</Text>
          <Text style={[styles.campHeaderCell, { flex: 1, textAlign: "right" }]}>CPA</Text>
          <Text style={[styles.campHeaderCell, { flex: 0.8, textAlign: "center" }]}>QS</Text>
        </View>

        {/* Rows */}
        {campanas.map((c, i) => {
          const v = getCampaignVeredicto(c);
          return (
            <View key={c.id} style={[styles.campRow, i % 2 !== 0 ? styles.campRowAlt : {}]}>
              <View style={{ flex: 3 }}>
                <Text style={[styles.campCell, { fontFamily: "Helvetica-Bold" }]}>{c.nombre}</Text>
                <Text style={{ fontSize: 7, color: C.stone400, marginTop: 1 }}>
                  Presupuesto: {fmt(c.presupuesto, meta)}
                </Text>
              </View>

              <View style={{ flex: 1.5 }}>
                <View style={[styles.badge, { backgroundColor: v.bg }]}>
                  <Text style={[styles.badgeText, { color: v.text }]}>{v.label}</Text>
                </View>
              </View>

              <Text style={[styles.campCell, { flex: 1, textAlign: "right", fontFamily: "Courier" }]}>
                {fmt(c.gasto, meta)}
              </Text>
              <Text style={[styles.campCell, { flex: 0.8, textAlign: "center" }]}>
                {c.conversiones ?? "—"}
              </Text>
              <Text
                style={[
                  styles.campCell,
                  {
                    flex: 1,
                    textAlign: "right",
                    fontFamily: "Courier",
                    color:
                      c.cpa_actual == null || (c.cpa_actual === 9999 && (c.gasto ?? 0) <= 0)
                        ? "#78716c"
                        : c.cpa_actual > 80
                          ? C.red
                          : C.stone950,
                  },
                ]}
              >
                {c.cpa_actual == null || (c.cpa_actual === 9999 && (c.gasto ?? 0) <= 0)
                  ? "—"
                  : fmt(c.cpa_actual, meta)}
              </Text>
              <Text
                style={[
                  styles.campCell,
                  {
                    flex: 0.8,
                    textAlign: "center",
                    color: !c.quality_score ? C.stone400 : c.quality_score <= 4 ? C.red : c.quality_score <= 6 ? C.yellow : C.green,
                    fontFamily: "Helvetica-Bold",
                  },
                ]}
              >
                {c.quality_score ? `${c.quality_score}/10` : "—"}
              </Text>
            </View>
          );
        })}
      </View>

      <Footer
        page={3}
        total={3}
        legalText={
          meta.watermark
            ? "Evaluación Mora · Documento con marca de agua"
            : meta.agencia_pie
        }
      />
      {meta.watermark ? <TrialWatermark /> : null}
    </Page>
  );
}

// ─── Documento principal ─────────────────────────────────────────────────────

export function ReportePDF({
  reporte,
  meta,
}: {
  reporte: ReporteData;
  meta: AuditMeta;
}) {
  return (
    <Document
      title={`Auditoría Mora · ${meta.nombre_cuenta}`}
      author={meta.agencia_nombre || "Mora Analytics"}
      subject="Diagnóstico de Ineficiencias Estructurales"
    >
      <Page1 reporte={reporte} meta={meta} />
      <Page2 reporte={reporte} meta={meta} />
      <Page3 reporte={reporte} meta={meta} />
    </Document>
  );
}