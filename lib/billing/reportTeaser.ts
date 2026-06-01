import type { PlanState as FullPlanState } from "@/lib/billing/plan";
import type { PlanKind } from "@/lib/usage/config";

const TOP_AMARILLO = 3;
const TOP_CHECKLIST = 3;

type HallazgosBuckets = {
  graves_rojo?: unknown[];
  debiles_amarillo?: unknown[];
  bien_verde?: unknown[];
};

function shouldTeaser(planKind: PlanKind | FullPlanState["kind"]): boolean {
  return planKind !== "paid";
}

/** Filtra reporte para evaluación; guardar siempre completo en DB. */
export function applyReportTeaser(
  reporte: Record<string, unknown>,
  planState: FullPlanState | { kind: PlanKind }
): Record<string, unknown> {
  if (!shouldTeaser(planState.kind)) {
    return reporte;
  }

  const out = { ...reporte };
  const hallazgos = (reporte.hallazgos || {}) as HallazgosBuckets;
  const amarillos = [...(hallazgos.debiles_amarillo || [])];
  const verdes = [...(hallazgos.bien_verde || [])];
  const amarillosVisibles = amarillos.slice(0, TOP_AMARILLO);
  const amarillosOcultos = Math.max(0, amarillos.length - TOP_AMARILLO);

  out.hallazgos = {
    graves_rojo: hallazgos.graves_rojo || [],
    debiles_amarillo: amarillosVisibles,
    bien_verde:
      verdes.length > 0
        ? [
            {
              id_rastreo: "_teaser_verde",
              titulo: `${verdes.length} punto(s) fuerte(s)`,
              descripcion_simple: "Activá Pro para ver el detalle completo.",
              descripcion_tecnica: "",
            },
          ]
        : [],
  };

  if (amarillosOcultos > 0) {
    out._teaser = {
      ...(typeof out._teaser === "object" && out._teaser !== null
        ? (out._teaser as Record<string, unknown>)
        : {}),
      amarillos_ocultos: amarillosOcultos,
      mensaje: `+${amarillosOcultos} hallazgo(s) más en Pro`,
    };
  }

  const checklist = Array.isArray(reporte.checklist) ? [...reporte.checklist] : [];
  if (checklist.length > TOP_CHECKLIST) {
    out.checklist = checklist.slice(0, TOP_CHECKLIST);
    out._teaser = {
      ...(typeof out._teaser === "object" && out._teaser !== null
        ? (out._teaser as Record<string, unknown>)
        : {}),
      checklist_ocultos: checklist.length - TOP_CHECKLIST,
    };
  }

  out._teaser = {
    ...(typeof out._teaser === "object" && out._teaser !== null
      ? (out._teaser as Record<string, unknown>)
      : {}),
    parcial: true,
    requiere_pro: true,
  };

  return out;
}

export function applyReportTeaserForPlanKind(
  reporte: Record<string, unknown>,
  planKind: PlanKind
): Record<string, unknown> {
  return applyReportTeaser(reporte, { kind: planKind });
}
