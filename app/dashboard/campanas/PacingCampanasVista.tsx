"use client";

import { Target } from "lucide-react";
import {
  formatearCpaCampana,
  obtenerAccionPacing,
  type CampanaEvaluada,
  type PacingAccionDef,
} from "../../../lib/campanasEvaluacion";

export type PacingAccionPendiente = PacingAccionDef & {
  campanaId: string;
  campanaNombre: string;
};

type Props = {
  items: CampanaEvaluada[];
  pacingUndoIds: string[];
  onAccion: (accion: PacingAccionPendiente) => void;
};

export default function PacingCampanasVista({ items, pacingUndoIds, onAccion }: Props) {
  const activas = items.filter(i => i.campana.estado === "ENABLED");

  if (activas.length === 0) {
    return (
      <p className="text-[#A8A29E] text-sm text-center py-12">No hay campañas activas con los filtros actuales.</p>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-black text-[#F5F0EB] flex items-center gap-2">
          <Target className="text-[#F3C3B2]" size={20} /> Pacing por campaña
        </h3>
        <p className="text-[11px] text-[#A8A29E] mt-1 font-bold uppercase tracking-widest">
          Consumo vs proyección · acciones Safe Apply
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activas.map(({ campana, pacing, evaluacion, cpaObjetivo }) => {
          const sinDatos = evaluacion.tag === "SIN_DATOS";
          const cpa = evaluacion.cpaActual;
          const cpaCritico =
            !sinDatos &&
            cpa != null &&
            (cpa > cpaObjetivo * 1.2 || evaluacion.tag === "BASURA");
          const accion = obtenerAccionPacing(campana, pacing, evaluacion, cpaObjetivo);
          const fueAplicada = pacingUndoIds.includes(String(campana.id));
          const alerta =
            cpaCritico && pacing.estado === "Sobreinvirtiendo"
              ? "Crítico: acelera gasto con CPA caro."
              : cpaCritico
                ? "Ritmo correcto. CPA alto — revisar en auditoría."
                : pacing.estado === "Subinvirtiendo" && evaluacion.tag === "ESTRELLA"
                  ? "Buen CPA: oportunidad para acelerar."
                  : pacing.descripcion;
          const presupuesto = Math.max(evaluacion.presupuesto, 1);
          const gasto = evaluacion.gasto;

          return (
            <div key={campana.id} className={`bg-[#1C1917] border ${pacing.border} rounded-2xl p-4 shadow-inner`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-[#F5F0EB] text-sm truncate" title={campana.nombre}>
                    {campana.nombre}
                  </h3>
                  <p className="text-[10px] text-[#A8A29E] font-bold uppercase tracking-widest mt-1">
                    Gastado: ${pacing.gasto.toLocaleString()} de ${pacing.presupuesto.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${pacing.bg} ${pacing.color}`}>
                    {pacing.estado}
                  </span>
                  {fueAplicada && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981]">
                      Aplicado
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="h-2 bg-[#292524] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${pacing.bar} transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min(pacing.porcentajeGasto, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#A8A29E] font-bold mt-1.5">
                  <span>{Math.round(pacing.porcentajeGasto)}% consumido</span>
                  <span>Restan ${pacing.presupuestoRestante.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <p className="text-[9px] text-[#A8A29E] uppercase font-black">Diario</p>
                  <p className="text-sm font-black text-[#F3C3B2]">${pacing.ajusteDiarioRecomendado.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[#A8A29E] uppercase font-black">CPA</p>
                  <p
                    className={`text-sm font-black ${
                      sinDatos ? "text-[#78716C]" : cpaCritico ? "text-[#E07070]" : "text-[#10B981]"
                    }`}
                  >
                    {formatearCpaCampana(cpa)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-[#A8A29E] uppercase font-black">Gasto</p>
                  <p className="text-sm font-black text-[#F5F0EB]">
                    ${gasto.toLocaleString()}/{presupuesto.toLocaleString()}
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl px-3 py-2 border text-[11px] font-bold leading-snug mb-3 ${
                  cpaCritico ? "bg-[#E07070]/10 border-[#E07070]/30 text-[#F3C3B2]" : "bg-[#292524] border-[#44403C] text-[#A8A29E]"
                }`}
              >
                {alerta}
              </div>

              {accion && (
                <button
                  type="button"
                  onClick={() =>
                    onAccion({
                      campanaId: String(campana.id),
                      campanaNombre: campana.nombre,
                      ...accion,
                    })
                  }
                  className="w-full text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-[#F3C3B2]/30 bg-[#F3C3B2]/10 text-[#F3C3B2] hover:bg-[#F3C3B2] hover:text-[#0a0a0a] transition-colors"
                >
                  {accion.labelBoton}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
