"use client";

import type { ReactNode } from "react";
import { hexToRgba } from "./dashboardKpiTheme";

type KpiIconBoxProps = {
  color: string;
  children: ReactNode;
  compact?: boolean;
};

export default function KpiIconBox({
  color,
  children,
  compact = false,
}: KpiIconBoxProps) {
  return (
    <div
      className={[
        "kpi-icon-box flex items-center justify-center border shadow-inner",
        compact ? "mb-0 h-8 w-8 shrink-0 rounded-lg" : "mb-3 h-12 w-12 rounded-2xl",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        color,
        borderColor: hexToRgba(color, 0.3),
        backgroundColor: hexToRgba(color, 0.1),
      }}
    >
      <span className="inline-flex">{children}</span>
    </div>
  );
}
