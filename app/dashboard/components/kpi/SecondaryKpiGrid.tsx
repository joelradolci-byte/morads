"use client";

import { Calculator, Clock, Trash2 } from "lucide-react";
import type {
  DaypartingReporte,
  SimuladorPresupuestoReporte,
} from "../../../../lib/motorMora";
import DashboardKpiCard from "./DashboardKpiCard";
import FugasKpiCard from "./FugasKpiCard";
import KpiIconBox from "./KpiIconBox";
import { KPI_WARM } from "./dashboardKpiTheme";

type EscenarioSim = NonNullable<
  SimuladorPresupuestoReporte["escenarios"][number]
>;

type SecondaryKpiGridProps = {
  fugasCount: number;
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
};

export default function SecondaryKpiGrid({
  fugasCount,
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
}: SecondaryKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <FugasKpiCard fugasCount={fugasCount} />

      <DashboardKpiCard
        tintVariant="gold"
        accentColor={KPI_WARM.gold}
        badge="N-gramas"
        interactive={tieneDatosDestripador}
        disabled={!tieneDatosDestripador}
        onClick={onOpenDestripador}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-[#262B27]">
          Recuperable
        </p>
        <KpiIconBox color={KPI_WARM.gold}>
          <Trash2 size={22} strokeWidth={2} />
        </KpiIconBox>
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-5xl font-black leading-none tracking-tighter text-[#D4A843]">
              ${ahorroNGramas.toLocaleString()}
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-[#657166]">
              N-gramas
            </span>
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#657166]">
            {subtituloDestripador}
          </p>
        </div>
      </DashboardKpiCard>

      <DashboardKpiCard
        tintVariant="gold"
        accentColor={KPI_WARM.gold}
        badge="Dayparting"
        interactive={!!daypartingReporte}
        disabled={!daypartingReporte}
        onClick={onOpenDayparting}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-[#262B27]">
          Patrones
        </p>
        <KpiIconBox color={KPI_WARM.gold}>
          <Clock size={22} strokeWidth={2} />
        </KpiIconBox>
        {daypartingReporte ? (
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className={`text-5xl font-black leading-none tracking-tighter ${
                  franjasDaypartingPendientes > 0
                    ? "text-[#C4614A]"
                    : "text-[#D4A843]"
                }`}
              >
                {franjasDaypartingPendientes}
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-[#657166]">
                {franjasDaypartingPendientes === 1
                  ? "Patrón crítico"
                  : "Patrones críticos"}
              </span>
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#657166]">
              ${ahorroMensualDayparting.toLocaleString()} recuperable/mes
            </p>
            {daypartingReporte.patron_principal && (
              <p className="mt-1.5 line-clamp-2 text-[9px] font-medium leading-snug text-[#4B5563]">
                {daypartingReporte.patron_principal.dias.join(" · ")} ·{" "}
                {String(daypartingReporte.patron_principal.hora_inicio).padStart(2, "0")}
                :00–
                {String(daypartingReporte.patron_principal.hora_fin).padStart(2, "0")}
                :00
              </p>
            )}
          </div>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#657166]">
            Corré una auditoría
          </p>
        )}
      </DashboardKpiCard>

      <DashboardKpiCard
        tintVariant="olive"
        accentColor={KPI_WARM.aqua}
        badge="Simulador"
        interactive={!!simuladorReporte}
        disabled={!simuladorReporte}
        onClick={onOpenSimulador}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-[#262B27]">
          Simulador
        </p>
        <KpiIconBox color={KPI_WARM.aqua}>
          <Calculator size={22} strokeWidth={2} />
        </KpiIconBox>
        {simuladorReporte && escenarioSimRecomendado ? (
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-black leading-none tracking-tighter text-[#5B9A8B]">
                +{escenarioSimRecomendado.conversiones_extra.pesimista}–
                {escenarioSimRecomendado.conversiones_extra.optimista}
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-[#657166]">
                Conv./mes
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[10px] font-bold uppercase tracking-widest text-[#657166]">
              Reasignando $
              {escenarioSimRecomendado.presupuesto_reasignable.toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#657166]">
            Corré una auditoría
          </p>
        )}
      </DashboardKpiCard>
    </div>
  );
}
