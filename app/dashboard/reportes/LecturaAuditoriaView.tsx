"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { etiquetaBadgeSalud, type NivelSalud } from "../../../lib/saludMora";
import { tituloHumanoHallazgo, textoHallazgoParaUsuario } from "../../../lib/resumenFacil";

type HallazgoItem = {
  id_rastreo?: string;
  titulo?: string;
  sin_accion_requerida?: boolean;
  nivel_salud?: string;
  descripcion_simple?: string;
  descripcion_tecnica?: string;
  descripcion?: string;
  [key: string]: unknown;
};

type ReporteLectura = {
  health_score?: number;
  score_general?: number;
  hallazgos?: {
    graves_rojo?: HallazgoItem[];
    debiles_amarillo?: HallazgoItem[];
    bien_verde?: HallazgoItem[];
  };
  diagnostico_salud?: {
    cuenta?: { nivel?: NivelSalud };
    campanas?: Record<string, { nivel?: NivelSalud }>;
  };
};

type LecturaAuditoriaViewProps = {
  reporte: ReporteLectura;
  score: number;
  fechaLabel: string;
  labels: {
    score: string;
    puntajeBasado: string;
    problemas: string;
    mejoras: string;
  };
  explicacionClara: boolean;
  modoHistorico: boolean;
  onAbrirResumenFacil: () => void;
};

export default function LecturaAuditoriaView({
  reporte,
  score,
  fechaLabel,
  labels,
  explicacionClara,
  modoHistorico,
  onAbrirResumenFacil,
}: LecturaAuditoriaViewProps) {
  const rojos = reporte.hallazgos?.graves_rojo ?? [];
  const amarillos = reporte.hallazgos?.debiles_amarillo ?? [];
  const verdes = reporte.hallazgos?.bien_verde ?? [];
  const diagSalud = reporte.diagnostico_salud;
  const scoreDisplay =
    score ?? reporte.health_score ?? reporte.score_general ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#1C1917] border border-[#44403C] rounded-[2rem] p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-[#44403C]/50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#292524] border border-[#44403C] text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">
                <Clock size={12} />
                Registro histórico
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F3C3B2]">
                {fechaLabel}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center border border-[#44403C] bg-[#292524] text-3xl md:text-4xl font-black text-[#F5F0EB] shadow-inner">
                {scoreDisplay}
              </div>
              <div>
                <h2 className="text-2xl md:text-4xl font-black text-[#F5F0EB]">
                  {labels.score}
                </h2>
                <p className="text-[#A8A29E] text-sm mt-2 font-bold">
                  {labels.puntajeBasado}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onAbrirResumenFacil}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#E0E7FF]/50 bg-[#E0E7FF]/15 text-[#E0E7FF] hover:bg-[#E0E7FF]/25 transition-all text-[11px] font-black uppercase tracking-widest shrink-0"
          >
            <BookOpen size={14} />
            Leer resumen fácil
          </button>
        </div>

        <p className="text-sm text-[#A8A29E] font-medium mt-4 leading-relaxed max-w-2xl">
          {modoHistorico
            ? "Registro del pasado: Mora describe cómo estaba la cuenta en esa fecha. Los hallazgos pueden haber cambiado desde entonces."
            : "Foto del estado de la cuenta en esa fecha. Los hallazgos pueden haber cambiado desde entonces; esta vista es solo de consulta."}
        </p>
      </div>

      {rojos.length > 0 && (
        <div className="bg-[#292524] p-8 md:p-10 rounded-3xl border border-[#E07070]/30 shadow-sm">
          <h3 className="text-base font-black text-[#E07070] uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E07070]/10 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            {labels.problemas}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {rojos.map((item, i) => (
              <div key={`rojo-${item.id_rastreo ?? i}`} className="border-l-4 border-[#E07070]/30 pl-5">
                <p className="text-[#F5F0EB] font-black text-xl mb-2">
                  {tituloHumanoHallazgo(
                    item.id_rastreo ?? "",
                    item.titulo ?? "",
                    { modoHistorico }
                  )}
                </p>
                <p className="text-[#A8A29E] text-base leading-relaxed font-medium">
                  {textoHallazgoParaUsuario(item, explicacionClara, { modoHistorico })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {amarillos.length > 0 && (
        <div className="bg-[#292524] p-8 md:p-10 rounded-3xl border border-[#D4A843]/30 shadow-sm">
          <h3 className="text-base font-black text-[#D4A843] uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4A843]/10 flex items-center justify-center">
              <Zap size={20} />
            </div>
            {labels.mejoras}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {amarillos.map((item, i) => (
              <div key={`ama-${item.id_rastreo ?? i}`} className="border-l-4 border-[#D4A843]/30 pl-5">
                <p className="text-[#F5F0EB] font-black text-xl mb-2">
                  {tituloHumanoHallazgo(
                    item.id_rastreo ?? "",
                    item.titulo ?? "",
                    { modoHistorico }
                  )}
                </p>
                <p className="text-[#A8A29E] text-base leading-relaxed font-medium">
                  {textoHallazgoParaUsuario(item, explicacionClara, { modoHistorico })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {verdes.map((item, i) => {
        let nivelVerde: NivelSalud = "estable";
        if (item.id_rastreo === "CUENTA_SALUDABLE") {
          nivelVerde = diagSalud?.cuenta?.nivel ?? "estable";
        } else if (String(item.id_rastreo).startsWith("CAMPANA_SALUDABLE_")) {
          const campId = String(item.id_rastreo).replace("CAMPANA_SALUDABLE_", "");
          nivelVerde = diagSalud?.campanas?.[campId]?.nivel ?? "estable";
        }
        return (
          <div
            key={`verde-${item.id_rastreo ?? i}`}
            className="bg-[#292524] border border-[#44403C] shadow-lg rounded-3xl p-6 md:p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#10B981]/10 flex items-center justify-center">
                <CheckCircle2 size={12} className="text-[#10B981]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                {etiquetaBadgeSalud(nivelVerde)}
              </span>
            </div>
            <p className="text-lg font-black text-[#F5F0EB]">
              {tituloHumanoHallazgo(item.id_rastreo ?? "", item.titulo ?? "", {
                modoHistorico,
              })}
            </p>
            <p className="text-sm text-[#A8A29E] font-medium mt-2 leading-relaxed">
              {textoHallazgoParaUsuario(item, explicacionClara, { modoHistorico })}
            </p>
          </div>
        );
      })}

      {rojos.length === 0 && amarillos.length === 0 && verdes.length === 0 && (
        <div className="bg-[#1C1917] border border-[#44403C] rounded-2xl p-10 text-center text-[#A8A29E] font-medium">
          Esta auditoría no tiene hallazgos detallados guardados.
        </div>
      )}
    </div>
  );
}
