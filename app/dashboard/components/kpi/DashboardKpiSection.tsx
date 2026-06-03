"use client";

import { useMemo } from "react";
import type {
  DaypartingReporte,
  SimuladorPresupuestoReporte,
} from "../../../../lib/motorMora";
import type { ItemResumenHallazgo } from "../../ResumenFacilPanel";
import AccountHealthCard from "./AccountHealthCard";
import QuickWinsDelDiaPanel from "./QuickWinsDelDiaPanel";
import SecondaryKpiGrid from "./SecondaryKpiGrid";
import {
  buildAccountHealthMiniStats,
  type CpaTrendSemantic,
} from "./accountHealthMetrics";

type BadgeAuditoria = "recomendado" | "desactualizada" | null;

type EscenarioSim = NonNullable<
  SimuladorPresupuestoReporte["escenarios"][number]
>;

export type DashboardKpiSectionProps = {
  score: number;
  fugasCount: number;
  textoUltimaAuditoria: string | null;
  badgeUltimaAuditoria: BadgeAuditoria;
  cuentaSinCambiosUrgentes: boolean;
  scoreHistorico: number[];
  fechasHistorico: string[];
  deltaVsAnterior: number | null;
  reporteJson: unknown;
  cpaCuenta: number | null;
  cpaTrend: CpaTrendSemantic | null;
  currencyCode: string;
  locale: string;
  resumenLabel: string;
  tieneAuditoria: boolean;
  onVerResumenSimple: () => void;
  onHistorial: () => void;
  ahorroNGramas: number;
  subtituloDestripador: string;
  tieneDatosDestripador: boolean;
  onOpenDestripador: () => void;
  daypartingReporte: DaypartingReporte | null;
  franjasDaypartingPendientes: number;
  ahorroMensualDayparting: number;
  onOpenDayparting: () => void;
  simuladorReporte: SimuladorPresupuestoReporte | null;
  escenarioSimRecomendado: EscenarioSim | null;
  onOpenSimulador: () => void;
  quickWins: ItemResumenHallazgo[];
  quickWinsCompletados: string[];
  razonesScore: string[];
  onQuickWinDetalle: (win: ItemResumenHallazgo) => void;
  onQuickWinAccion: (win: ItemResumenHallazgo, winId: string) => void;
  onVerCampanas: () => void;
};

export default function DashboardKpiSection(props: DashboardKpiSectionProps) {
  const {
    score,
    fugasCount,
    textoUltimaAuditoria,
    badgeUltimaAuditoria,
    cuentaSinCambiosUrgentes,
    scoreHistorico,
    fechasHistorico,
    deltaVsAnterior,
    reporteJson,
    cpaCuenta,
    cpaTrend,
    currencyCode,
    locale,
    resumenLabel,
    tieneAuditoria,
    onVerResumenSimple,
    onHistorial,
    ahorroNGramas,
    subtituloDestripador,
    tieneDatosDestripador,
    onOpenDestripador,
    daypartingReporte,
    franjasDaypartingPendientes,
    ahorroMensualDayparting,
    onOpenDayparting,
    simuladorReporte,
    escenarioSimRecomendado,
    onOpenSimulador,
    quickWins,
    quickWinsCompletados,
    razonesScore,
    onQuickWinDetalle,
    onQuickWinAccion,
    onVerCampanas,
  } = props;

  const miniStats = useMemo(
    () => buildAccountHealthMiniStats(reporteJson),
    [reporteJson]
  );

  const mostrarQuickWins =
    quickWins.length > 0 || cuentaSinCambiosUrgentes;

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div
        className={
          mostrarQuickWins
            ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.38fr)] lg:items-stretch"
            : "grid grid-cols-1 gap-6"
        }
      >
        <AccountHealthCard
          score={score}
          textoUltimaAuditoria={textoUltimaAuditoria}
          badgeUltimaAuditoria={badgeUltimaAuditoria}
          cuentaSinCambiosUrgentes={cuentaSinCambiosUrgentes}
          scoreHistorico={scoreHistorico}
          fechasHistorico={fechasHistorico}
          deltaVsAnterior={deltaVsAnterior}
          miniStats={miniStats}
          cpaCuenta={cpaCuenta}
          cpaTrend={cpaTrend}
          currencyCode={currencyCode}
          locale={locale}
          resumenLabel={resumenLabel}
          tieneAuditoria={tieneAuditoria}
          onVerResumenSimple={onVerResumenSimple}
          onHistorial={onHistorial}
          compact={mostrarQuickWins}
        />
        {mostrarQuickWins && (
          <QuickWinsDelDiaPanel
            quickWins={quickWins}
            completados={quickWinsCompletados}
            cuentaSinCambiosUrgentes={cuentaSinCambiosUrgentes}
            razonesScore={razonesScore}
            onAbrirDetalle={onQuickWinDetalle}
            onAccionPrimary={onQuickWinAccion}
            onVerCampanas={onVerCampanas}
          />
        )}
      </div>

      <SecondaryKpiGrid
        fugasCount={fugasCount}
        ahorroNGramas={ahorroNGramas}
        subtituloDestripador={subtituloDestripador}
        tieneDatosDestripador={tieneDatosDestripador}
        onOpenDestripador={onOpenDestripador}
        daypartingReporte={daypartingReporte}
        franjasDaypartingPendientes={franjasDaypartingPendientes}
        ahorroMensualDayparting={ahorroMensualDayparting}
        onOpenDayparting={onOpenDayparting}
        simuladorReporte={simuladorReporte}
        escenarioSimRecomendado={escenarioSimRecomendado}
        onOpenSimulador={onOpenSimulador}
      />
    </div>
  );
}
