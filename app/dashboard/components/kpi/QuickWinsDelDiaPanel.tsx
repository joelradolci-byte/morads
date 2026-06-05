"use client";

import { ArrowRight, Check, CheckCircle2, Wrench, Zap } from "lucide-react";
import type { ItemResumenHallazgo } from "../../ResumenFacilPanel";
import {
  esQuickWinTool,
  quickWinPrimaryLabel,
  textoQuickWin,
} from "../../reportes/quickWinsDisplay";
import { KPI_CARD_SURFACE } from "./dashboardKpiTheme";

export type QuickWinsDelDiaPanelProps = {
  quickWins: ItemResumenHallazgo[];
  completados: string[];
  cuentaSinCambiosUrgentes: boolean;
  razonesScore: string[];
  onAccion: (win: ItemResumenHallazgo, winId: string) => void;
  onVerCampanas: () => void;
};

export default function QuickWinsDelDiaPanel({
  quickWins,
  completados,
  cuentaSinCambiosUrgentes,
  razonesScore,
  onAccion,
  onVerCampanas,
}: QuickWinsDelDiaPanelProps) {
  const todosCompletados =
    quickWins.length > 0 && completados.length === quickWins.length;
  const sinUrgentes = quickWins.length === 0 && cuentaSinCambiosUrgentes;

  return (
    <div className={`flex h-full min-h-0 flex-col p-6 ${KPI_CARD_SURFACE}`}>
      {sinUrgentes ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#5B9A8B]/35 bg-[#5B9A8B]/8 p-8 text-center">
          <CheckCircle2 size={40} className="mb-4 text-[#5B9A8B]" />
          <h3 className="text-xl font-black tracking-tight text-[#262B27]">
            No hay acciones urgentes hoy
          </h3>
          <p className="mt-2 max-w-md text-base font-medium leading-relaxed text-[#657166]">
            {razonesScore.length > 0
              ? razonesScore.join(" ")
              : "Tu cuenta está en buen estado. Si tenés tiempo, revisá el detalle por campaña."}
          </p>
          <button
            type="button"
            onClick={onVerCampanas}
            className="mt-4 text-sm font-black uppercase tracking-widest text-[#C4614A] transition-colors hover:text-[#262B27]"
          >
            Ver detalle por campaña →
          </button>
        </div>
      ) : todosCompletados ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#5B9A8B]/35 bg-[#5B9A8B]/8 p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5B9A8B]/15 text-[#5B9A8B] shadow-sm">
            <CheckCircle2 size={32} strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-[#262B27]">
            ¡Cuenta blindada por hoy!
          </h3>
          <p className="mt-2 max-w-md text-base font-medium leading-relaxed text-[#657166]">
            Completaste las 3 acciones prioritarias recomendadas por Mora para este
            ciclo. El capital diario de tu cliente está seguro.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-lg font-black text-[#262B27]">
                <Zap className="shrink-0 text-[#D4A843]" size={22} />
                Quick Wins del Día
              </h3>
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-[#8A968C]">
                Si tenés 10 minutos, empezá acá
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-[#E5C9A8]/50 bg-[#FFF5EB] px-3 py-1.5 text-sm font-black text-[#657166]">
              {completados.length} de {quickWins.length} Completados
            </span>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            {quickWins.map((win, idx) => {
              const winId = win.id_rastreo || `win-${idx}-${win.titulo}`;
              const esCompletado = completados.includes(winId);
              const esTool = esQuickWinTool(win.id_rastreo);

              return (
                <div
                  key={winId}
                  className={`relative flex min-h-[128px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-colors duration-200 ${
                    esCompletado
                      ? "border-[#5B9A8B]/30 bg-[#5B9A8B]/5 opacity-60"
                      : "border-[#E5C9A8]/45 bg-white/70 hover:border-[#CFD6C4] hover:bg-white/90"
                  }`}
                >
                  <div>
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[11px] font-black uppercase tracking-widest ${
                        esCompletado
                          ? "border-[#5B9A8B]/25 bg-[#5B9A8B]/10 text-[#5B9A8B]"
                          : win.tipo === "critico"
                            ? "border-[#E07070]/25 bg-[#E07070]/10 text-[#C4614A]"
                            : "border-[#D4A843]/25 bg-[#D4A843]/10 text-[#B8860B]"
                      }`}
                    >
                      {esCompletado
                        ? "Solucionado"
                        : win.tipo === "critico"
                          ? "Urgente"
                          : "Optimización"}
                    </span>
                    <h4
                      className={`mt-3 text-lg font-black leading-snug text-[#262B27] ${
                        esCompletado ? "line-through opacity-60" : ""
                      }`}
                    >
                      {win.titulo}
                    </h4>
                    <p className="mt-2 line-clamp-2 text-base font-medium leading-relaxed text-[#657166]">
                      {textoQuickWin(win)}
                    </p>
                  </div>

                  <div className="mt-4 shrink-0 border-t border-[#E5C9A8]/35 pt-3">
                    {!esCompletado ? (
                      <button
                        type="button"
                        onClick={() => onAccion(win, winId)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5C9A8]/50 bg-[#0a0a0a] px-3 py-2.5 text-xs font-black uppercase tracking-widest text-[#FDE8D3] transition-colors duration-200 hover:bg-[#262B27]"
                      >
                        {esTool ? (
                          <>
                            <Wrench size={15} />
                            {quickWinPrimaryLabel(win.id_rastreo)}
                          </>
                        ) : (
                          <>
                            {quickWinPrimaryLabel(win.id_rastreo)}
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-sm font-black uppercase tracking-widest text-[#5B9A8B]">
                        <Check size={14} strokeWidth={3} />
                        Listo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
