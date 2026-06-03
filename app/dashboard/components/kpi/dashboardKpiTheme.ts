export const KPI_WARM = {
  border: "#CFD6C4",
  surface: "rgba(255,255,255,0.9)",
  textPrimary: "#0a0a0a",
  textSecondary: "#657166",
  textMuted: "#4B5563",
  salmon: "#C4614A",
  red: "#E07070",
  gold: "#D4A843",
  olive: "#7EB893",
  aqua: "#5B9A8B",
} as const;

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
    accent: KPI_WARM.olive,
    showCount: false,
    message: "¡No hay fugas, todo en buen estado!",
  };
}

export type KpiTintVariant = "salmon" | "gold" | "olive";

/** Capa de tinte plano sobre fondo #FFFBF7 (25% reposo → 30% hover). */
export const KPI_TINT_LAYER: Record<
  KpiTintVariant,
  { rest: string; hover: string }
> = {
  salmon: {
    rest: "before:bg-[#C4614A]/[0.25]",
    hover: "hover:before:bg-[#C4614A]/[0.30]",
  },
  gold: {
    rest: "before:bg-[#D4A843]/[0.25]",
    hover: "hover:before:bg-[#D4A843]/[0.30]",
  },
  olive: {
    rest: "before:bg-[#7EB893]/[0.25]",
    hover: "hover:before:bg-[#7EB893]/[0.30]",
  },
};

export function tintVariantForScore(score: number): KpiTintVariant {
  const { label } = getScoreTier(score);
  if (label === "critico") return "salmon";
  if (label === "regular") return "gold";
  return "olive";
}

export function accentForTintVariant(variant: KpiTintVariant): string {
  if (variant === "salmon") return KPI_WARM.salmon;
  if (variant === "gold") return KPI_WARM.gold;
  return KPI_WARM.olive;
}

const KPI_CARD_BASE =
  "relative overflow-hidden rounded-3xl border border-[#CFD6C4]/60 bg-[#FFFBF7] shadow-[0_8px_24px_rgba(38,43,39,0.05)] transition-all duration-200 ease-in-out hover:shadow-md before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:content-[''] before:transition-[background-color] before:duration-200 before:ease-in-out";

export function kpiCardShellClasses(
  tintVariant: KpiTintVariant,
  extra = ""
): string {
  const layer = KPI_TINT_LAYER[tintVariant];
  return [KPI_CARD_BASE, layer.rest, layer.hover, extra]
    .filter(Boolean)
    .join(" ");
}

/** Fila inferior: bloques de color sólido 25% → 30% en hover (sin crema). */
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
    shell:
      "bg-[#C4614A]/25 hover:bg-[#C4614A]/30 border border-[#C4614A]/10 shadow-[0_8px_24px_rgba(61,24,18,0.08)] hover:shadow-[0_12px_28px_rgba(61,24,18,0.1)]",
    value: "text-[#3d1812]",
    label: "text-[#4a2820]",
    badgeColor: KPI_WARM.salmon,
  },
  gold: {
    shell:
      "bg-amber-500/25 hover:bg-amber-500/30 border border-amber-600/10 shadow-[0_8px_24px_rgba(61,48,16,0.08)] hover:shadow-[0_12px_28px_rgba(61,48,16,0.1)]",
    value: "text-[#3d2e10]",
    label: "text-[#4a3d18]",
    badgeColor: KPI_WARM.gold,
  },
  olive: {
    shell:
      "bg-emerald-600/20 hover:bg-emerald-600/25 border border-emerald-700/10 shadow-[0_8px_24px_rgba(26,61,50,0.08)] hover:shadow-[0_12px_28px_rgba(26,61,50,0.1)]",
    value: "text-[#1a3d32]",
    label: "text-[#2a4d3d]",
    badgeColor: KPI_WARM.aqua,
  },
};

const METRIC_CARD_BASE =
  "relative overflow-hidden rounded-3xl transition-[background-color,box-shadow] duration-200 ease-in-out";

export function metricCardShellClasses(
  tintVariant: KpiTintVariant,
  extra = ""
): string {
  return [METRIC_CARD_BASE, METRIC_CARD_THEME[tintVariant].shell, extra]
    .filter(Boolean)
    .join(" ");
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
