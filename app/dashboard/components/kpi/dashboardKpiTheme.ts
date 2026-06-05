export const KPI_WARM = {
  border: "#E5C9A8",
  borderSoft: "#CFD6C4",
  surface: "rgba(255,255,255,0.85)",
  textPrimary: "#0a0a0a",
  textSecondary: "#657166",
  textMuted: "#8A968C",
  salmon: "#C4614A",
  red: "#E07070",
  gold: "#D4A843",
  olive: "#7EB893",
  aqua: "#5B9A8B",
} as const;

/** Superficie única para cards sobre fondo durazno (#FDE8D3). */
export const KPI_CARD_SURFACE =
  "relative overflow-hidden rounded-3xl border border-[#E5C9A8]/45 bg-white/85 shadow-[0_8px_24px_rgba(98,72,48,0.06)] transition-all duration-200 ease-in-out hover:shadow-[0_10px_28px_rgba(98,72,48,0.08)]";

export const KPI_CARD_SURFACE_COMPACT =
  "relative overflow-hidden rounded-2xl border border-[#E5C9A8]/45 bg-white/80 shadow-[0_4px_14px_rgba(98,72,48,0.05)] transition-colors duration-200";

export type ScoreTierLabel = "critico" | "regular" | "bueno";

export function getScoreTier(score: number): {
  color: string;
  label: ScoreTierLabel;
} {
  if (score < 50) return { color: KPI_WARM.red, label: "critico" };
  if (score < 80) return { color: KPI_WARM.gold, label: "regular" };
  return { color: KPI_WARM.olive, label: "bueno" };
}

export type FugasCardMode = "critico" | "buen_estado";

export function getFugasCardState(fugas: number): {
  mode: FugasCardMode;
  badge: string;
  accent: string;
  showCount: boolean;
  message: string | null;
} {
  if (fugas > 0) {
    return {
      mode: "critico",
      badge: "CRÍTICO",
      accent: KPI_WARM.salmon,
      showCount: true,
      message: null,
    };
  }
  return {
    mode: "buen_estado",
    badge: "BUEN ESTADO",
    accent: KPI_WARM.aqua,
    showCount: false,
    message: "¡No hay fugas, todo en buen estado!",
  };
}

export type KpiTintVariant = "salmon" | "gold" | "olive";

export function tintVariantForScore(score: number): KpiTintVariant {
  const { label } = getScoreTier(score);
  if (label === "critico") return "salmon";
  if (label === "regular") return "gold";
  return "olive";
}

export function accentForTintVariant(variant: KpiTintVariant): string {
  if (variant === "salmon") return KPI_WARM.salmon;
  if (variant === "gold") return KPI_WARM.gold;
  return KPI_WARM.aqua;
}

/** Shell neutro; el color semántico va en badges, números e iconos. */
export function kpiCardShellClasses(
  _tintVariant?: KpiTintVariant,
  extra = ""
): string {
  return [KPI_CARD_SURFACE, extra].filter(Boolean).join(" ");
}

export function kpiNeutralShellClasses(extra = ""): string {
  return [KPI_CARD_SURFACE, extra].filter(Boolean).join(" ");
}

/** Fila inferior: misma superficie neutra; acento solo en badge e icono. */
export const METRIC_CARD_THEME: Record<
  KpiTintVariant,
  {
    shell: string;
    value: string;
    label: string;
    badgeColor: string;
  }
> = {
  salmon: {
    shell: KPI_CARD_SURFACE,
    value: "text-[#C4614A]",
    label: "text-[#657166]",
    badgeColor: KPI_WARM.salmon,
  },
  gold: {
    shell: KPI_CARD_SURFACE,
    value: "text-[#D4A843]",
    label: "text-[#657166]",
    badgeColor: KPI_WARM.gold,
  },
  olive: {
    shell: KPI_CARD_SURFACE,
    value: "text-[#5B9A8B]",
    label: "text-[#657166]",
    badgeColor: KPI_WARM.aqua,
  },
};

const METRIC_CARD_BASE =
  "relative overflow-hidden rounded-3xl transition-[box-shadow] duration-200 ease-in-out";

export function metricCardShellClasses(
  _tintVariant: KpiTintVariant,
  extra = ""
): string {
  return [METRIC_CARD_BASE, KPI_CARD_SURFACE, extra].filter(Boolean).join(" ");
}

export function metricThemeForVariant(variant: KpiTintVariant) {
  return METRIC_CARD_THEME[variant];
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map(c => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
