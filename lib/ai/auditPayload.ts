import type { HallazgoRedactor } from "./types";

/** Payload compacto para IA (sin heatmaps completos). */
export function construirPayloadEstratega(esqueleto: Record<string, unknown>): Record<string, unknown> {
  const hallazgos = esqueleto.hallazgos as Record<string, unknown[]> | undefined;
  const stripHallazgo = (h: Record<string, unknown>) => ({
    id_rastreo: h.id_rastreo,
    titulo: h.titulo,
    descripcion_tecnica: h.descripcion_tecnica || "",
    descripcion_simple: h.descripcion_simple || "",
  });

  const destripador = esqueleto.destripador as Record<string, unknown> | undefined;
  const dayparting = esqueleto.dayparting as Record<string, unknown> | undefined;
  const robin = esqueleto.robin_hood as Record<string, unknown> | undefined;

  return {
    health_score: esqueleto.health_score,
    perfil_aplicado: esqueleto.perfil_aplicado,
    resumen: esqueleto.resumen,
    hallazgos: {
      graves_rojo: (hallazgos?.graves_rojo || []).map(h => stripHallazgo(h as Record<string, unknown>)),
      debiles_amarillo: (hallazgos?.debiles_amarillo || []).map(h =>
        stripHallazgo(h as Record<string, unknown>)
      ),
      bien_verde: (hallazgos?.bien_verde || []).map(h => stripHallazgo(h as Record<string, unknown>)),
    },
    fugas_criticas_count: Array.isArray(esqueleto.fugas_criticas) ? esqueleto.fugas_criticas.length : 0,
    top_fugas_criticas: Array.isArray(esqueleto.fugas_criticas)
      ? (esqueleto.fugas_criticas as Record<string, unknown>[]).slice(0, 5)
      : [],
    destripador_resumen: destripador
      ? {
          ahorro_estimado: destripador.ahorro_estimado,
          cantidad_palabras_basura: destripador.cantidad_palabras_basura,
          total_terminos_analizados: destripador.total_terminos_analizados,
        }
      : null,
    dayparting_resumen: dayparting
      ? {
          ahorro_estimado: dayparting.ahorro_estimado,
          franjas_con_fuga: dayparting.franjas_con_fuga,
          patron_principal: dayparting.patron_principal,
        }
      : null,
    robin_hood_resumen: robin
      ? {
          estado: robin.estado,
          confianza: robin.confianza,
          total_reasignado: robin.total_reasignado,
          justificacion: robin.justificacion,
        }
      : null,
    n_gramas: esqueleto.n_gramas,
  };
}

export function stripHallazgoParaRedactor(h: Record<string, unknown>): HallazgoRedactor {
  return {
    id_rastreo: String(h.id_rastreo ?? ""),
    titulo: String(h.titulo ?? ""),
    descripcion_tecnica: String(h.descripcion_tecnica ?? ""),
    descripcion_simple: String(h.descripcion_simple ?? ""),
  };
}

export function contarHallazgos(payload: { hallazgos: HallazgosPayload }): number {
  const h = payload.hallazgos;
  return h.graves_rojo.length + h.debiles_amarillo.length + h.bien_verde.length;
}

type HallazgosPayload = {
  graves_rojo: unknown[];
  debiles_amarillo: unknown[];
  bien_verde: unknown[];
};
