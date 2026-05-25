"use client";

import type { DaypartingHora } from "../../lib/motorMora";

export type DaypartingCeldaVisual = "base" | "bueno" | "fuga" | "sin_datos";

const DIAS_LABEL = ["L", "M", "M", "J", "V", "S", "D"] as const;

const CELDA_BG: Record<DaypartingCeldaVisual, string> = {
  base: "bg-[#3D3836]",
  bueno: "bg-[#D4A843]",
  fuga: "bg-[#E07070]",
  sin_datos: "bg-[#2A2624]",
};

export function celdaVisual(celda: DaypartingHora): DaypartingCeldaVisual {
  if (celda.estado === "fuga") return "fuga";
  if (celda.estado === "bueno") return "bueno";
  if (celda.gasto <= 0 && celda.clics <= 0) return "sin_datos";
  return "base";
}

export function tooltipCelda(celda: DaypartingHora): string {
  const label = celda.label || `${DIAS_LABEL[celda.dia_semana] ?? "?"} ${String(celda.hora).padStart(2, "0")}:00`;
  const estado =
    celda.estado === "fuga"
      ? "Fuga crítica"
      : celda.estado === "bueno"
        ? "Rendimiento óptimo"
        : "Sin patrón crítico";
  return `${label} — $${Math.round(celda.gasto)} gastados, ${celda.conversiones} conversiones (${estado})`;
}

export function isHeatmapLegacy24(heatmap: DaypartingHora[]): boolean {
  return heatmap.length === 24 && heatmap.every(c => c.dia_semana == null);
}

function matriz7x24(heatmap: DaypartingHora[]): { grid: DaypartingHora[][]; legacy: boolean } {
  const legacy = isHeatmapLegacy24(heatmap);
  if (legacy) {
    return {
      legacy: true,
      grid: [heatmap.map((c, i) => ({ ...c, dia_semana: 0, hora: c.hora ?? i }))],
    };
  }

  const grid: DaypartingHora[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, (_, h) => ({
      dia_semana: 0,
      hora: h,
      label: "",
      gasto: 0,
      clics: 0,
      conversiones: 0,
      cpa: null,
      estado: "sin_datos" as const,
      gasto_desperdiciado: 0,
      muestra_suficiente: false,
    }))
  );

  heatmap.forEach(c => {
    const d = c.dia_semana ?? 0;
    const h = c.hora;
    if (d >= 0 && d <= 6 && h >= 0 && h <= 23) {
      grid[d][h] = c;
    }
  });

  return { grid, legacy: false };
}

interface DaypartingHeatmapGridProps {
  heatmap: DaypartingHora[];
  /** panel = heatmap grande en drawer; compact reservado por si se reutiliza */
  size?: "panel" | "compact";
}

const HOUR_TICKS_PANEL = [0, 3, 6, 9, 12, 15, 18, 21, 23] as const;

export default function DaypartingHeatmapGrid({
  heatmap,
  size = "panel",
}: DaypartingHeatmapGridProps) {
  const { grid, legacy } = matriz7x24(heatmap);
  const isPanel = size === "panel";
  const cellH = isPanel ? "h-[16px] min-h-[14px]" : "h-[7px]";
  const gap = isPanel ? "gap-[4px]" : "gap-[2px]";
  const labelW = isPanel ? "w-5" : "w-3";
  const dayText = isPanel ? "text-[10px]" : "text-[8px]";
  const hourText = isPanel ? "text-[9px]" : "text-[8px]";

  return (
    <div className={`w-full flex flex-col ${gap}`}>
      {legacy && (
        <p className="text-[10px] text-[#EAB308] font-bold mb-1">
          Auditoría anterior (24h). Corré una auditoría nueva para ver matriz 7×24.
        </p>
      )}
      <div className={`flex ${gap} items-stretch`}>
        <div className={`shrink-0 ${labelW}`} aria-hidden />
        <div className={`flex-1 flex ${gap} min-w-0`}>
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 min-w-0" />
          ))}
        </div>
      </div>
      {grid.map((fila, d) => (
        <div key={d} className={`flex ${gap} items-stretch`}>
          <span
            className={`shrink-0 ${labelW} ${dayText} font-black text-[#A8A29E] flex items-center justify-center`}
          >
            {DIAS_LABEL[d]}
          </span>
          <div className={`flex-1 flex ${gap} min-w-0`}>
            {fila.map(celda => (
              <div
                key={`${d}-${celda.hora}`}
                title={tooltipCelda(celda)}
                className={`flex-1 min-w-0 rounded-[3px] ${cellH} ${CELDA_BG[celdaVisual(celda)]} transition-opacity hover:opacity-90 hover:ring-1 hover:ring-white/20`}
              />
            ))}
          </div>
        </div>
      ))}
      {isPanel && (
        <div className={`flex ${gap} pl-6 mt-1`}>
          {HOUR_TICKS_PANEL.map(h => (
            <span
              key={h}
              className={`flex-1 ${hourText} font-bold text-[#A8A29E] tabular-nums text-center min-w-0`}
            >
              {String(h).padStart(2, "0")}
            </span>
          ))}
        </div>
      )}
      <div
        className={`flex flex-wrap gap-x-4 gap-y-1.5 ${isPanel ? "mt-3" : "mt-1"} text-[9px] font-black uppercase tracking-widest`}
      >
        <span className="flex items-center gap-1.5 text-[#D4A843]">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#D4A843]" /> Óptimo
        </span>
        <span className="flex items-center gap-1.5 text-[#E07070]">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#E07070]" /> Fuga crítica
        </span>
        <span className="flex items-center gap-1.5 text-[#A8A29E]">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-[#3D3836]" /> Normal
        </span>
      </div>
    </div>
  );
}
