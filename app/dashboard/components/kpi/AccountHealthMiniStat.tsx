"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { CpaTrendSemantic } from "./accountHealthMetrics";
import { cpaTrendAriaLabel } from "./accountHealthMetrics";

export type AccountHealthMiniStatValueTone = "alert" | "neutral" | "positive";
type ValueTone = AccountHealthMiniStatValueTone;

const VALUE_TONE_CLASS: Record<ValueTone, string> = {
  alert: "text-[#C4614A]",
  neutral: "text-[#0a0a0a]",
  positive: "text-[#5B9A8B]",
};

type AccountHealthMiniStatProps = {
  label: string;
  value: string;
  subtitle: string;
  valueTone?: ValueTone;
  trend?: CpaTrendSemantic | null;
  trendAriaLocale?: string;
  compact?: boolean;
  /** Ocupa la celda del grid (salud compacta). */
  fill?: boolean;
};

export default function AccountHealthMiniStat({
  label,
  value,
  subtitle,
  valueTone = "neutral",
  trend = null,
  trendAriaLocale,
  compact = false,
  fill = false,
}: AccountHealthMiniStatProps) {
  const TrendIcon = trend === "improved" ? TrendingDown : trend === "worsened" ? TrendingUp : null;
  const trendColor =
    trend === "improved" ? "text-[#5B9A8B]" : trend === "worsened" ? "text-[#C4614A]" : "";

  return (
    <div
      className={`flex min-w-0 flex-col rounded-xl border border-[#E8ECE4] bg-white shadow-[0_2px_8px_rgba(38,43,39,0.04)] ${
        fill ? "h-full w-full" : ""
      } ${compact ? "justify-between px-2.5 py-2" : "px-4 py-3"}`}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-[#262B27]">
        {label}
      </p>
      <div className="mt-0.5 flex min-w-0 items-center gap-1">
        <p
          className={`truncate font-black leading-none tracking-tighter ${VALUE_TONE_CLASS[valueTone]} ${
            compact ? "text-2xl" : "text-3xl"
          }`}
        >
          {value}
        </p>
        {TrendIcon && (
          <TrendIcon
            size={compact ? 18 : 22}
            strokeWidth={2.5}
            className={`shrink-0 ${trendColor}`}
            aria-label={cpaTrendAriaLabel(trend, trendAriaLocale)}
          />
        )}
      </div>
      <p
        className={`font-bold uppercase tracking-widest text-[#657166] ${
          compact
            ? "mt-1 line-clamp-2 text-[9px] leading-snug"
            : "mt-2 text-[10px]"
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}
