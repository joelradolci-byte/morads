import type { ItemResumenHallazgo } from "../ResumenFacilPanel";

export function buildQuickWinsFromReporte(
  reporteJson: unknown
): ItemResumenHallazgo[] {
  const hallazgos = (reporteJson as { hallazgos?: Record<string, unknown> } | null)
    ?.hallazgos;
  if (!hallazgos) return [];

  const rojos = Array.isArray(hallazgos.graves_rojo) ? hallazgos.graves_rojo : [];
  const amarillos = Array.isArray(hallazgos.debiles_amarillo)
    ? hallazgos.debiles_amarillo
    : [];

  const unificados: ItemResumenHallazgo[] = [
    ...rojos
      .filter((r: { id_rastreo?: string; titulo?: string }) => r?.id_rastreo && r?.titulo)
      .map((r: Record<string, unknown>) => ({
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
        tipo: "critico" as const,
      })),
    ...amarillos
      .filter((a: { id_rastreo?: string; titulo?: string }) => a?.id_rastreo && a?.titulo)
      .map((a: Record<string, unknown>) => ({
        id_rastreo: a.id_rastreo as string,
        titulo: a.titulo as string,
        descripcion_simple: a.descripcion_simple as string | undefined,
        descripcion_tecnica: a.descripcion_tecnica as string | undefined,
        problema_detalle:
          (a.problema_detalle as string | undefined) ??
          (a.descripcion as string | undefined) ??
          (a.descripcion_tecnica as string | undefined) ??
          (a.descripcion_simple as string | undefined),
        sugerencia: a.sugerencia as string | undefined,
        razonamiento: (a.razonamiento ?? a.pitch_vendedor) as string | undefined,
        resultado_esperado: a.resultado_esperado as string | undefined,
        tipo: "mejora" as const,
      })),
  ];

  return unificados.slice(0, 3);
}
