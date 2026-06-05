"use client";

import { useId, useMemo, useState } from "react";
import { KPI_WARM } from "./dashboardKpiTheme";

export type ScoreSparklineProps = {
  data: number[];
  fechas: string[];
  variant?: "dark" | "light";
  accentColor?: string;
  compact?: boolean;
  /** Altura mínima (p. ej. salud de cuenta junto a Quick Wins). */
  dense?: boolean;
  /** Aún más bajo cuando la columna de salud es estrecha. */
  minimal?: boolean;
  maxPoints?: number;
};

const DARK_THEME = {
  grid: "#44403C",
  stroke: "#F3C3B2",
  pointFill: "#F3C3B2",
  pointStroke: "#292524",
  label: "#A8A29E",
  labelHover: "#F5F0EB",
  tooltipBg: "#1C1917",
  tooltipBorder: "#44403C",
  tooltipText: "#F5F0EB",
  tooltipSub: "#A8A29E",
  gradOpacity: 0.2,
};

const LIGHT_THEME = {
  grid: "#E5C9A8",
  stroke: KPI_WARM.red,
  pointFill: KPI_WARM.red,
  pointStroke: "#FFFFFF",
  label: "#657166",
  labelHover: "#0a0a0a",
  tooltipBg: "#0a0a0a",
  tooltipBorder: "#E5C9A8",
  tooltipText: "#FDE8D3",
  tooltipSub: "#CFD6C4",
  gradOpacity: 0.12,
};

function formatFechaShort(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function ScoreSparkline({
  data,
  fechas,
  variant = "light",
  accentColor,
  compact = false,
  dense = false,
  minimal = false,
  maxPoints = 10,
}: ScoreSparklineProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const gradId = useId().replace(/:/g, "");

  const { plotData, plotFechas } = useMemo(() => {
    const n = Math.min(maxPoints, data.length, fechas.length);
    if (n <= 0) return { plotData: [] as number[], plotFechas: [] as string[] };
    const start = Math.max(0, data.length - n);
    return {
      plotData: data.slice(start),
      plotFechas: fechas.slice(start),
    };
  }, [data, fechas, maxPoints]);

  if (plotData.length < 2) return null;

  const theme = variant === "dark" ? DARK_THEME : LIGHT_THEME;
  const stroke = accentColor ?? theme.stroke;

  const min = Math.min(...plotData);
  const max = Math.max(...plotData);
  const range = max - min || 1;
  const w = 500;
  const h = minimal ? 56 : dense ? 88 : compact ? 100 : 140;
  const padX = minimal ? 24 : dense ? 28 : compact ? 32 : 40;
  const padTop = minimal ? 30 : dense ? 34 : compact ? 38 : 48;
  const padBottom = minimal ? 14 : dense ? 18 : compact ? 24 : 28;
  const svgH = h;
  const datesH = 18;
  const outerH = svgH + datesH;

  const plotH = h - padTop - padBottom;

  const coords = plotData.map((v, i) => {
    const x = padX + (i / (plotData.length - 1)) * (w - padX * 2);
    const y = padTop + plotH - ((v - min) / range) * plotH;
    return { x, y, v };
  });

  const polyline = coords.map(c => `${c.x},${c.y}`).join(" ");
  const areaPoints = `${coords[0].x},${h - padBottom} ${polyline} ${coords[coords.length - 1].x},${h - padBottom}`;

  const hoveredPoint = hovered != null ? coords[hovered] : null;

  return (
    <div
      className="relative w-full overflow-visible"
      style={{ height: `${outerH}px` }}
    >
      <div className="relative w-full overflow-visible" style={{ height: `${svgH}px` }}>
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-20 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-bold leading-none shadow-md"
            style={{
              left: `${(hoveredPoint.x / w) * 100}%`,
              top: `${(hoveredPoint.y / h) * 100}%`,
              transform: "translate(-50%, calc(-100% - 12px))",
              backgroundColor: theme.tooltipBg,
              borderColor: theme.tooltipBorder,
              color: theme.tooltipText,
            }}
          >
            {hoveredPoint.v}/100
          </div>
        )}
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full"
          style={{ height: `${svgH}px` }}
          preserveAspectRatio="xMidYMid meet"
        >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={theme.gradOpacity} />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map(val => {
          const y = padTop + plotH - ((val - min) / range) * plotH;
          if (y < padTop || y > padTop + plotH + 5) return null;
          return (
            <line
              key={val}
              x1={padX}
              y1={y}
              x2={w - padX}
              y2={y}
              stroke={theme.grid}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}

        <polygon points={areaPoints} fill={`url(#${gradId})`} />
        <polyline
          points={polyline}
          fill="none"
          stroke={stroke}
          strokeWidth={compact ? 2.5 : 3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={compact ? 4 : 5}
              fill={stroke}
              stroke={theme.pointStroke}
              strokeWidth="2"
            />
            <circle
              cx={c.x}
              cy={c.y}
              r="16"
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            />
          </g>
        ))}
        </svg>
      </div>

      <div
        className="flex justify-between"
        style={{
          paddingLeft: `${(padX / w) * 100}%`,
          paddingRight: `${(padX / w) * 100}%`,
        }}
      >
        {plotFechas.map((f, i) => (
          <span
            key={i}
            className={`text-xs font-bold transition-colors ${
              hovered === i ? "" : ""
            }`}
            style={{ color: hovered === i ? theme.labelHover : theme.label }}
          >
            {formatFechaShort(f)}
          </span>
        ))}
      </div>
    </div>
  );
}
