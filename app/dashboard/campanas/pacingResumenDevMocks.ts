import {
  calcularPacingCampana,
  type CampanaEvaluada,
} from "../../../lib/campanasEvaluacion";
import type { ScoreCampanaResult } from "../../../lib/motorMora";

/** TODO: quitar antes de producción — preview visual del pacing en dashboard */
export const DEV_MOCK_PACING_PREVIEW = process.env.NODE_ENV === "development";

function gastoParaEstado(
  presupuesto: number,
  modo: "sobre" | "sub" | "ritmo"
): number {
  const hoy = new Date();
  const diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const pctMes = (hoy.getDate() / diasMes) * 100;

  if (modo === "sobre") {
    return Math.round(presupuesto * 0.92);
  }
  if (modo === "sub") {
    return Math.max(50, Math.round(presupuesto * 0.02));
  }
  return Math.round(presupuesto * (pctMes / 100));
}

function mockRow(
  id: string,
  nombre: string,
  gasto: number,
  presupuesto: number,
  tag: ScoreCampanaResult["tag"],
  score: number,
  cpa: number
): CampanaEvaluada {
  const pacing = calcularPacingCampana({
    gasto_mensual: gasto,
    presupuesto_mensual: presupuesto,
  });
  return {
    campana: {
      id,
      nombre,
      estado: "ENABLED",
      gasto_mensual: gasto,
      presupuesto_mensual: presupuesto,
      conversiones: 20,
      clics: 500,
      cpa_actual: cpa,
    },
    evaluacion: {
      score,
      tag,
      penalizacion: "",
      cpaActual: cpa,
      gasto,
      presupuesto,
      conversiones: 20,
    },
    cpaObjetivo: 50,
    pacing,
    nivelSalud: "estable",
    requiereAccion: false,
  };
}

/**
 * Top 3 tras ordenar: 1 crítica (sobre) + 2 calmas (sub/estrella).
 * Extras solo para footer "+N campañas".
 */
export function buildDevPacingPreviewMocks(): CampanaEvaluada[] {
  const pres = 10_000;
  return [
    mockRow(
      "mock-pacing-rojo",
      "[Preview] Brand — Sobreinvirtiendo",
      gastoParaEstado(pres, "sobre"),
      pres,
      "BASURA",
      38,
      72
    ),
    mockRow(
      "mock-pacing-amarillo",
      "[Preview] Performance — Subinvirtiendo",
      gastoParaEstado(pres, "sub"),
      pres,
      "ESTRELLA",
      91,
      28
    ),
    mockRow(
      "mock-pacing-display",
      "[Preview] Display — Subinvirtiendo",
      gastoParaEstado(pres, "sub"),
      pres,
      "ESTRELLA",
      85,
      32
    ),
    mockRow(
      "mock-pacing-ritmo",
      "[Preview] Retargeting — En ritmo",
      gastoParaEstado(pres, "ritmo"),
      pres,
      "DUDOSO",
      68,
      45
    ),
    mockRow(
      "mock-pacing-extra",
      "[Preview] Search — Subinvirtiendo",
      gastoParaEstado(pres, "sub"),
      pres,
      "ESTRELLA",
      41,
      30
    ),
  ];
}
