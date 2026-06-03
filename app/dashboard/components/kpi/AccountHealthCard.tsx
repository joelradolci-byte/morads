"use client";

import { BookOpen, History } from "lucide-react";
import ScoreRing from "./ScoreRing";
import ScoreSparkline from "./ScoreSparkline";
import AccountHealthMiniStat, {
  type AccountHealthMiniStatValueTone,
} from "./AccountHealthMiniStat";
import {
  formatCpaCuenta,
  formatGastoEnRiesgo,
  type AccountHealthMiniStats,
  type CpaTrendSemantic,
} from "./accountHealthMetrics";
import {
  getScoreTier,
  kpiCardShellClasses,
  tintVariantForScore,
} from "./dashboardKpiTheme";

type BadgeAuditoria = "recomendado" | "desactualizada" | null;

const TIER_BADGE: Record<ReturnType<typeof getScoreTier>["label"], string> = {
  critico: "CRÍTICO",
  regular: "REGULAR",
  bueno: "BUEN ESTADO",
};

type AccountHealthCardProps = {
  score: number;
  textoUltimaAuditoria: string | null;
  badgeUltimaAuditoria: BadgeAuditoria;
  cuentaSinCambiosUrgentes: boolean;
  scoreHistorico: number[];
  fechasHistorico: string[];
  deltaVsAnterior: number | null;
  miniStats: AccountHealthMiniStats;
  cpaCuenta: number | null;
  cpaTrend: CpaTrendSemantic | null;
  currencyCode: string;
  locale: string;
  resumenLabel: string;
  tieneAuditoria: boolean;
  onVerResumenSimple: () => void;
  onHistorial: () => void;
  /** Comparte fila con Quick Wins: mismo shell, interior llena el área de la card. */
  compact?: boolean;
};

function StatusBadges({
  badgeUltimaAuditoria,
  cuentaSinCambiosUrgentes,
  compact,
}: {
  badgeUltimaAuditoria: BadgeAuditoria;
  cuentaSinCambiosUrgentes: boolean;
  compact?: boolean;
}) {
  const pill = compact
    ? "rounded-lg border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest"
    : "rounded-lg border px-3 py-1 text-[9px] font-black uppercase tracking-widest";

  return (
    <div className="flex flex-wrap gap-2">
      {badgeUltimaAuditoria === "recomendado" && (
        <span
          className={`${pill} border-[#7EB893]/40 bg-[#7EB893]/10 text-[#5B9A8B]`}
        >
          Recomendado auditar
        </span>
      )}
      {badgeUltimaAuditoria === "desactualizada" && (
        <span
          className={`${pill} border-[#D4A843]/40 bg-[#D4A843]/10 text-[#B8860B]`}
        >
          Auditoría desactualizada
        </span>
      )}
      {cuentaSinCambiosUrgentes && (
        <span
          className={`${pill} border-[#7EB893]/40 bg-[#7EB893]/10 text-[#5B9A8B]`}
        >
          Sin cambios urgentes
        </span>
      )}
    </div>
  );
}

export default function AccountHealthCard({
  score,
  textoUltimaAuditoria,
  badgeUltimaAuditoria,
  cuentaSinCambiosUrgentes,
  scoreHistorico,
  fechasHistorico,
  deltaVsAnterior,
  miniStats,
  cpaCuenta,
  cpaTrend,
  currencyCode,
  locale,
  resumenLabel,
  tieneAuditoria,
  onVerResumenSimple,
  onHistorial,
  compact = false,
}: AccountHealthCardProps) {
  const tier = getScoreTier(score);
  const tintVariant = tintVariantForScore(score);
  const showChart = scoreHistorico.length >= 2;
  const ringSize = compact ? 128 : 140;

  const headline =
    tier.label === "bueno"
      ? "Tu cuenta está en buena forma"
      : tier.label === "regular"
        ? "Hay margen de mejora"
        : "La cuenta necesita atención";

  const hallazgosSubtitle =
    miniStats.criticos > 0 || miniStats.mejoras > 0
      ? `${miniStats.criticos} críticos • ${miniStats.mejoras} mejoras`
      : "Sin hallazgos accionables";

  const hallazgosTone: AccountHealthMiniStatValueTone =
    miniStats.criticos > 0 ? "alert" : "neutral";
  const riesgoTone: AccountHealthMiniStatValueTone =
    miniStats.gastoEnRiesgo > 0 ? "alert" : "neutral";
  const cpaTone: AccountHealthMiniStatValueTone =
    cpaTrend === "improved"
      ? "positive"
      : cpaTrend === "worsened"
        ? "alert"
        : "neutral";

  const miniStatProps = [
    {
      label: "Hallazgos",
      value: String(miniStats.hallazgosTotal),
      subtitle: hallazgosSubtitle,
      valueTone: hallazgosTone,
      trend: null as CpaTrendSemantic | null,
    },
    {
      label: "En riesgo",
      value: formatGastoEnRiesgo(miniStats.gastoEnRiesgo, currencyCode, locale),
      subtitle: `${miniStats.porcentajeGasto.toFixed(1)}% del gasto`,
      valueTone: riesgoTone,
      trend: null as CpaTrendSemantic | null,
    },
    {
      label: "CPA cuenta",
      value: formatCpaCuenta(cpaCuenta, currencyCode, locale),
      subtitle: cpaTrend != null ? "vs auditoría anterior" : "al auditar",
      valueTone: cpaTone,
      trend: cpaTrend,
    },
  ];

  const shellClass = `${kpiCardShellClasses(tintVariant)} flex min-h-0 min-w-0 flex-col ${
    compact ? "h-full gap-3 p-5" : "gap-5 p-6"
  }`;

  const header = (
    <div className="relative z-10 flex shrink-0 items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: tier.color }}
          aria-hidden
        />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#262B27]">
          Salud de la cuenta
        </span>
      </div>
      <span
        className="shrink-0 rounded-md px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white"
        style={{ backgroundColor: tier.color }}
      >
        {TIER_BADGE[tier.label]}
      </span>
    </div>
  );

  const heroText = (
    <div className="min-w-0 flex-1 space-y-2">
      <p
        className={`font-black leading-tight tracking-tight text-[#0a0a0a] ${
          compact ? "text-base" : "text-lg md:text-xl"
        }`}
      >
        {headline}
      </p>
      {textoUltimaAuditoria && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#657166]">
          Última auditoría:{" "}
          <span className="text-[#0a0a0a]">{textoUltimaAuditoria}</span>
        </p>
      )}
      {deltaVsAnterior != null && (
        <span
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
            deltaVsAnterior >= 0
              ? "bg-[#7EB893]/15 text-[#5B9A8B]"
              : "bg-[#E07070]/15 text-[#C4614A]"
          }`}
        >
          {deltaVsAnterior >= 0 ? "↑" : "↓"} {deltaVsAnterior >= 0 ? "+" : ""}
          {deltaVsAnterior} vs auditoría anterior
        </span>
      )}
      <StatusBadges
        badgeUltimaAuditoria={badgeUltimaAuditoria}
        cuentaSinCambiosUrgentes={cuentaSinCambiosUrgentes}
        compact={compact}
      />
    </div>
  );

  const chartBlock = showChart ? (
    <div className="relative z-10 w-full shrink-0 border-t border-[#CFD6C4]/50 pt-3">
      {!compact && (
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#262B27]">
          Evolución del score
        </p>
      )}
      <ScoreSparkline
        data={scoreHistorico}
        fechas={fechasHistorico}
        variant="light"
        accentColor={tier.color}
        compact
        dense={compact}
        maxPoints={compact ? 8 : 10}
      />
    </div>
  ) : null;

  const miniStatsGrid = (
    <div
      className={`relative z-10 grid w-full shrink-0 grid-cols-3 border-t border-[#CFD6C4]/50 ${
        compact ? "min-h-0 flex-1 gap-2 pt-3" : "gap-3 pt-4"
      }`}
    >
      {miniStatProps.map(stat => (
        <AccountHealthMiniStat
          key={stat.label}
          label={stat.label}
          value={stat.value}
          subtitle={stat.subtitle}
          valueTone={stat.valueTone}
          trend={stat.trend}
          trendAriaLocale={locale}
          compact={compact}
          fill={compact}
        />
      ))}
    </div>
  );

  const actions = (
    <div
      className={`relative z-10 flex w-full shrink-0 gap-2 ${
        compact ? "pt-1" : "flex-col sm:flex-row sm:items-stretch"
      }`}
    >
      <button
        type="button"
        onClick={onVerResumenSimple}
        disabled={!tieneAuditoria}
        className={`flex items-center justify-center gap-2 rounded-xl border border-[#CFD6C4] bg-[#0a0a0a] font-black uppercase tracking-widest text-[#FDE8D3] transition-colors hover:bg-[#262B27] disabled:cursor-not-allowed disabled:opacity-50 ${
          compact
            ? "min-w-0 flex-1 px-4 py-2.5 text-[10px]"
            : "flex-1 px-5 py-3 text-[10px]"
        }`}
      >
        <BookOpen size={compact ? 13 : 14} strokeWidth={2.5} />
        <span className="truncate">{resumenLabel}</span>
      </button>
      <button
        type="button"
        onClick={onHistorial}
        className={`flex items-center justify-center gap-2 rounded-xl border border-[#CFD6C4] bg-[#F4F1EC] font-black uppercase tracking-widest text-[#262B27] transition-colors hover:bg-[#E8ECE4] ${
          compact
            ? "shrink-0 px-4 py-2.5 text-[10px]"
            : "px-5 py-3 text-[10px] sm:shrink-0"
        }`}
      >
        <History size={compact ? 13 : 14} strokeWidth={2.5} />
        Historial
      </button>
    </div>
  );

  if (!compact) {
    return (
      <div data-kpi-card="" className={shellClass}>
        {header}
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex shrink-0 justify-center sm:justify-start">
            <ScoreRing score={score} size={ringSize} variant="light" />
          </div>
          {heroText}
        </div>
        {chartBlock}
        <div className="relative z-10 grid grid-cols-1 gap-3 border-t border-[#CFD6C4]/50 pt-4 sm:grid-cols-3">
          {miniStatProps.map(stat => (
            <AccountHealthMiniStat
              key={stat.label}
              label={stat.label}
              value={stat.value}
              subtitle={stat.subtitle}
              valueTone={stat.valueTone}
              trend={stat.trend}
              trendAriaLocale={locale}
            />
          ))}
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div data-kpi-card="" className={shellClass}>
      {header}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex w-full shrink-0 items-center gap-3">
          <div className="flex shrink-0">
            <ScoreRing score={score} size={ringSize} variant="light" />
          </div>
          {heroText}
        </div>
        {chartBlock}
        {miniStatsGrid}
        {actions}
      </div>
    </div>
  );
}
