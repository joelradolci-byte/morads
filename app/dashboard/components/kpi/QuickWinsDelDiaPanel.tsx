"use client";

import { Check, CheckCircle2, Zap } from "lucide-react";
import type { ItemResumenHallazgo } from "../../ResumenFacilPanel";
import { quickWinPrimaryLabel, textoQuickWin } from "../../reportes/quickWinsDisplay";

export type QuickWinsDelDiaPanelProps = {
  quickWins: ItemResumenHallazgo[];
  completados: string[];
  cuentaSinCambiosUrgentes: boolean;
  razonesScore: string[];
  onAbrirDetalle: (win: ItemResumenHallazgo) => void;
  onAccionPrimary: (win: ItemResumenHallazgo, winId: string) => void;
  onVerCampanas: () => void;
};

export default function QuickWinsDelDiaPanel({
  quickWins,
  completados,
  cuentaSinCambiosUrgentes,
  razonesScore,
  onAbrirDetalle,
  onAccionPrimary,
  onVerCampanas,
}: QuickWinsDelDiaPanelProps) {
  const todosCompletados =
    quickWins.length > 0 && completados.length === quickWins.length;
  const sinUrgentes = quickWins.length === 0 && cuentaSinCambiosUrgentes;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-[#44403C] bg-[#292524] p-6 shadow-2xl">
      {sinUrgentes ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#10B981]/30 bg-[#10B981]/10 p-8 text-center">
          <CheckCircle2 size={40} className="mb-4 text-[#10B981]" />
          <h3 className="text-xl font-black tracking-tight text-[#F5F0EB]">
            No hay acciones urgentes hoy
          </h3>
          <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-[#A8A29E]">
            {razonesScore.length > 0
              ? razonesScore.join(" ")
              : "Tu cuenta está en buen estado. Si tenés tiempo, revisá el detalle por campaña."}
          </p>
          <button
            type="button"
            onClick={onVerCampanas}
            className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#F3C3B2] transition-colors hover:text-[#F5F0EB]"
          >
            Ver detalle por campaña →
          </button>
        </div>
      ) : todosCompletados ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#10B981]/30 bg-[#10B981]/10 p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/20 text-[#10B981] shadow-lg">
            <CheckCircle2 size={32} strokeWidth={3} />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white">
            ¡Cuenta blindada por hoy!
          </h3>
          <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-[#A8A29E]">
            Completaste las 3 acciones prioritarias recomendadas por Mora para este
            ciclo. El capital diario de tu cliente está seguro.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="flex items-center gap-2 text-base font-black text-[#F5F0EB]">
                <Zap className="shrink-0 text-[#F3C3B2]" size={20} />
                Quick Wins del Día
              </h3>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[#A8A29E]">
                Si tenés 10 minutos, empezá acá
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-[#44403C] bg-[#1C1917] px-3 py-1.5 text-[10px] font-black text-[#F3C3B2]">
              {completados.length} de {quickWins.length} Completados
            </span>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            {quickWins.map((win, idx) => {
              const winId = win.id_rastreo || `win-${idx}-${win.titulo}`;
              const esCompletado = completados.includes(winId);

              return (
                <div
                  key={winId}
                  className={`relative flex min-h-[120px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl border p-3 transition-colors duration-200 ${
                    esCompletado
                      ? "border-[#10B981]/30 bg-[#10B981]/5 opacity-50"
                      : "border-[#44403C] bg-[#1C1917] hover:border-[#57534E]"
                  }`}
                >
                  <div>
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                        esCompletado
                          ? "border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]"
                          : win.tipo === "critico"
                            ? "border-[#E07070]/20 bg-[#E07070]/10 text-[#E07070]"
                            : "border-[#D4A843]/20 bg-[#D4A843]/10 text-[#D4A843]"
                      }`}
                    >
                      {esCompletado
                        ? "Solucionado"
                        : win.tipo === "critico"
                          ? "Urgente"
                          : "Optimización"}
                    </span>
                    <h4
                      className={`mt-3 text-sm font-black leading-tight text-[#F5F0EB] ${
                        esCompletado ? "line-through opacity-60" : ""
                      }`}
                    >
                      {win.titulo}
                    </h4>
                    <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-relaxed text-[#A8A29E]">
                      {textoQuickWin(win)}
                    </p>
                  </div>

                  <div className="mt-4 flex shrink-0 items-center justify-between gap-2 border-t border-[#44403C]/30 pt-3">
                    <button
                      type="button"
                      onClick={() => onAbrirDetalle(win)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] transition-colors hover:text-[#F5F0EB]"
                    >
                      Ver detalle
                    </button>
                    {!esCompletado ? (
                      <button
                        type="button"
                        onClick={() => onAccionPrimary(win, winId)}
                        className="shrink-0 rounded-xl border border-[#CFD6C4]/40 bg-[#0a0a0a] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[#FDE8D3] transition-colors duration-200 hover:bg-[#262B27]"
                      >
                        {quickWinPrimaryLabel(win.id_rastreo)}
                      </button>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#10B981]">
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
