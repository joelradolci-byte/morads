import {
  formatMonto,
  localeForUi,
  normalizeCurrencyCode,
} from "../../../../lib/formatoMoneda";

export type AccountHealthMiniStats = {
  hallazgosTotal: number;
  criticos: number;
  mejoras: number;
  gastoEnRiesgo: number;
  porcentajeGasto: number;
};

export function buildAccountHealthMiniStats(
  reporteJson: unknown
): AccountHealthMiniStats {
  const reporte = reporteJson as Record<string, unknown> | null;
  const hallazgos = reporte?.hallazgos as Record<string, unknown> | undefined;
  const criticos = Array.isArray(hallazgos?.graves_rojo)
    ? hallazgos.graves_rojo.length
    : 0;
  const mejoras = Array.isArray(hallazgos?.debiles_amarillo)
    ? hallazgos.debiles_amarillo.length
    : 0;

  const diagCuenta = (
    reporte?.diagnostico_salud as { cuenta?: Record<string, unknown> } | undefined
  )?.cuenta;
  const resumen = reporte?.resumen as Record<string, unknown> | undefined;

  const gastoEnRiesgo =
    typeof diagCuenta?.gasto_desperdiciado === "number"
      ? diagCuenta.gasto_desperdiciado
      : typeof resumen?.gasto_desperdiciado === "number"
        ? resumen.gasto_desperdiciado
        : 0;

  const porcentajeGasto =
    typeof diagCuenta?.porcentaje_desperdiciado === "number"
      ? diagCuenta.porcentaje_desperdiciado
      : typeof resumen?.porcentaje_desperdiciado === "number"
        ? resumen.porcentaje_desperdiciado
        : 0;

  return {
    hallazgosTotal: criticos + mejoras,
    criticos,
    mejoras,
    gastoEnRiesgo,
    porcentajeGasto,
  };
}

export function formatCpaCuenta(
  cpa: number | null | undefined,
  currencyCode: string | undefined | null,
  locale?: string
): string {
  if (cpa == null || Number.isNaN(Number(cpa)) || cpa <= 0 || cpa >= 9999) {
    return "—";
  }
  const currency = normalizeCurrencyCode(currencyCode);
  const uiLocale = localeForUi(locale);
  try {
    return new Intl.NumberFormat(uiLocale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(cpa));
  } catch {
    return `$${Number(cpa).toFixed(2)}`;
  }
}

export function formatGastoEnRiesgo(
  amount: number,
  currencyCode: string | undefined | null,
  locale?: string
): string {
  return formatMonto(amount, currencyCode, locale);
}

export type CpaTrendSemantic = "improved" | "worsened";

const CPA_MIN_ABSOLUTE = 0.05;

export function cpaFromReporte(reporteJson: unknown): number | null {
  const resumen = (reporteJson as Record<string, unknown> | null)?.resumen as
    | Record<string, unknown>
    | undefined;
  const cpa = resumen?.cpa_promedio_cuenta;
  if (typeof cpa !== "number" || Number.isNaN(cpa) || cpa <= 0 || cpa >= 9999) {
    return null;
  }
  return cpa;
}

/** Opción B: improved = CPA bajó (mejor), worsened = CPA subió (peor). */
export function cpaTrendSemantic(
  actual: number | null,
  anterior: number | null
): CpaTrendSemantic | null {
  if (actual == null || anterior == null) return null;
  const delta = actual - anterior;
  const threshold = Math.max(CPA_MIN_ABSOLUTE, anterior * 0.01);
  if (Math.abs(delta) < threshold) return null;
  return delta < 0 ? "improved" : "worsened";
}

export function cpaTrendAriaLabel(
  trend: CpaTrendSemantic | null,
  locale?: string
): string | undefined {
  if (!trend) return undefined;
  if (locale === "en") {
    return trend === "improved"
      ? "CPA decreased compared to previous audit"
      : "CPA increased compared to previous audit";
  }
  return trend === "improved"
    ? "CPA bajó respecto a la auditoría anterior"
    : "CPA subió respecto a la auditoría anterior";
}
