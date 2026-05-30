"use client";

import { useMemo } from "react";
import type { DiagnosticoSaludReporte } from "./saludMora";
import type { CampanaMora } from "./motorMora";
import { agruparMatriz, evaluarCampanas } from "./campanasEvaluacion";

export function useCampanasEvaluadas(
  campanas: (CampanaMora & { id: string; nombre: string })[],
  diagnosticoSalud?: DiagnosticoSaludReporte | null
) {
  return useMemo(() => {
    const { cpaPromedio, evaluadas } = evaluarCampanas(campanas, undefined, diagnosticoSalud);
    const activas = evaluadas.filter(e => e.campana.estado === "ENABLED");
    const buckets = agruparMatriz(activas);
    return { cpaPromedio, evaluadas, activas, buckets };
  }, [campanas, diagnosticoSalud]);
}
