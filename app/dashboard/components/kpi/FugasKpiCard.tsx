"use client";

import DashboardKpiCard from "./DashboardKpiCard";
import KpiIconBox from "./KpiIconBox";
import { KpiFugasAlertIcon, KpiFugasOkIcon } from "./icons/KpiAnimatedIcons";
import { getFugasCardState, type KpiTintVariant } from "./dashboardKpiTheme";

type FugasKpiCardProps = {
  fugasCount: number;
};

export default function FugasKpiCard({ fugasCount }: FugasKpiCardProps) {
  const state = getFugasCardState(fugasCount);
  const tintVariant: KpiTintVariant =
    state.mode === "critico" ? "salmon" : "olive";

  return (
    <DashboardKpiCard
      tintVariant={tintVariant}
      accentColor={state.accent}
      badge={state.badge}
    >
      <p className="text-sm font-black uppercase tracking-widest text-[#262B27]">
        Fugas
      </p>

      <KpiIconBox color={state.accent}>
        {state.mode === "critico" ? (
          <KpiFugasAlertIcon size={22} />
        ) : (
          <KpiFugasOkIcon size={22} />
        )}
      </KpiIconBox>

      {state.showCount ? (
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black leading-none tracking-tighter text-[#C4614A]">
            {fugasCount}
          </span>
          <span className="text-sm font-black uppercase tracking-widest text-[#657166]">
            Fugas críticas
          </span>
        </div>
      ) : (
        <p className="line-clamp-3 text-lg font-bold leading-snug text-[#0a0a0a]">
          {state.message}
        </p>
      )}
    </DashboardKpiCard>
  );
}
