"use client";

import { Target, Folder, ArrowRight } from "lucide-react";
import {
  campanasPacingAlerta,
  ordenarPacingDashboard,
  type CampanaEvaluada,
} from "../../../lib/campanasEvaluacion";
import PacingDashboardMiniCard from "./PacingDashboardMiniCard";
import {
  buildDevPacingPreviewMocks,
  DEV_MOCK_PACING_PREVIEW,
} from "./pacingResumenDevMocks";

type Props = {
  evaluadas: CampanaEvaluada[];
  cargando: boolean;
  onVerTodas: () => void;
};

export default function PacingResumenCuenta({ evaluadas, cargando, onVerTodas }: Props) {
  const useMocks = DEV_MOCK_PACING_PREVIEW;
  const alertas = useMocks
    ? buildDevPacingPreviewMocks()
    : campanasPacingAlerta(evaluadas);
  const top = ordenarPacingDashboard(alertas).slice(0, 3);
  const activas = useMocks
    ? evaluadas.filter(e => e.campana.estado === "ENABLED").length || alertas.length
    : evaluadas.filter(e => e.campana.estado === "ENABLED").length;
  const showCargando = cargando && !useMocks;
  const showVacio = evaluadas.length === 0 && !useMocks;

  return (
    <section className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF5EB]"
              aria-hidden
            >
              <Target className="text-[#5B9A8B]" size={18} />
            </span>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#262B27]">
              Pacing de presupuesto
            </h3>
          </div>
          <p className="mt-2 pl-[2.75rem] text-[11px] font-bold uppercase tracking-wide text-[#8A968C]">
            Resumen · Gestioná el detalle en Campañas
          </p>
        </div>
        {activas > 0 && (
          <button
            type="button"
            onClick={onVerTodas}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-[#E5C9A8]/45 bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#262B27] transition-colors hover:border-[#5B9A8B]/35 hover:bg-white"
          >
            Ver pacing de todas ({activas}) <ArrowRight size={15} />
          </button>
        )}
      </div>

      {showCargando ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#5B9A8B]" />
        </div>
      ) : showVacio ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Folder className="mb-2 h-10 w-10 text-[#CFD6C4]" />
          <p className="text-base font-bold text-[#657166]">Sin datos de presupuesto</p>
        </div>
      ) : alertas.length === 0 ? (
        <p className="py-4 text-base font-bold text-[#5B9A8B]">
          Todas las campañas activas van en ritmo adecuado este mes.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {top.map(item => (
              <PacingDashboardMiniCard key={item.campana.id} item={item} />
            ))}
          </div>
          {alertas.length > 3 && (
            <p className="mt-4 text-center text-sm font-bold text-[#657166]">
              +{alertas.length - 3} campañas más requieren revisión de pacing
            </p>
          )}
        </>
      )}
    </section>
  );
}
