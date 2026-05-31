"use client";

import { useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import {
  etiquetaScoreCampana,
  formatearCpaCampana,
  gastoEnBucket,
  impactoFinancieroApagar,
  impactoFinancieroEscalar,
  type MatrizBucketId,
  type MatrizItemEval,
} from "../../../lib/campanasEvaluacion";

type Props = {
  evaluaciones: MatrizItemEval[];
  cpaPromedio: number;
};

export default function MatrizCampanas({ evaluaciones, cpaPromedio }: Props) {
  const [abierta, setAbierta] = useState<MatrizBucketId | null>(null);

  const buckets = {
    escalar: evaluaciones.filter(e => e.evaluacion.tag === "ESTRELLA"),
    testear: evaluaciones.filter(e => e.evaluacion.tag === "POTENCIAL"),
    observar: evaluaciones.filter(e => e.evaluacion.tag === "DUDOSO"),
    apagar: evaluaciones.filter(e => e.evaluacion.tag === "BASURA"),
  };

  const bloques: {
    id: MatrizBucketId;
    label: string;
    subtitulo: string;
    accionSugerida: string;
    color: string;
    border: string;
    hover: string;
    items: MatrizItemEval[];
    impactoLabel: string;
    impactoValor: number;
  }[] = [
    {
      id: "escalar",
      label: "Escalar",
      subtitulo: "CPA bajo objetivo",
      accionSugerida: "Subí presupuesto o priorizá estas campañas para capturar más demanda.",
      color: "text-[#10B981]",
      border: "border-[#10B981]/50",
      hover: "hover:border-[#10B981] hover:bg-[#10B981]/5",
      items: buckets.escalar,
      impactoLabel: "potencial conservador",
      impactoValor: Math.round(impactoFinancieroEscalar(buckets.escalar)),
    },
    {
      id: "testear",
      label: "Dar tiempo",
      subtitulo: "Pocas conversiones aún",
      accionSugerida: "Dejá que acumulen data antes de escalar o frenar.",
      color: "text-blue-400",
      border: "border-blue-400/50",
      hover: "hover:border-blue-400 hover:bg-blue-400/5",
      items: buckets.testear,
      impactoLabel: "en evaluación",
      impactoValor: Math.round(gastoEnBucket(buckets.testear)),
    },
    {
      id: "observar",
      label: "Revisar",
      subtitulo: "CPA mejorable",
      accionSugerida: "Optimizá pujas y términos antes de mover presupuesto.",
      color: "text-[#EAB308]",
      border: "border-[#EAB308]/50",
      hover: "hover:border-[#EAB308] hover:bg-[#EAB308]/5",
      items: buckets.observar,
      impactoLabel: "gasto monitoreado",
      impactoValor: Math.round(gastoEnBucket(buckets.observar)),
    },
    {
      id: "apagar",
      label: "Frenar",
      subtitulo: "CPA insostenible",
      accionSugerida: "Recortá o pausá; el presupuesto puede ir a campañas Escalar.",
      color: "text-[#E07070]",
      border: "border-[#E07070]/50",
      hover: "hover:border-[#E07070] hover:bg-[#E07070]/5",
      items: buckets.apagar,
      impactoLabel: "desperdiciados est.",
      impactoValor: Math.round(impactoFinancieroApagar(buckets.apagar)),
    },
  ];

  if (evaluaciones.length === 0) {
    return (
      <div className="bg-[#292524] border border-[#44403C] rounded-2xl p-8 text-center text-[#A8A29E] text-sm">
        No hay campañas activas para la matriz con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 px-1">
        <h3 className="text-base font-black text-[#F5F0EB] flex items-center gap-2">
          <LayoutGrid className="text-[#D4A843]" size={20} /> Matriz de Rendimiento
        </h3>
        <p className="text-[11px] text-[#A8A29E] mt-1 font-bold uppercase tracking-widest">
          Clasificación por score, CPA vs objetivo · CPA cuenta ${cpaPromedio.toFixed(2)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {bloques.map(bloque => {
          const isAbierto = abierta === bloque.id;
          const tieneItems = bloque.items.length > 0;
          const listaVisible = bloque.items.slice(0, 8);
          const restantes = bloque.items.length - listaVisible.length;

          return (
            <div
              key={bloque.id}
              className={`bg-[#292524] border-2 ${bloque.border} rounded-2xl overflow-hidden shadow-sm transition-all ${tieneItems ? `cursor-pointer ${bloque.hover}` : "opacity-50"}`}
            >
              <button
                type="button"
                disabled={!tieneItems}
                onClick={() => tieneItems && setAbierta(isAbierto ? null : bloque.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className={`text-[10px] font-black ${bloque.color} uppercase tracking-widest`}>
                      {bloque.label}
                    </span>
                    <p className="text-[9px] text-[#A8A29E] font-bold mt-0.5">{bloque.subtitulo}</p>
                  </div>
                  {tieneItems && (
                    <ChevronDown
                      size={14}
                      className={`text-[#A8A29E] shrink-0 transition-transform ${isAbierto ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-[#F5F0EB]">{bloque.items.length}</span>
                  <span className="text-[10px] text-[#A8A29E] font-bold">campañas</span>
                </div>
                {tieneItems && (
                  <p className={`text-xs font-bold mt-2 ${bloque.color}`}>
                    ${bloque.impactoValor.toLocaleString()}/mes {bloque.impactoLabel}
                  </p>
                )}
              </button>

              {isAbierto && tieneItems && (
                <div className="border-t border-[#44403C]/60 px-3 pb-3 space-y-1.5 max-h-64 overflow-y-auto">
                  {listaVisible.map(({ campana, evaluacion, cpaObjetivo }) => (
                    <div
                      key={campana.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-[#1C1917] px-2.5 py-2 border border-[#44403C]/40"
                    >
                      <p className="text-[11px] font-bold text-[#F5F0EB] truncate flex-1" title={campana.nombre}>
                        {campana.nombre}
                      </p>
                      <div className="flex items-center gap-2 shrink-0 text-[10px] font-black">
                        <span className="text-[#78716C]">{formatearCpaCampana(evaluacion.cpaActual)}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            evaluacion.tag === "SIN_DATOS"
                              ? "bg-[#44403C]/50 text-[#78716C]"
                              : (evaluacion.score ?? 0) >= 70
                                ? "bg-[#10B981]/10 text-[#10B981]"
                                : (evaluacion.score ?? 0) < 40
                                  ? "bg-[#E07070]/10 text-[#E07070]"
                                  : "bg-[#EAB308]/10 text-[#EAB308]"
                          }`}
                        >
                          {etiquetaScoreCampana(evaluacion)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {restantes > 0 && (
                    <p className="text-[10px] text-[#A8A29E] font-bold text-center pt-1">+{restantes} más</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
