import { diffHallazgos, type HallazgoComparable } from "@/app/dashboard/reportes/comparacionHallazgos";

export type AuditRow = {
  id: string | number;
  score: number;
  created_at?: string;
  nombre_cuenta?: string | null;
  reporte_json?: {
    resumen?: { gasto_desperdiciado?: number };
    hallazgos?: {
      graves_rojo?: HallazgoComparable[];
      debiles_amarillo?: HallazgoComparable[];
    };
  };
};

export type ComparacionPdfPayload = {
  meta: {
    nombre_cuenta: string;
    agencia_nombre: string;
    agencia_logo?: string;
    fecha_generacion: string;
  };
  auditA: { fecha: string; score: number; desperdicio: number };
  auditB: { fecha: string; score: number; desperdicio: number };
  deltaScore: number;
  deltaWaste: number;
  fugas: ReturnType<typeof diffHallazgos<HallazgoComparable>>;
  mejoras: ReturnType<typeof diffHallazgos<HallazgoComparable>>;
};

function formatFecha(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function buildComparacionPdfPayload(
  auditA: AuditRow,
  auditB: AuditRow,
  agencia: { agencia_nombre?: string; agencia_logo?: string }
): ComparacionPdfPayload {
  const wasteA = auditA.reporte_json?.resumen?.gasto_desperdiciado ?? 0;
  const wasteB = auditB.reporte_json?.resumen?.gasto_desperdiciado ?? 0;
  const fugasA = auditA.reporte_json?.hallazgos?.graves_rojo ?? [];
  const fugasB = auditB.reporte_json?.hallazgos?.graves_rojo ?? [];
  const mejorasA = auditA.reporte_json?.hallazgos?.debiles_amarillo ?? [];
  const mejorasB = auditB.reporte_json?.hallazgos?.debiles_amarillo ?? [];

  return {
    meta: {
      nombre_cuenta: auditA.nombre_cuenta || auditB.nombre_cuenta || "Cliente",
      agencia_nombre: agencia.agencia_nombre || "Mora Analytics",
      agencia_logo: agencia.agencia_logo,
      fecha_generacion: new Date().toLocaleDateString("es-AR"),
    },
    auditA: {
      fecha: formatFecha(auditA.created_at),
      score: auditA.score,
      desperdicio: wasteA,
    },
    auditB: {
      fecha: formatFecha(auditB.created_at),
      score: auditB.score,
      desperdicio: wasteB,
    },
    deltaScore: auditB.score - auditA.score,
    deltaWaste: wasteA - wasteB,
    fugas: diffHallazgos(fugasA, fugasB),
    mejoras: diffHallazgos(mejorasA, mejorasB),
  };
}
