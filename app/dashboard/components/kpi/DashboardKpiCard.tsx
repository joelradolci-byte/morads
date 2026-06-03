"use client";

import type { ReactNode } from "react";
import {
  accentForTintVariant,
  hexToRgba,
  kpiCardShellClasses,
  metricCardShellClasses,
  type KpiTintVariant,
} from "./dashboardKpiTheme";

type DashboardKpiCardProps = {
  tintVariant: KpiTintVariant;
  appearance?: "cream" | "metric";
  accentColor?: string;
  badge?: string;
  onClick?: () => void;
  interactive?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export default function DashboardKpiCard({
  tintVariant,
  appearance = "cream",
  accentColor: accentColorProp,
  badge,
  onClick,
  interactive = false,
  disabled = false,
  className = "",
  children,
}: DashboardKpiCardProps) {
  const clickable = interactive && !disabled && !!onClick;
  const accentColor = accentColorProp ?? accentForTintVariant(tintVariant);
  const shellClasses =
    appearance === "metric"
      ? metricCardShellClasses(tintVariant)
      : kpiCardShellClasses(tintVariant);

  return (
    <div
      data-kpi-card=""
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={[
        shellClasses,
        clickable ? "cursor-pointer" : "",
        disabled ? "pointer-events-none opacity-70 grayscale" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {badge && (
        <div
          className="absolute right-5 top-5 z-20 rounded-lg border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest"
          style={{
            color: accentColor,
            borderColor: hexToRgba(accentColor, 0.25),
            backgroundColor: hexToRgba(accentColor, 0.1),
          }}
        >
          {badge}
        </div>
      )}
      <div className="relative z-10 flex h-full min-h-[140px] flex-col justify-between p-6">
        {children}
      </div>
    </div>
  );
}
