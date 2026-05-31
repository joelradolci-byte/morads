"use client";

import { Target, Folder, ArrowRight } from "lucide-react";
import {
  campanasPacingAlerta,
  etiquetaScoreCampana,
  type CampanaEvaluada,
} from "../../../lib/campanasEvaluacion";

type Props = {
  evaluadas: CampanaEvaluada[];
  cargando: boolean;
  onVerTodas: () => void;
};

export default function PacingResumenCuenta({ evaluadas, cargando, onVerTodas }: Props) {
  const alertas = campanasPacingAlerta(evaluadas);
  const top = alertas.slice(0, 3);
  const activas = evaluadas.filter(e => e.campana.estado === "ENABLED").length;

  return (
    <div className="bg-[#292524] border border-[#44403C] shadow-lg rounded-3xl p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-base font-black text-[#F5F0EB] flex items-center gap-2">
            <Target className="text-[#F3C3B2]" size={20} /> Pacing de Presupuesto
          </h3>
          <p className="text-[11px] text-[#A8A29E] mt-1 font-bold uppercase tracking-widest">
            Resumen · Gestioná el detalle en Campañas
          </p>
        </div>
        {activas > 0 && (
          <button
            type="button"
            onClick={onVerTodas}
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-[#F3C3B2]/30 text-[#F3C3B2] hover:bg-[#F3C3B2]/10 flex items-center gap-2 shrink-0"
          >
            Ver pacing de todas ({activas}) <ArrowRight size={14} />
          </button>
        )}
      </div>

      {cargando ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F3C3B2]" />
        </div>
      ) : evaluadas.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Folder className="w-10 h-10 text-[#44403C] mb-2" />
          <p className="text-[#A8A29E] text-sm">Sin datos de presupuesto</p>
        </div>
      ) : alertas.length === 0 ? (
        <p className="text-sm text-[#10B981] font-bold py-4">
          Todas las campañas activas van en ritmo adecuado este mes.
        </p>
      ) : (
        <div className="space-y-3">
          {top.map(({ campana, pacing, evaluacion }) => (
            <div
              key={campana.id}
              className={`flex items-center justify-between gap-3 rounded-xl border ${pacing.border} bg-[#1C1917] px-4 py-3`}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#F5F0EB] truncate">{campana.nombre}</p>
                <p className="text-[10px] text-[#A8A29E] font-bold mt-0.5">
                  {pacing.estado} · {Math.round(pacing.porcentajeGasto)}% del presupuesto
                </p>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shrink-0 ${pacing.bg} ${pacing.color}`}>
                Score {etiquetaScoreCampana(evaluacion)}
              </span>
            </div>
          ))}
          {alertas.length > 3 && (
            <p className="text-[10px] text-[#A8A29E] font-bold text-center">
              +{alertas.length - 3} campañas más requieren revisión de pacing
            </p>
          )}
        </div>
      )}
    </div>
  );
}
