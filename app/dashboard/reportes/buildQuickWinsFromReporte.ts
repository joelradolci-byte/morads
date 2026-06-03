import type { ItemResumenHallazgo } from "../ResumenFacilPanel";

const MAX_RESUMEN_ITEMS = 5;
/** Dashboard: las 3 acciones más importantes (críticos primero). */
export const MAX_QUICK_WINS_DASHBOARD = 3;
const MAX_POSITIVOS = 2;

function mapHallazgo(
  r: Record<string, unknown>,
  tipo: "critico" | "mejora"
): ItemResumenHallazgo {
  return {
    id_rastreo: r.id_rastreo as string,
    titulo: r.titulo as string,
    descripcion_simple: r.descripcion_simple as string | undefined,
    descripcion_tecnica: r.descripcion_tecnica as string | undefined,
    problema_detalle:
      (r.problema_detalle as string | undefined) ??
      (r.descripcion as string | undefined) ??
      (r.descripcion_tecnica as string | undefined) ??
      (r.descripcion_simple as string | undefined),
    sugerencia: r.sugerencia as string | undefined,
    razonamiento: (r.razonamiento ?? r.pitch_vendedor) as string | undefined,
    resultado_esperado: r.resultado_esperado as string | undefined,
    tipo,
  };
}

export function countHallazgosAccionables(reporteJson: unknown): number {
  const hallazgos = (reporteJson as { hallazgos?: Record<string, unknown> } | null)?.hallazgos;
  if (!hallazgos) return 0;
  const rojos = Array.isArray(hallazgos.graves_rojo) ? hallazgos.graves_rojo.length : 0;
  const amarillos = Array.isArray(hallazgos.debiles_amarillo)
    ? hallazgos.debiles_amarillo.length
    : 0;
  return rojos + amarillos;
}

export function buildQuickWinsFromReporte(
  reporteJson: unknown,
  limit = MAX_RESUMEN_ITEMS
): ItemResumenHallazgo[] {
  const hallazgos = (reporteJson as { hallazgos?: Record<string, unknown> } | null)?.hallazgos;
  if (!hallazgos) return [];

  const rojos = Array.isArray(hallazgos.graves_rojo) ? hallazgos.graves_rojo : [];
  const amarillos = Array.isArray(hallazgos.debiles_amarillo)
    ? hallazgos.debiles_amarillo
    : [];

  const unificados: ItemResumenHallazgo[] = [
    ...rojos
      .filter((r: { id_rastreo?: string; titulo?: string }) => r?.id_rastreo && r?.titulo)
      .map((r: Record<string, unknown>) => mapHallazgo(r, "critico")),
    ...amarillos
      .filter((a: { id_rastreo?: string; titulo?: string }) => a?.id_rastreo && a?.titulo)
      .map((a: Record<string, unknown>) => mapHallazgo(a, "mejora")),
  ];

  return unificados.slice(0, limit);
}

/** Ítems verdes para bloque "Qué está bien" en el resumen. */
export function buildPositivosFromReporte(reporteJson: unknown): ItemResumenHallazgo[] {
  const hallazgos = (reporteJson as { hallazgos?: Record<string, unknown> } | null)?.hallazgos;
  if (!hallazgos) return [];
  const verdes = Array.isArray(hallazgos.bien_verde) ? hallazgos.bien_verde : [];
  return verdes
    .filter((v: { id_rastreo?: string; titulo?: string }) => v?.id_rastreo && v?.titulo)
    .slice(0, MAX_POSITIVOS)
    .map((v: Record<string, unknown>) => ({
      ...mapHallazgo(v, "mejora"),
      tipo: "mejora" as const,
    }));
}
